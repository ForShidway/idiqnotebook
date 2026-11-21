"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Search,
  Video,
  Loader2,
  Calendar,
} from "lucide-react";
import { getYouTubeThumbnailUrl } from "@/lib/utils";

export interface VideoLessonItem {
  _id: string;
  title: string;
  videoUrl: string;
  content: string;
  createdAt: string;
}

export default function VideosListPage() {
  const [videos, setVideos] = useState<VideoLessonItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("search", query.trim());
      }
      const res = await fetch(`/api/videos?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat daftar materi video.");
      }

      setVideos(json.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil materi video."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos("");
  }, [fetchVideos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos(search);
  };

  return (
    <div className="flex flex-col">
      {/* Header Banner Navy-Teal Lembut & Nyaman di Mata */}
      <div className="bg-gradient-to-r from-[#0b2239] via-[#12385b] to-[#1a6b72] text-white border-b border-white/10">
        <div className="w-[90%] max-w-[1280px] mx-auto py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#38c6b0] mb-1">
              <Video className="w-4 h-4" />
              Video &amp; Teks Penjelasan
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Materi Video Pembelajaran
            </h1>
            <p className="text-sm text-slate-200 mt-1">
              Pilih materi video untuk menonton penjelasan lengkap beserta
              catatan teks paragraf di bawahnya.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[90%] max-w-[1280px] mx-auto py-8">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Total{" "}
            <span className="font-bold text-[#0f2c59]">{videos.length}</span>{" "}
            materi video tersedia
          </p>

          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul materi video..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b9c85]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1b9c85] hover:bg-[#15806d] text-white text-sm font-bold rounded-md transition cursor-pointer"
            >
              Cari
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-md border border-slate-200 py-20 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#1b9c85] mx-auto mb-3" />
            <p className="text-sm">Memuat daftar materi video...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 py-16 px-4 text-center">
            <Video className="w-12 h-12 text-[#1b9c85] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#0f2c59]">
              Belum Ada Materi Video
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Materi video akan muncul di sini setelah ditambahkan oleh Admin.
            </p>
          </div>
        ) : (
          /* Grid 3 Kolom */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const thumbnail = getYouTubeThumbnailUrl(video.videoUrl);
              return (
                <div
                  key={video._id}
                  className="bg-white rounded-md border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col"
                >
                  {/* Video Thumbnail dengan Play Button Overlay */}
                  <Link
                    href={`/videos/${video._id}`}
                    className="relative aspect-video bg-slate-900 overflow-hidden group block"
                  >
                    {thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-95"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        YouTube Video
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white text-[#0f2c59] flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#1b9c85]" />
                        <span>
                          {new Date(video.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <h2 className="font-bold text-[#0f2c59] text-base leading-snug line-clamp-2">
                        {video.title}
                      </h2>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                        {video.content}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <Link
                        href={`/videos/${video._id}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#1b9c85] hover:bg-[#15806d] text-white text-xs sm:text-sm font-bold transition shadow-xs"
                      >
                        Tonton Materi
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
