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
} from "lucide-react";
import { getYouTubeEmbedUrl, parseContentParagraphs } from "@/lib/utils";
import type { VideoLessonItem } from "../page";
import type { VocabularyItem } from "@/components/VocabularyTableSection";

function VideoDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [lesson, setLesson] = useState<VideoLessonItem | null>(null);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b9c85] mx-auto mb-3" />
        <p className="text-sm text-slate-600">Memuat materi video...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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

  const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);
  const parsedParagraphs = parseContentParagraphs(lesson.content);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Navigasi Kembali */}
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0f2c59] hover:text-[#1b9c85] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Materi Video
        </Link>

        <a
          href={lesson.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1b9c85] transition"
        >
          Buka di YouTube
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Container Utama */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {/* 1. BAGIAN ATAS: Video Player Lebar Penuh & Responsif 16:9 */}
        <div className="w-full bg-black aspect-video relative">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={lesson.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-6 text-center">
              <Video className="w-10 h-10 mb-2 text-slate-400" />
              <p className="text-sm">
                Format URL video tidak dapat di-embed secara langsung.
              </p>
              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 px-4 py-2 rounded-md bg-[#1b9c85] text-white text-xs font-bold"
              >
                Tonton Video Asli
              </a>
            </div>
          )}
        </div>

        {/* 2. BAGIAN BAWAH VIDEO: Judul, Teks Materi (Paragraf Enter 2x) & Sidebar Kosakata */}
        <div className="p-6 sm:p-8">
          {/* Header Judul Materi */}
          <div className="border-b border-slate-200 pb-5 mb-6">
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

          {/* Grid Konten Teks & Sidebar Kosakata */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Kolom Teks Materi Penjelasan */}
            <div className="lg:col-span-8">
              <h2 className="text-base font-extrabold text-[#0f2c59] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#1b9c85] rounded-full inline-block" />
                Teks Materi
              </h2>

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1b9c85] mx-auto mb-3" />
          <p className="text-sm text-slate-600">Memuat materi video...</p>
        </div>
      }
    >
      <VideoDetailContent />
    </Suspense>
  );
}
