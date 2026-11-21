"use client";

import { useState, useEffect, useMemo, Fragment, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Video,
  Loader2,
  ExternalLink,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { getYouTubeEmbedUrl, parseContentParagraphs } from "@/lib/utils";
import type { VideoLessonItem, VideoLessonPageItem } from "../page";

interface MatchedVocabItem {
  _id: string;
  englishWord: string;
  englishWordNormalized: string;
  indonesianTranslate: string;
  weSpoke: string;
}

/**
 * Komponen Kata Interaktif dengan deteksi tepi kiri & kanan otomatis
 * agar kotak terjemahan (tooltip) tidak pernah terpotong di pinggir kiri atau kanan.
 */
function InteractiveWord({
  token,
  matched,
}: {
  token: string;
  matched: MatchedVocabItem;
}) {
  const [align, setAlign] = useState<"center" | "left" | "right">("center");

  const handlePositionCheck = (el: HTMLElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const container = el.closest("#materi-card-container");
    const bounds = container
      ? container.getBoundingClientRect()
      : { left: 16, right: window.innerWidth - 16 };

    const wordCenter = rect.left + rect.width / 2;
    const halfTooltip = 150; // Perkiraan setengah lebar maksimal tooltip

    if (wordCenter - halfTooltip < bounds.left + 20) {
      setAlign("left");
    } else if (wordCenter + halfTooltip > bounds.right - 20) {
      setAlign("right");
    } else {
      setAlign("center");
    }
  };

  const tooltipAlignClass =
    align === "left"
      ? "left-0 translate-x-0"
      : align === "right"
        ? "right-0 translate-x-0"
        : "left-1/2 -translate-x-1/2";

  const arrowAlignClass =
    align === "left"
      ? "left-5"
      : align === "right"
        ? "right-5"
        : "left-1/2 -translate-x-1/2";

  return (
    <span
      tabIndex={0}
      onMouseEnter={(e) => handlePositionCheck(e.currentTarget)}
      onFocus={(e) => handlePositionCheck(e.currentTarget)}
      className="relative inline-block group cursor-pointer rounded px-1 -mx-0.5 border-b border-dashed border-[#1b9c85] text-[#0f2c59] font-medium transition-colors duration-150 hover:bg-[#1b9c85] hover:text-white hover:border-transparent focus:bg-[#1b9c85] focus:text-white focus:outline-none"
    >
      {token}

      {/* Tooltip Popover saat Kursor Diarahkan (Otomatis Rata Kiri / Tengah / Kanan) */}
      <span
        className={`pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100 transition-all duration-150 absolute bottom-full ${tooltipAlignClass} mb-2 z-50 w-max min-w-[180px] max-w-[280px] px-3.5 py-2.5 rounded-lg bg-[#0b2239] text-white shadow-xl border border-white/15 text-left`}
      >
        <span className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-1.5 mb-1.5">
          <span className="font-extrabold text-xs text-[#5eead4] break-words">
            {matched.englishWord}
          </span>
          {matched.weSpoke && matched.weSpoke !== "-" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-[11px] font-semibold text-teal-100 whitespace-nowrap">
              <Volume2 className="w-3 h-3 text-[#38c6b0] shrink-0" />
              {matched.weSpoke}
            </span>
          )}
        </span>
        <span className="block text-xs font-semibold text-white leading-snug break-words">
          {matched.indonesianTranslate}
        </span>
        {/* Panah Bawah Tooltip */}
        <span
          className={`absolute top-full ${arrowAlignClass} border-4 border-transparent border-t-[#0b2239]`}
        />
      </span>
    </span>
  );
}

/**
 * Memecah satu baris teks menjadi token kata dan tanda baca/spasi,
 * lalu menandai kata-kata bahasa Inggris yang terdaftar di Tabel Kata
 * dengan highlight latar & tooltip terjemahan saat kursor diarahkan (hover).
 */
function renderInteractiveLine(
  line: string,
  vocabMap: Map<string, MatchedVocabItem>
) {
  if (!line || vocabMap.size === 0) return line;

  const tokens = line.split(/([a-zA-Z0-9]+(?:['-][a-zA-Z0-9]+)*)/g);

  return tokens.map((token, idx) => {
    if (!token) return null;

    const normalized = token.toLowerCase();
    const matched = vocabMap.get(normalized);

    if (!matched) {
      return <Fragment key={idx}>{token}</Fragment>;
    }

    return <InteractiveWord key={idx} token={token} matched={matched} />;
  });
}

function VideoDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [lesson, setLesson] = useState<VideoLessonItem | null>(null);
  const [matchedVocabs, setMatchedVocabs] = useState<MatchedVocabItem[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const videoRes = await fetch(`/api/videos/${id}`, {
          cache: "no-store",
        });

        const videoJson = await videoRes.json();
        if (!videoRes.ok) {
          throw new Error(videoJson.error || "Materi video tidak ditemukan.");
        }
        setLesson(videoJson.data);
        setMatchedVocabs(videoJson.matchedVocabularies || []);
        setCurrentPageIndex(0);
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

  // Buat Map kamus cepat dari kata-kata yang cocok dengan Tabel Kata
  const vocabMap = useMemo(() => {
    const map = new Map<string, MatchedVocabItem>();
    for (const item of matchedVocabs) {
      if (item.englishWordNormalized) {
        map.set(item.englishWordNormalized.toLowerCase(), item);
      }
    }
    return map;
  }, [matchedVocabs]);

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
      <div
        id="materi-card-container"
        className="bg-white rounded-md border border-slate-200 shadow-sm"
      >
        {/* 1. BAGIAN ATAS: Video Player Lebar Penuh & Responsif 16:9 */}
        {embedUrl && (
          <div className="w-full bg-black aspect-video relative rounded-t-md overflow-hidden">
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

        {/* 2. BAGIAN BAWAH VIDEO: Lebar Penuh 1 Kolom Tanpa Sidebar Kanan + Tooltip Terjemahan Kosakata */}
        <div className="p-6 sm:p-10">
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

          {/* Konten Teks Materi Penjelasan Lebar Penuh (1 Baris / Full Width) */}
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <h2 className="text-base font-extrabold text-[#0f2c59] uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#1b9c85] rounded-full inline-block" />
                Teks Materi{" "}
                {totalPages > 1 ? `— Halaman ${safePageIndex + 1}` : ""}
              </h2>

              {vocabMap.size > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15806d] bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-[#1b9c85]" />
                  Arahkan kursor ke kata bergaris bawah untuk melihat terjemahan
                  &amp; cara baca ({vocabMap.size} kata terdeteksi)
                </span>
              )}
            </div>

            <div className="space-y-5 text-slate-800 text-base sm:text-[17px] leading-relaxed">
              {parsedParagraphs.map((lines, pIndex) => (
                <p key={pIndex} className="text-slate-800 leading-8">
                  {lines.map((line, lIndex) => (
                    <Fragment key={lIndex}>
                      {renderInteractiveLine(line, vocabMap)}
                      {lIndex < lines.length - 1 && <br />}
                    </Fragment>
                  ))}
                </p>
              ))}
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
                  <span className="text-[#0f2c59]">{safePageIndex + 1}</span> /{" "}
                  <span className="text-[#1b9c85]">{totalPages}</span>
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
