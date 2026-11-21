"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Video,
  Plus,
  Edit3,
  Trash2,
  Eye,
  LogOut,
  Loader2,
  BookOpen,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Volume2,
  ListChecks,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { VideoLessonItem, VideoLessonPageItem } from "../videos/page";
import type { VocabularyItem } from "@/components/VocabularyTableSection";

interface ImportSummary {
  totalRowsRead: number;
  addedCount: number;
  skippedDuplicateCount: number;
  duplicateInDatabase: number;
  duplicateInExcelFile: number;
  invalidOrEmptyRows: number;
}

type AdminTab = "tambah" | "kosakata" | "materi";

export default function AdminPage() {
  const router = useRouter();

  // State Autentikasi Admin
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUser, setAdminUser] = useState("Admin");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Tab Navigasi Admin
  const [activeTab, setActiveTab] = useState<AdminTab>("tambah");

  // State Import Excel Kosakata
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null
  );
  const [importError, setImportError] = useState<string | null>(null);

  // State Tambah Kosakata Satuan
  const [singleEnglish, setSingleEnglish] = useState("");
  const [singleIndo, setSingleIndo] = useState("");
  const [singleSpoke, setSingleSpoke] = useState("");
  const [singleVocabLoading, setSingleVocabLoading] = useState(false);
  const [singleVocabMessage, setSingleVocabMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // State Daftar Kosakata Admin (dengan fitur Hapus & Search)
  const [vocabItems, setVocabItems] = useState<VocabularyItem[]>([]);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabSearch, setVocabSearch] = useState("");
  const [vocabPage, setVocabPage] = useState(1);
  const [vocabTotalPages, setVocabTotalPages] = useState(1);
  const [vocabTotalItems, setVocabTotalItems] = useState(0);
  const [deletingVocabId, setDeletingVocabId] = useState<string | null>(null);

  // State Manajemen Video & Teks Materi (Multi-Halaman Maksimal 5 Halaman)
  const [videos, setVideos] = useState<VideoLessonItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videoSearch, setVideoSearch] = useState("");
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [lessonPages, setLessonPages] = useState<VideoLessonPageItem[]>([
    { videoUrl: "", content: "" },
  ]);
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [videoFeedback, setVideoFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadVideos = useCallback(async (query = "") => {
    setVideosLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      const res = await fetch(`/api/videos?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok) {
        setVideos(json.data || []);
      }
    } catch {
      // Abaikan error load awal
    } finally {
      setVideosLoading(false);
    }
  }, []);

  const loadAdminVocabularies = useCallback(
    async (pageNumber: number, searchQuery: string) => {
      setVocabLoading(true);
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
        if (res.ok) {
          setVocabItems(json.data || []);
          setVocabPage(json.pagination?.page || 1);
          setVocabTotalPages(json.pagination?.totalPages || 1);
          setVocabTotalItems(json.pagination?.totalItems || 0);
        }
      } catch {
        // Abaikan error
      } finally {
        setVocabLoading(false);
      }
    },
    []
  );

  // Cek sesi login; jika belum login arahkan ke halaman /login
  useEffect(() => {
    const savedPass =
      sessionStorage.getItem("idiq_admin_password") ||
      localStorage.getItem("idiq_admin_password");
    const savedUser =
      sessionStorage.getItem("idiq_admin_user") ||
      localStorage.getItem("idiq_admin_user") ||
      "Admin";

    if (savedPass) {
      setAdminPassword(savedPass);
      setAdminUser(savedUser);
      setIsAuthenticated(true);
      setCheckingAuth(false);
      loadVideos();
      loadAdminVocabularies(1, "");
    } else {
      setCheckingAuth(false);
      router.replace("/login");
    }
  }, [loadVideos, loadAdminVocabularies, router]);

  const handleLogout = () => {
    sessionStorage.removeItem("idiq_admin_password");
    sessionStorage.removeItem("idiq_admin_user");
    localStorage.removeItem("idiq_admin_password");
    localStorage.removeItem("idiq_admin_user");
    window.dispatchEvent(new Event("storage"));
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Unduh Contoh Template Excel (.xlsx)
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        "English word": "Accomplish",
        "Indonesian translate": "Menyelesaikan / Mencapai",
        "How to Say (Cara Baca)": "e-kom-plish",
      },
      {
        "English word": "Perseverance",
        "Indonesian translate": "Ketekunan / Kegigihan",
        "How to Say (Cara Baca)": "per-se-ver-ens",
      },
      {
        "English word": "Knowledge",
        "Indonesian translate": "Pengetahuan",
        "How to Say (Cara Baca)": "no-lij",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vocabulary");
    XLSX.writeFile(workbook, "template-kosakata-IdiqNotebook.xlsx");
  };

  // Handler Upload File Excel Kosakata
  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      setImportError("Pilih file Excel (.xlsx / .xls) terlebih dahulu.");
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", excelFile);

      const res = await fetch("/api/vocabularies/import", {
        method: "POST",
        headers: {
          "x-admin-password": adminPassword,
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
        }
        throw new Error(json.error || "Gagal mengimpor file Excel.");
      }

      setImportSummary(json.summary);
      setExcelFile(null);
      const fileInput = document.getElementById(
        "excel-file-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      loadAdminVocabularies(1, vocabSearch);
    } catch (err) {
      setImportError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengunggah file Excel."
      );
    } finally {
      setImporting(false);
    }
  };

  // Handler Tambah Kosakata Satuan
  const handleAddSingleVocab = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleVocabLoading(true);
    setSingleVocabMessage(null);

    try {
      const res = await fetch("/api/vocabularies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          englishWord: singleEnglish,
          indonesianTranslate: singleIndo,
          weSpoke: singleSpoke,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) handleLogout();
        throw new Error(json.error || "Gagal menambahkan kosakata.");
      }

      setSingleVocabMessage({
        type: "success",
        text: `Kata "${singleEnglish}" berhasil disimpan ke database!`,
      });
      setSingleEnglish("");
      setSingleIndo("");
      setSingleSpoke("");
      loadAdminVocabularies(vocabPage, vocabSearch);
    } catch (err) {
      setSingleVocabMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan kosakata.",
      });
    } finally {
      setSingleVocabLoading(false);
    }
  };

  // Handler Hapus Kosakata
  const handleDeleteVocab = async (id: string, word: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus kosakata "${word}" secara permanen?`
    );
    if (!confirmed) return;

    setDeletingVocabId(id);
    try {
      const res = await fetch(`/api/vocabularies?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword,
        },
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) handleLogout();
        throw new Error(json.error || "Gagal menghapus kosakata.");
      }
      loadAdminVocabularies(vocabPage, vocabSearch);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus kosakata.");
    } finally {
      setDeletingVocabId(null);
    }
  };

  // Handler Ubah Nilai Halaman Materi
  const handlePageFieldChange = (
    index: number,
    field: keyof VideoLessonPageItem,
    value: string
  ) => {
    setLessonPages((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  // Handler Checkbox "Tambahkan halaman lain" (Maksimal 5 Halaman)
  const handleToggleNextPage = (currentIndex: number, checked: boolean) => {
    if (checked) {
      if (lessonPages.length >= 5) return;
      setLessonPages((prev) => [...prev, { videoUrl: "", content: "" }]);
    } else {
      // Hapus halaman setelah currentIndex
      setLessonPages((prev) => prev.slice(0, currentIndex + 1));
    }
  };

  // Handler Submit (Tambah / Edit) Materi Video Multi-Halaman
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoSubmitting(true);
    setVideoFeedback(null);

    try {
      const endpoint = editingVideoId
        ? `/api/videos/${editingVideoId}`
        : "/api/videos";
      const method = editingVideoId ? "PUT" : "POST";

      const firstPage = lessonPages[0] || { videoUrl: "", content: "" };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          title: videoTitle,
          videoUrl: firstPage.videoUrl,
          content: firstPage.content,
          pages: lessonPages,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
        }
        throw new Error(json.error || "Gagal menyimpan materi video.");
      }

      setVideoFeedback({
        type: "success",
        text: editingVideoId
          ? `Materi video (${lessonPages.length} halaman) berhasil diperbarui!`
          : `Materi video baru (${lessonPages.length} halaman) berhasil ditambahkan!`,
      });

      setEditingVideoId(null);
      setVideoTitle("");
      setLessonPages([{ videoUrl: "", content: "" }]);
      loadVideos(videoSearch);
    } catch (err) {
      setVideoFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menyimpan materi video.",
      });
    } finally {
      setVideoSubmitting(false);
    }
  };

  const handleEditVideoClick = (video: VideoLessonItem) => {
    setEditingVideoId(video._id);
    setVideoTitle(video.title);
    if (video.pages && video.pages.length > 0) {
      setLessonPages(
        video.pages.slice(0, 5).map((p) => ({
          videoUrl: p.videoUrl || "",
          content: p.content || "",
        }))
      );
    } else {
      setLessonPages([
        {
          videoUrl: video.videoUrl || "",
          content: video.content || "",
        },
      ]);
    }
    setVideoFeedback(null);
    setActiveTab("tambah");
    setTimeout(() => {
      const formEl = document.getElementById("form-materi-video");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus materi video "${title}"?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword,
        },
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) handleLogout();
        throw new Error(json.error || "Gagal menghapus materi video.");
      }
      loadVideos(videoSearch);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal menghapus materi video."
      );
    }
  };

  if (checkingAuth || !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b9c85] mx-auto mb-3" />
        <p className="text-sm text-slate-600 font-medium">
          Memeriksa sesi login Admin...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Banner Header Admin Navy-Teal Lembut & Nyaman di Mata */}
      <div className="bg-gradient-to-r from-[#0b2239] via-[#12385b] to-[#1a6b72] text-white border-b border-white/10">
        <div className="w-[90%] max-w-[1280px] mx-auto py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#38c6b0] mb-1">
              <ShieldCheck className="w-4 h-4" />
              Halo, {adminUser} &bull; Mode Pengelola Data
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Panel Admin IdiqNotebook
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1">
              Tambahkan/impor kosakata Excel, kelola materi video, atau hapus
              data kosakata &amp; materi.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-bold shadow-xs transition self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar (Logout)
          </button>
        </div>
      </div>

      {/* Menu Sub-Navigasi Halaman Admin */}
      <div className="bg-white border-b border-slate-200 sticky top-18 z-30 shadow-2xs">
        <div className="w-[90%] max-w-[1280px] mx-auto">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <button
              type="button"
              onClick={() => setActiveTab("tambah")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "tambah"
                  ? "bg-[#0f2c59] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Plus className="w-4 h-4" />
              Tambah &amp; Import Data
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("kosakata");
                loadAdminVocabularies(vocabPage, vocabSearch);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "kosakata"
                  ? "bg-[#0f2c59] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Daftar &amp; Hapus Kosakata ({vocabTotalItems.toLocaleString("id-ID")})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("materi");
                loadVideos(videoSearch);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "materi"
                  ? "bg-[#0f2c59] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Video className="w-4 h-4" />
              Daftar &amp; Hapus Materi Video ({videos.length})
            </button>
          </div>
        </div>
      </div>

      {/* Konten Utama Admin */}
      <div className="w-[90%] max-w-[1280px] mx-auto py-8 space-y-10">
        {/* TAB 1: TAMBAH & IMPORT DATA */}
        {activeTab === "tambah" && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Card Upload File Excel */}
              <div className="lg:col-span-7 bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-[#1b9c85]" />
                    <div>
                      <h2 className="text-lg font-extrabold text-[#0f2c59]">
                        1. Import Kosakata dari File Excel (.xlsx / .xls)
                      </h2>
                      <p className="text-xs text-slate-600">
                        Deduplikasi otomatis: kata yang sudah ada di MongoDB
                        akan dilewati (skip).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-50 hover:bg-teal-100 text-[#15806d] border border-teal-200 text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Template Excel
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <p className="font-bold text-[#0f2c59]">
                      Format Header Kolom Excel yang Didukung:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-[#0f2c59]">
                          English word
                        </code>{" "}
                        — Kata bahasa Inggris (acuan cek duplikat
                        case-insensitive)
                      </li>
                      <li>
                        <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-[#0f2c59]">
                          Indonesian translate
                        </code>{" "}
                        — Terjemahan bahasa Indonesia
                      </li>
                      <li>
                        <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-[#0f2c59]">
                          How to Say (Cara Baca)
                        </code>{" "}
                        — Panduan pelafalan / cara baca (juga mendukung header{" "}
                        <code>We Spoke (Cara Baca)</code>)
                      </li>
                    </ul>
                  </div>

                  <form onSubmit={handleExcelUpload} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-800 mb-2">
                        Pilih File Excel (.xlsx / .xls)
                      </label>
                      <input
                        id="excel-file-input"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) =>
                          setExcelFile(
                            e.target.files ? e.target.files[0] : null
                          )
                        }
                        className="block w-full text-sm text-slate-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#0f2c59] file:text-white hover:file:bg-[#163d7a] border border-slate-300 rounded-md p-1.5 cursor-pointer"
                      />
                    </div>

                    {importError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{importError}</span>
                      </div>
                    )}

                    {importSummary && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                          <CheckCircle2 className="w-5 h-5 text-[#1b9c85]" />
                          Ringkasan Hasil Upload Excel
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                          <div className="bg-white p-3 rounded border border-emerald-200">
                            <p className="text-[11px] text-slate-500">
                              Total Baris Dibaca
                            </p>
                            <p className="text-lg font-extrabold text-[#0f2c59]">
                              {importSummary.totalRowsRead}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-emerald-200">
                            <p className="text-[11px] text-slate-500">
                              Kata Baru Ditambahkan
                            </p>
                            <p className="text-lg font-extrabold text-[#1b9c85]">
                              +{importSummary.addedCount}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-emerald-200">
                            <p className="text-[11px] text-slate-500">
                              Duplikat Dilewati (Skip)
                            </p>
                            <p className="text-lg font-extrabold text-amber-600">
                              {importSummary.skippedDuplicateCount}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={importing || !excelFile}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#1b9c85] hover:bg-[#15806d] text-white text-sm font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses &amp; Mengecek Duplikat...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload &amp; Simpan ke MongoDB
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Card Tambah Kosakata Manual (Satuan) */}
              <div className="lg:col-span-5 bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-[#1b9c85]" />
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0f2c59]">
                      Tambah Kosakata Satuan
                    </h2>
                    <p className="text-xs text-slate-600">
                      Input manual 1 kata baru beserta cara bacanya.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleAddSingleVocab}
                  className="p-5 sm:p-6 space-y-4"
                >
                  {singleVocabMessage && (
                    <div
                      className={`p-3 rounded-md text-xs font-medium border ${
                        singleVocabMessage.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      {singleVocabMessage.text}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-800 mb-1">
                      English Word
                    </label>
                    <input
                      type="text"
                      value={singleEnglish}
                      onChange={(e) => setSingleEnglish(e.target.value)}
                      placeholder="Contoh: Resilient"
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1b9c85]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-800 mb-1">
                      Indonesian Translate
                    </label>
                    <input
                      type="text"
                      value={singleIndo}
                      onChange={(e) => setSingleIndo(e.target.value)}
                      placeholder="Contoh: Tangguh / Cepat pulih"
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1b9c85]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-800 mb-1">
                      How to Say (Cara Baca)
                    </label>
                    <input
                      type="text"
                      value={singleSpoke}
                      onChange={(e) => setSingleSpoke(e.target.value)}
                      placeholder="Contoh: ri-zil-yent"
                      className="w-full px-3.5 py-2 text-sm text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1b9c85]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={singleVocabLoading}
                    className="w-full py-2.5 px-4 bg-[#0f2c59] hover:bg-[#163d7a] text-white text-sm font-bold rounded-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {singleVocabLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Simpan Kosakata
                  </button>
                </form>
              </div>
            </div>

            {/* BAGIAN 2: FORM TAMBAH / EDIT MATERI VIDEO & TEKS */}
            <div
              id="form-materi-video"
              className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden"
            >
              <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Video className="w-5 h-5 text-[#1b9c85]" />
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0f2c59]">
                      2.{" "}
                      {editingVideoId
                        ? "Edit Materi Video & Teks Penjelasan"
                        : "Tambah Materi Video & Teks Penjelasan Baru"}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Link YouTube otomatis dikonversi menjadi player 16:9.
                      Tekan <strong>Enter 2 kali</strong> untuk membuat paragraf
                      baru.
                    </p>
                  </div>
                </div>

                {editingVideoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVideoId(null);
                      setVideoTitle("");
                      setLessonPages([{ videoUrl: "", content: "" }]);
                    }}
                    className="px-3 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              <form
                onSubmit={handleVideoSubmit}
                className="p-5 sm:p-6 space-y-6"
              >
                {videoFeedback && (
                  <div
                    className={`p-3.5 rounded-md text-xs font-medium border flex items-center gap-2 ${
                      videoFeedback.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}
                  >
                    {videoFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1b9c85]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{videoFeedback.text}</span>
                  </div>
                )}

                {/* Input Judul Materi Utama */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-800 mb-1.5">
                    Judul Materi Utama
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Contoh: Belajar English Slang Populer"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1b9c85]"
                    required
                  />
                </div>

                {/* Daftar Halaman Materi (Maksimal 5 Halaman) */}
                <div className="space-y-6">
                  {lessonPages.map((pageItem, pageIdx) => {
                    const hasNextPage = pageIdx < lessonPages.length - 1;
                    const canAddMorePage = pageIdx < 4; // Maksimal 5 halaman (index 0..4)

                    return (
                      <div
                        key={pageIdx}
                        className="p-5 rounded-md bg-slate-50 border border-slate-200 space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0f2c59] text-white text-xs font-bold">
                            Halaman {pageIdx + 1} dari Maksimal 5
                          </span>

                          {pageIdx > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setLessonPages((prev) =>
                                  prev.filter((_, i) => i !== pageIdx)
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus Halaman {pageIdx + 1}
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-800 mb-1.5">
                            Link Video YouTube — Halaman {pageIdx + 1}{" "}
                            {pageIdx > 0 && (
                              <span className="text-slate-500 font-normal lowercase">
                                (opsional untuk halaman lanjutan)
                              </span>
                            )}
                          </label>
                          <input
                            type="url"
                            value={pageItem.videoUrl}
                            onChange={(e) =>
                              handlePageFieldChange(
                                pageIdx,
                                "videoUrl",
                                e.target.value
                              )
                            }
                            placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                            className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1b9c85]"
                            required={pageIdx === 0}
                          />
                        </div>

                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                            <label className="block text-xs font-bold uppercase text-slate-800">
                              Teks Penjelasan Materi — Halaman {pageIdx + 1}
                            </label>
                            <span className="text-[11px] text-[#15806d] font-semibold">
                              * Tips: Tekan <strong>Enter 2x</strong> untuk
                              paragraf baru (<code>&lt;p&gt;</code>), atau{" "}
                              <strong>Enter 1x</strong> untuk baris baru.
                            </span>
                          </div>
                          <textarea
                            rows={7}
                            value={pageItem.content}
                            onChange={(e) =>
                              handlePageFieldChange(
                                pageIdx,
                                "content",
                                e.target.value
                              )
                            }
                            placeholder={`Tulis penjelasan materi Halaman ${pageIdx + 1} di sini...\n\nTekan Enter 2 kali seperti ini agar otomatis terpisah menjadi paragraf baru yang rapi.`}
                            className="w-full px-3.5 py-3 text-sm text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1b9c85] leading-relaxed"
                            required
                          />
                        </div>

                        {/* Checkbox "Tambahkan halaman lain" di akhir setiap halaman (sampai batas maksimal 5 halaman) */}
                        {canAddMorePage ? (
                          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                            <label className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-bold text-[#0f2c59] cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={hasNextPage}
                                onChange={(e) =>
                                  handleToggleNextPage(
                                    pageIdx,
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 rounded border-slate-300 text-[#1b9c85] focus:ring-[#1b9c85] cursor-pointer"
                              />
                              <span>
                                Tambahkan halaman lain (Halaman {pageIdx + 2})
                              </span>
                            </label>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Maksimal 5 halaman per materi
                            </span>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-slate-200/80 text-xs font-bold text-amber-700">
                            Batas maksimal 5 halaman untuk 1 materi telah
                            tercapai.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={videoSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#1b9c85] hover:bg-[#15806d] text-white text-sm font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {videoSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        {editingVideoId
                          ? `Simpan Perubahan Materi (${lessonPages.length} Halaman)`
                          : `Publikasikan Materi Video (${lessonPages.length} Halaman)`}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: HALAMAN DAFTAR & HAPUS KOSAKATA KHUSUS ADMIN */}
        {activeTab === "kosakata" && (
          <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#0f2c59] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#1b9c85]" />
                  Kelola &amp; Hapus Daftar Kosakata
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Total{" "}
                  <span className="font-bold text-[#1b9c85]">
                    {vocabTotalItems.toLocaleString("id-ID")}
                  </span>{" "}
                  kosakata terdaftar. Klik tombol{" "}
                  <span className="text-red-600 font-bold">Hapus</span> untuk
                  menghapus kata dari MongoDB.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadAdminVocabularies(1, vocabSearch);
                }}
                className="flex items-center gap-2 w-full md:w-auto"
              >
                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={vocabSearch}
                    onChange={(e) => setVocabSearch(e.target.value)}
                    placeholder="Cari kosakata yang ingin dihapus..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b9c85]"
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

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0f2c59] text-white text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold w-16 text-center">
                      No
                    </th>
                    <th className="py-3.5 px-4 font-bold">English Word</th>
                    <th className="py-3.5 px-4 font-bold">
                      Indonesian Translate
                    </th>
                    <th className="py-3.5 px-4 font-bold">
                      How to Say (Cara Baca)
                    </th>
                    <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vocabLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-16 text-center text-slate-500"
                      >
                        <Loader2 className="w-7 h-7 animate-spin text-[#1b9c85] mx-auto mb-2" />
                        Memuat daftar kosakata...
                      </td>
                    </tr>
                  ) : vocabItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-14 text-center text-slate-500"
                      >
                        Tidak ada data kosakata yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    vocabItems.map((item, index) => (
                      <tr
                        key={item._id}
                        className="hover:bg-teal-50/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-semibold text-slate-500">
                          {(vocabPage - 1) * 100 + index + 1}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-[#0f2c59]">
                          {item.englishWord}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {item.indonesianTranslate}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-teal-50 text-[#15806d] text-xs font-semibold border border-teal-200">
                            <Volume2 className="w-3.5 h-3.5 text-[#1b9c85]" />
                            {item.weSpoke}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={deletingVocabId === item._id}
                            onClick={() =>
                              handleDeleteVocab(item._id, item.englishWord)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            {deletingVocabId === item._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Daftar Kosakata Admin */}
            <div className="p-4 sm:px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-600">
                Halaman{" "}
                <strong className="text-[#0f2c59]">{vocabPage}</strong> dari{" "}
                <strong className="text-[#0f2c59]">{vocabTotalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={vocabPage <= 1 || vocabLoading}
                  onClick={() =>
                    loadAdminVocabularies(vocabPage - 1, vocabSearch)
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={vocabPage >= vocabTotalPages || vocabLoading}
                  onClick={() =>
                    loadAdminVocabularies(vocabPage + 1, vocabSearch)
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  Berikutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HALAMAN DAFTAR & HAPUS MATERI VIDEO KHUSUS ADMIN */}
        {activeTab === "materi" && (
          <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#0f2c59] flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#1b9c85]" />
                  Kelola, Edit &amp; Hapus Materi Video ({videos.length})
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Daftar seluruh materi video dan teks penjelasan yang
                  tersimpan di MongoDB Atlas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadVideos(videoSearch);
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative w-56 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={videoSearch}
                      onChange={(e) => setVideoSearch(e.target.value)}
                      placeholder="Cari judul materi..."
                      className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1b9c85]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0f2c59] hover:bg-[#163d7a] text-white text-sm font-bold rounded-md transition cursor-pointer"
                  >
                    Cari
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setActiveTab("tambah")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1b9c85] hover:bg-[#15806d] text-white text-sm font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Materi Baru
                </button>
              </div>
            </div>

            {videosLoading ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                <Loader2 className="w-7 h-7 animate-spin text-[#1b9c85] mx-auto mb-2" />
                Memuat daftar materi video...
              </div>
            ) : videos.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Belum ada materi video yang ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#0f2c59] text-white text-xs uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-bold w-14 text-center">
                        No
                      </th>
                      <th className="py-3.5 px-4 font-bold">Judul Materi</th>
                      <th className="py-3.5 px-4 font-bold">Link YouTube</th>
                      <th className="py-3.5 px-4 font-bold">Tanggal</th>
                      <th className="py-3.5 px-4 font-bold text-right">
                        Aksi (Lihat / Edit / Hapus)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {videos.map((v, idx) => (
                      <tr key={v._id} className="hover:bg-teal-50/40">
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[#0f2c59]">
                          {v.title}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 font-medium truncate max-w-xs">
                          {v.videoUrl}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                          {new Date(v.createdAt).toLocaleDateString("id-ID")}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/videos/${v._id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-[#0f2c59] border border-slate-200 text-xs font-bold transition"
                              title="Lihat Halaman Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Lihat
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleEditVideoClick(v)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer"
                              title="Edit Materi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVideo(v._id, v.title)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-xs font-bold transition cursor-pointer"
                              title="Hapus Materi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
