import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import VideoLesson from "@/models/VideoLesson";
import { verifyAdminAuth } from "@/lib/auth";
import { extractYouTubeId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = request.nextUrl;
    const search = (searchParams.get("search") || "").trim();

    const filter: Record<string, unknown> = {};
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedSearch, "i");
      filter.$or = [{ title: regex }, { content: regex }];
    }

    const videos = await VideoLesson.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      data: videos,
      total: videos.length,
    });
  } catch (error) {
    console.error("GET /api/videos error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil daftar materi video.",
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

    const title = String(body.title || "").trim();
    const videoUrl = String(body.videoUrl || "").trim();
    const content = String(body.content || "").trim();

    if (!title || !videoUrl || !content) {
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

    const newLesson = await VideoLesson.create({
      title,
      videoUrl,
      content,
    });

    return NextResponse.json(
      {
        message: "Materi video berhasil ditambahkan.",
        data: newLesson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/videos error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan materi video.",
      },
      { status: 500 }
    );
  }
}
