import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, checkRateLimit } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(request);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${rate.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: "Email/Nama Pengguna atau Kata Sandi salah." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Autentikasi admin berhasil.",
    });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi akun." },
      { status: 500 }
    );
  }
}
