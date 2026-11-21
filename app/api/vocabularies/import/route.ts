import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { connectToDatabase } from "@/lib/mongodb";
import Vocabulary from "@/models/Vocabulary";
import { verifyAdminAuth } from "@/lib/auth";

interface ParsedRow {
  englishWord: string;
  englishWordNormalized: string;
  indonesianTranslate: string;
  weSpoke: string;
}

/**
 * Mencocokkan nama header kolom secara fleksibel (case-insensitive & tahan spasi berlebih)
 */
function findColumnValue(
  row: Record<string, unknown>,
  targetVariants: string[]
): string {
  for (const key of Object.keys(row)) {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, " ");
    const matches = targetVariants.some(
      (variant) =>
        normalizedKey === variant || normalizedKey.includes(variant)
    );
    if (matches && row[key] !== undefined && row[key] !== null) {
      return String(row[key]).trim();
    }
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: "Akses ditolak: Password Admin tidak valid." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File Excel (.xlsx / .xls) wajib diunggah." },
        { status: 400 }
      );
    }

    // OWASP File Upload Validation: Batasi ukuran maksimal 5 MB & ekstensi file
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file Excel terlalu besar (Maksimal 5 MB)." },
        { status: 413 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan file .xlsx atau .xls." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json(
        { error: "File Excel tidak memiliki sheet yang valid." },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      worksheet,
      { defval: "" }
    );

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { error: "File Excel kosong atau tidak memiliki baris data." },
        { status: 400 }
      );
    }

    // 1. Parse dan deduplikasi internal di dalam file Excel yang sama
    const uniqueInFileMap = new Map<string, ParsedRow>();
    let duplicateInFileCount = 0;
    let invalidRowCount = 0;

    for (const row of rawRows) {
      const englishWord = findColumnValue(row, [
        "english word",
        "english",
        "word",
        "kata inggris",
      ]);

      const indonesianTranslate = findColumnValue(row, [
        "indonesian translate",
        "indonesian",
        "translate",
        "terjemahan",
        "arti",
      ]);

      const weSpoke = findColumnValue(row, [
        "how to say (cara baca)",
        "how to say",
        "we spoke (cara baca)",
        "we spoke",
        "cara baca",
        "pronunciation",
        "lafal",
      ]);

      if (!englishWord) {
        invalidRowCount++;
        continue;
      }

      const englishWordNormalized = englishWord.trim().toLowerCase();

      if (uniqueInFileMap.has(englishWordNormalized)) {
        duplicateInFileCount++;
        continue;
      }

      uniqueInFileMap.set(englishWordNormalized, {
        englishWord: englishWord.trim(),
        englishWordNormalized,
        indonesianTranslate: indonesianTranslate || "-",
        weSpoke: weSpoke || "-",
      });
    }

    const candidateRows = Array.from(uniqueInFileMap.values());

    if (candidateRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "Tidak ditemukan kolom yang sesuai. Pastikan file Excel memiliki header kolom: 'English word', 'Indonesian translate', dan 'How to Say (Cara Baca)'.",
        },
        { status: 400 }
      );
    }

    // 2. Cek ke database MongoDB secara batch menggunakan $in
    const candidateNormalizedWords = candidateRows.map(
      (r) => r.englishWordNormalized
    );

    const existingDocs = await Vocabulary.find(
      { englishWordNormalized: { $in: candidateNormalizedWords } },
      { englishWordNormalized: 1 }
    ).lean();

    const existingSet = new Set(
      existingDocs.map((doc) => doc.englishWordNormalized)
    );

    // 3. Filter kata-kata yang benar-benar belum ada di database
    const newWordsToInsert = candidateRows.filter(
      (row) => !existingSet.has(row.englishWordNormalized)
    );

    const duplicateInDbCount = candidateRows.length - newWordsToInsert.length;
    const totalSkippedDuplicates = duplicateInFileCount + duplicateInDbCount;

    // 4. Gunakan operasi batch bulkWrite dengan upsert=$setOnInsert agar cepat dan bebas race-condition
    let insertedCount = 0;
    if (newWordsToInsert.length > 0) {
      const bulkOps = newWordsToInsert.map((item) => ({
        updateOne: {
          filter: { englishWordNormalized: item.englishWordNormalized },
          update: {
            $setOnInsert: {
              englishWord: item.englishWord,
              englishWordNormalized: item.englishWordNormalized,
              indonesianTranslate: item.indonesianTranslate,
              weSpoke: item.weSpoke,
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      const bulkResult = await Vocabulary.bulkWrite(bulkOps, {
        ordered: false,
      });
      insertedCount = bulkResult.upsertedCount;
    }

    return NextResponse.json({
      message: "Proses import file Excel selesai.",
      summary: {
        totalRowsRead: rawRows.length,
        addedCount: insertedCount,
        skippedDuplicateCount:
          totalSkippedDuplicates +
          (newWordsToInsert.length - insertedCount),
        duplicateInDatabase:
          duplicateInDbCount + (newWordsToInsert.length - insertedCount),
        duplicateInExcelFile: duplicateInFileCount,
        invalidOrEmptyRows: invalidRowCount,
      },
    });
  } catch (error) {
    console.error("POST /api/vocabularies/import error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memproses file Excel.",
      },
      { status: 500 }
    );
  }
}
