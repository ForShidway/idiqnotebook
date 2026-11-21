# IdiqNotebook — Catatan Materi & Kosakata Bahasa Inggris

## 1. Penjelasan Sistem & Tujuan Pembuatan

**IdiqNotebook** adalah aplikasi web buku catatan digital (*digital study notebook*) yang dibangun untuk mendokumentasikan, menyimpan, dan mengorganisir catatan belajar  di cloud (**MongoDB Atlas**).

### Tujuan Sistem Dibuat:
1. **Sentralisasi Catatan Belajar Pribadi:** Menjadi tempat peralihan dari catatan manual/file Excel yang tersebar menjadi satu aplikasi web terpadu yang mudah diakses kapan saja dan dari perangkat mana saja.
2. **Dokumentasi Kosakata Baru Tanpa Duplikat:** Memudahkan pencatatan ribuan kosakata bahasa Inggris yang baru ditemukan lengkap dengan terjemahan bahasa Indonesia dan panduan cara bacanya , serta mencegah adanya kata ganda secara otomatis saat mengimpor dari file Excel.
3. **Arsip Rangkuman Materi & Video Pembelajaran:** Menyimpan materi video pembelajaran dari YouTube beserta catatan teks penjelasannya secara terstruktur hingga beberapa halaman agar mudah dipelajari ulang.
4. **Pengalaman Membaca Interaktif:** Membantu proses mengulang (*review*) bacaan bahasa Inggris dengan fitur sorot kata (*hover translation*) yang langsung menampilkan terjemahan dan cara baca dari kosakata yang sudah pernah dicatat di dalam tabel kata.

---

## 2. Isi & Fitur-Fitur Website

### A. Halaman Beranda (`/`)
- **Hero & Pencarian Cepat:** Menampilkan ringkasan fungsi catatan belajar serta kolom pencarian cepat untuk langsung menemukan kosakata yang pernah dicatat.
- **Kartu Statistik Catatan:** Menampilkan informasi jumlah total kosakata terdaftar, kapasitas tampilan kata per halaman, dan jumlah materi video terbaru.
- **Pratinjau Tabel Kosakata (15 Kata):** Menampilkan 15 daftar kosakata di halaman utama lengkap dengan tombol **"Lihat Tabel Lengkapnya"** pada baris ke-16 di pojok kanan bawah untuk menuju halaman tabel penuh.
- **3 Materi Video Terbaru:** Menampilkan 3 kartu catatan materi video terakhir yang ditambahkan.

### B. Halaman Tabel Kosakata (`/vocabulary`)
- **Tabel Kosakata Lengkap:** Menampilkan seluruh kosakata yang tersimpan di database dengan 4 kolom utama:
  1. **No** (Nomor urut)
  2. **English Word** (Kata bahasa Inggris)
  3. **Indonesian Translate** (Terjemahan bahasa Indonesia)
  4. **How to Say (Cara Baca)** (Panduan pelafalan/cara baca)
- **Server-Side Pagination (100 Kata / Halaman):** Dilengkapi navigasi halaman (*Previous*, *Next*, nomor halaman, dan informasi total kata) agar tetap ringan dan cepat meskipun menyimpan ribuan kosakata.
- **Pencarian Kosakata Real-Time:** Memudahkan pencarian berdasarkan kata bahasa Inggris, arti bahasa Indonesia, maupun cara bacanya.

### C. Halaman Materi Video & Catatan Teks (`/videos` & `/videos/[id]`)
- **Katalog Materi Video (`/videos`):** Menampilkan daftar seluruh materi pembelajaran dalam bentuk kartu grid 3 kolom beserta fitur pencarian judul materi.
- **Halaman Detail & Baca Materi (`/videos/[id]`):**
  - **Video Player Responsif (16:9):** Otomatis mengonversi link YouTube biasa (`youtube.com/watch?v=...` atau `youtu.be/...`) menjadi pemutar video *embed* di bagian atas halaman.
  - **Teks Materi Multi-Halaman (Maksimal 5 Halaman):** Mendukung materi panjang yang dibagi menjadi hingga 5 halaman, dilengkapi tombol navigasi **Previous (Halaman Sebelumnya)**, **Next (Halaman Berikutnya)**, dan pemilih nomor halaman cepat (`Hal 1`, `Hal 2`, dst.).
  - **Format Paragraf Otomatis:** Teks yang dipisahkan dengan **Enter 2 kali** otomatis dirender menjadi paragraf baru (`<p>`) yang rapi dan nyaman dibaca.
  - **Terjemahan Kosakata Interaktif Saat Kursor Diarahkan (*Hover Tooltip*):** Setiap kata bahasa Inggris di dalam teks materi yang sudah terdaftar di **Tabel Kata** akan otomatis ditandai. Ketika kursor diarahkan ke kata tersebut, latar belakang kata akan berubah warna dan memunculkan kotak *pop-up* berisi **Terjemahan Bahasa Indonesia** serta **Cara Baca (*How to Say*)**.

### D. Halaman Login & Panel Admin (`/login` & `/admin`)
- **Halaman Login Admin (`/login`):** Memproteksi akses pengelolaan data menggunakan kata sandi admin (`ADMIN_PASSWORD`) dengan keamanan *rate-limiting* (anti *brute-force*) dan *timing-safe comparison*.
- **Tab 1 — Tambah & Import Data:**
  - **Import Kosakata dari File Excel (`.xlsx` / `.xls`):** Mengunggah ratusan atau ribuan kosakata sekaligus dari file Excel dengan fitur **Anti-Duplikat Otomatis** (kata bahasa Inggris yang sudah ada di database akan dilewati/skip dan hanya kata baru yang disimpan), dilengkapi laporan ringkasan hasil upload serta tombol **Unduh Template Excel**.
  - **Tambah Kosakata Satuan:** Form untuk mencatat 1 kosakata baru secara manual.
  - **Form Materi Video Multi-Halaman:** Form untuk menambahkan atau mengedit materi video beserta penjelasan teksnya, dilengkapi checkbox **"Tambahkan halaman lain"** untuk menambah halaman materi hingga maksimal 5 halaman.
- **Tab 2 — Daftar & Hapus Kosakata:** Halaman khusus Admin untuk mencari, melihat, dan menghapus kosakata dari database.
- **Tab 3 — Daftar & Hapus Materi Video:** Halaman khusus Admin untuk melihat, mengedit, atau menghapus materi video yang sudah dipublikasikan.

---

## Teknologi yang Digunakan
- **Framework:** Next.js (App Router) + TypeScript
- **Styling & UI:** Tailwind CSS + Lucide Icons
- **Database:** MongoDB Atlas + Mongoose (Serverless Cached Connection)
- **Excel Parser:** SheetJS (`xlsx`)
- **Deployment:** Vercel
