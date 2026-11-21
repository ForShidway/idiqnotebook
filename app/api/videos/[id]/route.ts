import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import VideoLesson, { IVideoLessonPage } from "@/models/VideoLesson";
import Vocabulary from "@/models/Vocabulary";
import { verifyAdminAuth } from "@/lib/auth";
import { extractYouTubeId } from "@/lib/utils";

/**
 * Mengekstrak kata-kata kandidat dari seluruh halaman teks materi
 * untuk dicocokkan secara efisien dengan koleksi Vocabulary di MongoDB.
 */
function extractCandidateTokens(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .map((w) => w.replace(/^['-]+|['-]+$/g, "").trim())
    .filter((w) => w.length > 0);

  const candidateSet = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    candidateSet.add(words[i]);
    // Dukung juga frasa 2 kata dan 3 kata jika ada di Tabel Kata
    if (i + 1 < words.length) {
      candidateSet.add(`${words[i]} ${words[i + 1]}`);
    }
    if (i + 2 < words.length) {
      candidateSet.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }
  return Array.from(candidateSet);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID materi video tidak valid." },
        { status: 400 }
      );
    }

    const lesson = await VideoLesson.findById(id).lean();

    if (!lesson) {
      return NextResponse.json(
        { error: "Materi video tidak ditemukan." },
        { status: 404 }
      );
    }

    // Gabungkan seluruh teks dari semua halaman materi untuk mencari kata yang terdaftar di Tabel Kata
    const allTexts = [
      lesson.content || "",
      ...(Array.isArray(lesson.pages)
        ? lesson.pages.map((p) => p.content || "")
        : []),
    ].join(" ");

    const candidateTokens = extractCandidateTokens(allTexts);

    const matchedVocabularies =
      candidateTokens.length > 0
        ? await Vocabulary.find(
            { englishWordNormalized: { $in: candidateTokens } },
            {
              englishWord: 1,
              englishWordNormalized: 1,
              indonesianTranslate: 1,
              weSpoke: 1,
            }
          ).lean()
        : [];

    return NextResponse.json({
      data: lesson,
      matchedVocabularies,
    });
  } catch (error) {
    console.error("GET /api/videos/[id] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil detail materi video.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: "Akses ditolak: Password Admin tidak valid." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID materi video tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const title = String(body.title || "").trim();
    const rawPages: unknown[] = Array.isArray(body.pages) ? body.pages : [];

    let normalizedPages: IVideoLessonPage[] = [];

    if (rawPages.length > 0) {
      if (rawPages.length > 5) {
        return NextResponse.json(
          { error: "Jumlah halaman materi maksimal adalah 5 halaman." },
          { status: 400 }
        );
      }

      for (let i = 0; i < rawPages.length; i++) {
        const item = rawPages[i] as Record<string, unknown>;
        const pVideoUrl = String(item?.videoUrl || "").trim();
        const pContent = String(item?.content || "").trim();

        if (!pContent) {
          return NextResponse.json(
            {
              error: `Teks penjelasan pada Halaman ${i + 1} wajib diisi.`,
            },
            { status: 400 }
          );
        }

        if (i === 0 && !pVideoUrl) {
          return NextResponse.json(
            { error: "Link Video YouTube pada Halaman 1 wajib diisi." },
            { status: 400 }
          );
        }

        if (pVideoUrl && !extractYouTubeId(pVideoUrl)) {
          return NextResponse.json(
            {
              error: `Link Video pada Halaman ${i + 1} tidak valid. Gunakan link YouTube seperti https://www.youtube.com/watch?v=... atau https://youtu.be/...`,
            },
            { status: 400 }
          );
        }

        normalizedPages.push({
          videoUrl: pVideoUrl,
          content: pContent,
        });
      }
    } else {
      const videoUrl = String(body.videoUrl || "").trim();
      const content = String(body.content || "").trim();

      if (!videoUrl || !content) {
        return NextResponse.json(
          {
            error:
              "Judul Materi, Link Video YouTube, dan Teks Penjelasan wajib diisi.",
          },
          { status: 400 }
        );
      }

      if (!extractYouTubeId(videoUrl)) {
        return NextResponse.json(
          {
            error:
              "Link Video tidak valid. Gunakan link YouTube seperti https://www.youtube.com/watch?v=... atau https://youtu.be/...",
          },
          { status: 400 }
        );
      }

      normalizedPages = [{ videoUrl, content }];
    }

    if (!title) {
      return NextResponse.json(
        { error: "Judul Materi wajib diisi." },
        { status: 400 }
      );
    }

    const firstPage = normalizedPages[0];

    const updated = await VideoLesson.findByIdAndUpdate(
      id,
      {
        title,
        videoUrl: firstPage.videoUrl,
        content: firstPage.content,
        pages: normalizedPages,
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Materi video tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Materi video berhasil diperbarui.",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/videos/[id] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui materi video.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: "Akses ditolak: Password Admin tidak valid." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "ID materi video tidak valid." },
        { status: 400 }
      );
    }

    const deleted = await VideoLesson.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json(
        { error: "Materi video tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Materi video berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/videos/[id] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghapus materi video.",
      },
      { status: 500 }
    );
  }
}
