import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#0b2239] via-[#12385b] to-[#1a6b72] text-white mt-auto border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* 3 Kolom Utama Sesuai Gambar Referensi Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/15">
          {/* Kolom 1: Logo & Deskripsi Singkat */}
          <div className="md:col-span-5 space-y-4">
            <Link
              href="/"
              className="inline-block bg-white px-3.5 py-2 rounded-md shadow-xs"
            >
              <Image
                src="/image/IN-logo2.png"
                alt="IdiqNotebook Logo"
                width={175}
                height={42}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-200 leading-relaxed max-w-sm">
              Buku catatan digital untuk menyimpan kosakata baru yang ditemukan
              dari Excel serta mendokumentasikan rangkuman materi video yang
              sudah dipelajari.
            </p>
          </div>

          {/* Kolom 2: Navigasi CEPAT */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#38c6b0]">
              CEPAT
            </h3>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>
                <Link
                  href="/"
                  className="hover:text-white hover:underline transition"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/vocabulary"
                  className="hover:text-white hover:underline transition"
                >
                  Tabel Kosakata
                </Link>
              </li>
              <li>
                <Link
                  href="/videos"
                  className="hover:text-white hover:underline transition"
                >
                  Materi Video
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-white hover:underline transition"
                >
                  Login Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: CONTACT */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#38c6b0]">
              CONTACT
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-200">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#38c6b0] shrink-0" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#38c6b0] shrink-0" />
                <span>support@idiqnotebook.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#38c6b0] shrink-0" />
                <span>MongoDB Atlas &bull; Next.js &bull; Vercel</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Baris Copyright Bawah */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-2">
          <p className="font-semibold">
            &copy; 2026 IdiqNotebook. All Rights Reserved.
          </p>
          <p className="text-slate-300/80">
            Catatan Materi &amp; Kosakata Bahasa Inggris &bull; Tersimpan Permanen di Cloud
          </p>
        </div>
      </div>
    </footer>
  );
}
