"use client";

import { useState, useEffect, Fragment, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Video,
  Loader2,
  ExternalLink,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { getYouTubeEmbedUrl, parseContentParagraphs } from "@/lib/utils";
import type { VideoLessonItem, VideoLessonPageItem } from "../page";
import type { VocabularyItem } from "@/components/VocabularyTableSection";

function VideoDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [lesson, setLesson] = useState<VideoLessonItem | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [sidebarVocabs, setSidebarVocabs] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const [videoRes, vocabRes] = await Promise.all([
          fetch(`/api/videos/${id}`, { cache: "no-store" }),
          fetch(`/api/vocabularies?page=1&limit=12`, { cache: "no-store" }),
        ]);

        const videoJson = await videoRes.json();
        if (!videoRes.ok) {
          throw new Error(videoJson.error || "Materi video tidak ditemukan.");
        }
        setLesson(videoJson.data);
        setCurrentPageIndex(0);

        if (vocabRes.ok) {
          const vocabJson = await vocabRes.json();
          setSidebarVocabs((vocabJson.data || []).slice(0, 10));
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat materi video."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="w-[90%] max-w-[1280px] mx-auto py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b9c85] mx-auto mb-3" />
        <p className="text-sm text-slate-600">Memuat materi video...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="w-[90%] max-w-[1280px] mx-auto py-16">
        <div className="bg-white rounded-md border border-red-200 p-8 text-center">
          <p className="text-lg font-bold text-red-700 mb-2">
            {error || "Materi video tidak ditemukan"}
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Materi yang Anda cari mungkin telah dihapus atau URL tidak valid.
          </p>
          <Link
            href="/videos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#0f2c59] text-white text-sm font-bold hover:bg-[#163d7a] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Materi Video
          </Link>
        </div>
      </div>
    );
  }

  // Susun daftar halaman (maksimal 5 halaman), mendukung kompatibilitas data lama
  const lessonPages: VideoLessonPageItem[] =
    lesson.pages && lesson.pages.length > 0
      ? lesson.pages
      : [{ videoUrl: lesson.videoUrl, content: lesson.content }];

  const totalPages = lessonPages.length;
  const safePageIndex = Math.min(
    Math.max(0, currentPageIndex),
    totalPages - 1
  );
  const activePage = lessonPages[safePageIndex];

  const activeVideoUrl = activePage.videoUrl || lesson.videoUrl;
  const embedUrl = activePage.videoUrl
    ? getYouTubeEmbedUrl(activePage.videoUrl)
    : safePageIndex === 0
      ? getYouTubeEmbedUrl(lesson.videoUrl)
      : null;

  const parsedParagraphs = parseContentParagraphs(activePage.content);

  const handleGoToPage = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= totalPages) return;
    setCurrentPageIndex(newIndex);
    const topElement = document.getElementById("materi-detail-top");
    if (topElement) {
      topElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div id="materi-detail-top" className="w-[90%] max-w-[1280px] mx-auto py-8">
      {/* Navigasi Kembali */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0f2c59] hover:text-[#1b9c85] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Materi Video
        </Link>

        <div className="flex items-center gap-4">
          {totalPages > 1 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#15806d] text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
              Halaman {safePageIndex + 1} dari {totalPages}
            </span>
          )}

          {activeVideoUrl && (
            <a
              href={activeVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1b9c85] transition"
            >
              Buka di YouTube
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Container Utama */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {/* 1. BAGIAN ATAS: Video Player Lebar Penuh & Responsif 16:9 (ditampilkan jika halaman ini memiliki video) */}
        {embedUrl && (
          <div className="w-full bg-black aspect-video relative">
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={`${lesson.title} - Halaman ${safePageIndex + 1}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        )}

        {/* 2. BAGIAN BAWAH VIDEO: Judul, Indikator Halaman, Teks Materi & Tombol Previous/Next */}
        <div className="p-6 sm:p-8">
          {/* Header Judul Materi & Tab Nomor Halaman */}
          <div className="border-b border-slate-200 pb-5 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#1b9c85]" />
                <span>
                  Dipublikasikan pada{" "}
                  {new Date(lesson.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2c59]">
                {lesson.title}
              </h1>
            </div>

            {/* Pemilih Halaman Cepat jika memiliki lebih dari 1 halaman */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 shrink-0">
                {lessonPages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleGoToPage(idx)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      idx === safePageIndex
                        ? "bg-[#0f2c59] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Hal {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid Konten Teks & Sidebar Kosakata */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Kolom Teks Materi Penjelasan */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-extrabold text-[#0f2c59] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-[#1b9c85] rounded-full inline-block" />
                    Teks Materi{" "}
                    {totalPages > 1
                      ? `— Halaman ${safePageIndex + 1}`
                      : ""}
                  </h2>
                </div>

                <div className="space-y-5 text-slate-800 text-base leading-relaxed">
                  {parsedParagraphs.map((lines, pIndex) => (
                    <p key={pIndex} className="text-slate-800 leading-7">
                      {lines.map((line, lIndex) => (
                        <Fragment key={lIndex}>
                          {line}
                          {lIndex < lines.length - 1 && <br />}
                        </Fragment>
                      ))}
                    </p>
                  ))}
                </div>
              </div>

              {/* Navigasi Halaman Materi (Previous & Next) di Akhir Halaman */}
              {totalPages > 1 && (
                <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleGoToPage(safePageIndex - 1)}
                    disabled={safePageIndex <= 0}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-xs sm:text-sm font-bold border border-slate-300 bg-white text-[#0f2c59] hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous (Halaman Sebelumnya)
                  </button>

                  <span className="text-xs sm:text-sm font-bold text-slate-600">
                    Halaman{" "}
                    <span className="text-[#0f2c59]">{safePageIndex + 1}</span>{" "}
                    / <span className="text-[#1b9c85]">{totalPages}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleGoToPage(safePageIndex + 1)}
                    disabled={safePageIndex >= totalPages - 1}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-xs sm:text-sm font-bold bg-[#1b9c85] hover:bg-[#15806d] text-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-xs"
                  >
                    Next (Halaman Berikutnya)
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Kolom Sidebar Kosakata Pendukung */}
            <aside className="lg:col-span-4">
              <div className="bg-slate-50 rounded-md border border-slate-200 p-5 sticky top-24">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                  <h3 className="font-extrabold text-[#0f2c59] text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#1b9c85]" />
                    Kosakata
                  </h3>
                  <Link
                    href="/vocabulary"
                    className="text-xs font-bold text-[#1b9c85] hover:underline"
                  >
                    Lihat Semua
                  </Link>
                </div>

                {sidebarVocabs.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Belum ada data kosakata di database.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200/80 text-sm">
                    {sidebarVocabs.map((item) => (
                      <li
                        key={item._id}
                        className="py-2.5 flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-[#0f2c59] text-xs sm:text-sm">
                            {item.englishWord}
                          </p>
                          <p className="text-xs text-slate-600">
                            {item.indonesianTranslate}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-[#15806d] text-[11px] font-semibold border border-teal-200 shrink-0">
                          <Volume2 className="w-3 h-3 text-[#1b9c85]" />
                          {item.weSpoke}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VideoDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-[90%] max-w-[1280px] mx-auto py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1b9c85] mx-auto mb-3" />
          <p className="text-sm text-slate-600">Memuat materi video...</p>
        </div>
      }
    >
      <VideoDetailContent />
    </Suspense>
  );
}
