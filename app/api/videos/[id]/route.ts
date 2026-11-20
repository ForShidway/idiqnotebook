import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import VideoLesson from "@/models/VideoLesson";
import { verifyAdminAuth } from "@/lib/auth";
import { extractYouTubeId } from "@/lib/utils";

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

    return NextResponse.json({ data: lesson });
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

    const updated = await VideoLesson.findByIdAndUpdate(
      id,
      { title, videoUrl, content },
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
