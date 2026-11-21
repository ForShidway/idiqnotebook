import VocabularyTableSection from "@/components/VocabularyTableSection";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Tabel Kata Kosakata — IdiqNotebook",
  description:
    "Tabel kosakata bahasa Inggris dengan terjemahan Indonesia dan cara baca We Spoke (100 data per halaman).",
};

export default function VocabularyPage() {
  return (
    <div className="flex flex-col">
      {/* Sub-header Banner Navy-Teal Lembut & Nyaman di Mata */}
      <div className="bg-gradient-to-r from-[#0b2239] via-[#12385b] to-[#1a6b72] text-white border-b border-white/10">
        <div className="w-[90%] max-w-[1280px] mx-auto py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#38c6b0] mb-1">
              <BookOpen className="w-4 h-4" />
              Database Kosakata Permanen
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Tabel Kosakata Bahasa Inggris
            </h1>
            <p className="text-sm text-slate-200 mt-1">
              Menampilkan 100 kosakata per halaman lengkap dengan terjemahan
              Indonesia dan panduan cara baca (<em>We Spoke</em>).
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="w-[90%] max-w-[1280px] mx-auto py-8">
        <VocabularyTableSection showTitle={false} />
      </div>
    </div>
  );
}
