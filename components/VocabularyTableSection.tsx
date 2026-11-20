"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  Loader2,
  RefreshCw,
} from "lucide-react";

export interface VocabularyItem {
  _id: string;
  englishWord: string;
  englishWordNormalized: string;
  indonesianTranslate: string;
  weSpoke: string;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface VocabularyTableSectionProps {
  initialSearch?: string;
  showTitle?: boolean;
}

export default function VocabularyTableSection({
  initialSearch = "",
  showTitle = true,
}: VocabularyTableSectionProps) {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 100,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVocabularies = useCallback(
    async (pageNumber: number, searchQuery: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(pageNumber),
          limit: "100",
        });
        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }

        const res = await fetch(`/api/vocabularies?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Gagal memuat data kosakata.");
        }

        setItems(json.data || []);
        setPagination(
          json.pagination || {
            page: pageNumber,
            limit: 100,
            totalItems: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat memuat data."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchVocabularies(1, activeSearch);
  }, [activeSearch, fetchVocabularies]);

  useEffect(() => {
    if (initialSearch !== undefined && initialSearch !== activeSearch) {
      setSearchInput(initialSearch);
      setActiveSearch(initialSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchVocabularies(newPage, activeSearch);
    const tableElement = document.getElementById("tabel-kosakata");
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const total = pagination.totalPages;
    const current = pagination.page;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startIndex = (pagination.page - 1) * pagination.limit;

  return (
    <section id="tabel-kosakata" className="w-full">
      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        {/* Header & Search Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {showTitle && (
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#1b9c85]" />
                <h2 className="text-xl font-extrabold text-[#0f2c59]">
                  Daftar Kosakata Bahasa Inggris
                </h2>
              </div>
            )}
            <p className="text-sm text-slate-600 mt-1">
              Menampilkan{" "}
              <span className="font-bold text-[#0f2c59]">
                {items.length > 0 ? startIndex + 1 : 0}–
                {startIndex + items.length}
              </span>{" "}
              dari total{" "}
              <span className="font-bold text-[#1b9c85]">
                {pagination.totalItems.toLocaleString("id-ID")}
              </span>{" "}
              kosakata terdaftar (100 kata / halaman)
            </p>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari kata Inggris / Indonesia..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b9c85] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1b9c85] hover:bg-[#15806d] text-white text-sm font-bold rounded-md transition shadow-xs cursor-pointer"
            >
              Cari
            </button>
            {activeSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setActiveSearch("");
                }}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-md transition cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchVocabularies(pagination.page, activeSearch)}
              title="Muat ulang data"
              className="p-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-md transition cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <p className="font-semibold">Tidak dapat memuat data kosakata:</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f2c59] text-white text-xs sm:text-sm uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6 font-bold w-16 text-center">
                  No
                </th>
                <th className="py-3.5 px-4 sm:px-6 font-bold">
                  English Word
                </th>
                <th className="py-3.5 px-4 sm:px-6 font-bold">
                  Indonesian Translate
                </th>
                <th className="py-3.5 px-4 sm:px-6 font-bold">
                  We Spoke (Cara Baca)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 animate-spin text-[#1b9c85]" />
                      <span>Memuat data kosakata dari MongoDB Atlas...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto">
                      <p className="font-bold text-slate-800 text-base">
                        {activeSearch
                          ? `Tidak ada kosakata yang cocok dengan "${activeSearch}"`
                          : "Belum ada data kosakata"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {activeSearch
                          ? "Coba gunakan kata kunci pencarian lainnya."
                          : "Admin dapat mengunggah file Excel kosakata setelah Login."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="hover:bg-teal-50/50 transition-colors odd:bg-white even:bg-slate-50/60"
                  >
                    <td className="py-3 px-4 sm:px-6 text-center font-semibold text-slate-500">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-3 px-4 sm:px-6 font-extrabold text-[#0f2c59]">
                      {item.englishWord}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-slate-700 font-medium">
                      {item.indonesianTranslate}
                    </td>
                    <td className="py-3 px-4 sm:px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 text-[#15806d] font-semibold text-xs sm:text-sm border border-teal-200">
                        <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#1b9c85]" />
                        {item.weSpoke}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer (100 item / halaman) */}
        <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-600">
            Halaman{" "}
            <span className="font-bold text-[#0f2c59]">{pagination.page}</span>{" "}
            dari{" "}
            <span className="font-bold text-[#0f2c59]">
              {pagination.totalPages}
            </span>{" "}
            &bull; Total{" "}
            <span className="font-bold text-[#1b9c85]">
              {pagination.totalItems.toLocaleString("id-ID")}
            </span>{" "}
            kata
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => handlePageChange(pageNum)}
                disabled={loading}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer ${
                  pageNum === pagination.page
                    ? "bg-[#0f2c59] text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
