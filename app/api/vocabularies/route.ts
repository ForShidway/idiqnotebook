import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Vocabulary from "@/models/Vocabulary";
import { verifyAdminAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = request.nextUrl;
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "100", 10);
    const search = (searchParams.get("search") || "").trim();

    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit =
      Number.isNaN(limitParam) || limitParam < 1
        ? 100
        : Math.min(limitParam, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedSearch, "i");
      filter.$or = [
        { englishWord: regex },
        { indonesianTranslate: regex },
        { weSpoke: regex },
      ];
    }

    const [items, totalItems] = await Promise.all([
      Vocabulary.find(filter)
        .sort({ englishWordNormalized: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vocabulary.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/vocabularies error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data kosakata dari database.",
      },
      { status: 500 }
    );
  }
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
    const body = await request.json();

    const englishWord = String(body.englishWord || "").trim();
    const indonesianTranslate = String(body.indonesianTranslate || "").trim();
    const weSpoke = String(body.weSpoke || "").trim();

    if (!englishWord || !indonesianTranslate || !weSpoke) {
      return NextResponse.json(
        {
          error:
            "Semua kolom (English Word, Indonesian Translate, We Spoke) wajib diisi.",
        },
        { status: 400 }
      );
    }

    const englishWordNormalized = englishWord.toLowerCase();

    const existing = await Vocabulary.findOne({ englishWordNormalized }).lean();
    if (existing) {
      return NextResponse.json(
        {
          error: `Kata "${englishWord}" sudah terdaftar di dalam database (Duplikat ditolak).`,
        },
        { status: 409 }
      );
    }

    const created = await Vocabulary.create({
      englishWord,
      englishWordNormalized,
      indonesianTranslate,
      weSpoke,
    });

    return NextResponse.json(
      {
        message: "Kosakata berhasil ditambahkan.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/vocabularies error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan kosakata ke database.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: "Akses ditolak: Password Admin tidak valid." },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Parameter ID kosakata tidak valid." },
        { status: 400 }
      );
    }

    const deleted = await Vocabulary.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Data kosakata tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Kosakata berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/vocabularies error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghapus data kosakata.",
      },
      { status: 500 }
    );
  }
}
