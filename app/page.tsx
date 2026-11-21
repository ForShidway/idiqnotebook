"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Play,
  ArrowRight,
  Sparkles,
  Video,
} from "lucide-react";
import VocabularyTableSection from "@/components/VocabularyTableSection";
import { getYouTubeThumbnailUrl } from "@/lib/utils";

interface VideoLessonSummary {
  _id: string;
  title: string;
  videoUrl: string;
  content: string;
  createdAt: string;
}

export default function HomePage() {
  const [heroSearch, setHeroSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [totalVocab, setTotalVocab] = useState<number>(0);
  const [recentVideos, setRecentVideos] = useState<VideoLessonSummary[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [vocabRes, videoRes] = await Promise.all([
          fetch("/api/vocabularies?page=1&limit=1", { cache: "no-store" }),
          fetch("/api/videos", { cache: "no-store" }),
        ]);

        if (vocabRes.ok) {
          const vocabJson = await vocabRes.json();
          setTotalVocab(vocabJson.pagination?.totalItems || 0);
        }

        if (videoRes.ok) {
          const videoJson = await videoRes.json();
          setRecentVideos((videoJson.data || []).slice(0, 3));
        }
      } catch {
        // Abaikan error statistik awal jika DB belum terhubung
      }
    }
    loadStats();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(heroSearch);
    const el = document.getElementById("tabel-kosakata");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col">
      {/* HERO SECTION - Warna Navy ke Soft Teal yang Nyaman di Mata & Tidak Menyilaukan */}
      <section className="relative bg-gradient-to-r from-[#0e243e] via-[#133859] to-[#1f6a6c] text-white overflow-hidden">
        <div className="w-[90%] max-w-[1280px] mx-auto pt-10 pb-24 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Kolom Kiri: Headline, CTA & Quick Search */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#7fe3d5] text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#38c6b0]" />
                Catatan Belajar
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Catatan Materi &amp; <br />
                <span className="text-[#5eead4]">Kosakata Bahasa Inggris</span>
              </h1>

              <p className="text-slate-200 text-base sm:text-lg max-w-xl leading-relaxed">
                Tempat menyimpan rangkuman materi yang sudah dipelajari
                dan kumpulan kosakata baru yang ditemukan lengkap dengan
                terjemahan dan cara bacanya .
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/vocabulary"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#1b9c85] hover:bg-[#15806d] text-white font-bold text-sm shadow-md transition"
                >
                  Lihat Catatan Kosakata
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/videos"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Buka Materi
                </Link>
              </div>

              {/* Quick Search Bar Kosakata */}
              <div className="pt-2 max-w-xl">
                <form
                  onSubmit={handleHeroSearch}
                  className="flex items-center bg-white rounded-md p-1.5 shadow-lg"
                >
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Cari kosakata yang pernah dicatat (contoh: Apple)..."
                    className="flex-1 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#1b9c85] hover:bg-[#15806d] text-white text-sm font-bold rounded-md transition cursor-pointer shrink-0"
                  >
                    Cari Kata
                  </button>
                </form>
                <p className="text-xs text-slate-300 mt-2">
                  * Ketik kata bahasa Inggris atau terjemahan Indonesia untuk
                  mencari langsung di tabel catatan bawah.
                </p>
              </div>
            </div>

            {/* Kolom Kanan: Ilustrasi Baru /image/hero-illustration.jpg yang Menyatu dengan Navy-Teal */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg xl:max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src="/image/hero-illustration.jpg"
                  alt="Ilustrasi Belajar Bahasa Inggris IdiqNotebook"
                  width={680}
                  height={510}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR - Melayang di bawah Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 w-full">
        <div className="bg-white rounded-md shadow-md border border-slate-200 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-5 sm:p-6 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0f2c59]">
              {totalVocab.toLocaleString("id-ID")}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
              Kata Terdaftar
            </p>
          </div>
          <div className="p-5 sm:p-6 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0f2c59]">
              100
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
              Kata Per Halaman
            </p>
          </div>
          <div className="p-5 sm:p-6 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0f2c59]">
              {recentVideos.length}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
              Materi Video Terbaru
            </p>
          </div>
          <div className="p-5 sm:p-6 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1b9c85]">
              100%
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
              Bebas Kata Duplikat
            </p>
          </div>
        </div>
      </section>

      {/* TABEL KOSAKATA UTAMA DI BERANDA (15 data + baris ke-16 Lihat Tabel Lengkapnya) */}
      <section className="w-[90%] max-w-[1280px] mx-auto py-12">
        <VocabularyTableSection
          initialSearch={submittedSearch}
          showTitle
          limitPerPage={15}
          isPreview
        />
      </section>

      {/* PREVIEW MATERI VIDEO PEMBELAJARAN TERBARU */}
      <section className="w-[90%] max-w-[1280px] mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0f2c59] flex items-center gap-2.5">
              <Video className="w-6 h-6 text-[#1b9c85]" />
              Materi Video Pembelajaran
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Tonton video penjelasan bahasa Inggris beserta rangkuman teks
              materi di bawahnya.
            </p>
          </div>
          <Link
            href="/videos"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1b9c85] hover:text-[#15806d]"
          >
            Lihat Semua Materi Video
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentVideos.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 p-8 text-center">
            <BookOpen className="w-10 h-10 text-[#1b9c85] mx-auto mb-2" />
            <p className="font-bold text-[#0f2c59]">
              Belum ada materi video yang ditambahkan
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Admin dapat menambahkan materi video YouTube dan penjelasan teks
              setelah Login.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1b9c85] hover:bg-[#15806d] text-white text-xs font-bold transition"
            >
              Login untuk Tambah Materi
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentVideos.map((video) => {
              const thumb = getYouTubeThumbnailUrl(video.videoUrl);
              return (
                <div
                  key={video._id}
                  className="bg-white rounded-md border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-95"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        Video YouTube
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white text-[#0f2c59] flex items-center justify-center shadow-md group-hover:scale-110 transition">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#0f2c59] text-base line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                        {video.content}
                      </p>
                    </div>

                    <Link
                      href={`/videos/${video._id}`}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#1b9c85] hover:bg-[#15806d] text-white text-xs font-bold transition"
                    >
                      Lihat Materi
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
