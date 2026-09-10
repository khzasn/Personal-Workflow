# Dayflow — Personal Productivity Dashboard ✦

**Dayflow** adalah dashboard produktivitas harian modern berbasis AI yang dirancang untuk membantu Anda menyusun jadwal, mengelola tugas prioritas, menjaga fokus kerja, dan memantau analitik produktivitas secara tenang dan elegan.

---

## ✨ Fitur Unggulan

1. **Prioritas & Visualisasi Deadline (Fase 1)**
   - 4 tingkat prioritas visual: **🔴 Urgent (P1)**, **🟠 High (P2)**, **🟣 Medium (P3)**, **⚪ Low (P4)**.
   - Status deadline cerdas: *Overdue*, *Hari Ini*, *Mendekati*, dan *Mendatang*.
   - Pengurutan tugas otomatis: Tugas kedaluwarsa & mendesak selalu muncul paling atas.

2. **Weekly & Time-Blocked Calendar (Fase 2)**
   - Kalender multi-mode: **Bulanan (Month)**, **Mingguan (Week)**, dan **Harian (Day)**.
   - Time-blocking vertikal dari jam 00:00 hingga 23:00.
   - Klik langsung pada slot jam untuk membuat tugas dengan waktu mulai (*start time*) presisi.

3. **Tugas Berulang / Recurring Tasks (Fase 3)**
   - Aturan pengulangan fleksibel: *Setiap Hari*, *Hari Kerja (Senin–Jumat)*, *Setiap Minggu*, dan *Setiap Bulan*.
   - Dikelola melalui tabel `task_series` dengan *rolling occurrence generator*.

4. **Focus Timer & Floating Mini Player (Fase 4)**
   - Timer fokus berbasis *timestamp* dengan proteksi *single active session*.
   - *Floating mini player* melayang di pojok kanan bawah: navigasi antar-halaman tanpa menghentikan timer.
   - Ringkasan sesi fokus dan integrasi langsung ke tugas aktif.

5. **Analitik Produktivitas / Productivity Analytics (Fase 5)**
   - **Tren Penyelesaian**: Bar chart 7 hari terakhir (tugas selesai vs dibuat).
   - **Distribusi Kategori**: Donut chart SVG murni untuk pembagian waktu (*Kerja, Belajar, Pribadi, Lainnya*).
   - **Statistik Fokus**: Total durasi, jumlah sesi, dan rata-rata waktu fokus per hari.
   - **Activity Heatmap**: Grid kontribusi 12 minggu gaya GitHub untuk memantau konsistensi.

6. **Natural-Language Task Input dengan Gemini AI (Fase 6)**
   - Input tugas menggunakan kalimat bebas (Bahasa Indonesia / Inggris).
   - Ekstraksi otomatis: Judul, Tanggal, Jam, Durasi, Prioritas, Kategori, dan Pengulangan.
   - **Human-in-the-Loop**: Kartu konfirmasi interaktif dengan chip pilihan jam cepat sebelum disimpan ke kalender.

7. **Penyempurnaan & Aksesibilitas (Polish)**
   - **Theme Toggle**: Mode Gelap (Dark Mode) dan Mode Terang (Light Mode) yang adaptif.
   - Desain responsif untuk desktop dan layar ponsel pintar.

---

## 🛠️ Stack Teknologi

| Komponen | Pilihan Teknologi | Keterangan |
|---|---|---|
| **Framework** | Next.js 15.3.4 (App Router) | Server Components & Server Actions |
| **Bahasa** | TypeScript 5.9 (Strict Mode) | Zero `any`, Type-safe end-to-end |
| **Styling** | Tailwind CSS v4 + Lucide Icons | Desain modern, backdrop blur, aksen ungu |
| **Database & Auth** | Supabase Postgres + Auth | Row Level Security (RLS) terisolasi per user |
| **Artificial Intelligence** | Google Gemini 2.5 Flash (`@google/genai`) | Ekstraksi JSON terstruktur & AI enrichment |
| **Tema** | `next-themes` | Dark mode & light mode bebas hydration mismatch |
| **Testing** | Vitest + Testing Library | Pengujian logika murni, Zod schemas, & parsers |

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Clone & Pasang Dependensi

```bash
git clone <repository-url>
cd personal-productivity-dashboard
npm install # atau pnpm install
```

### 2. Konfigurasi Environment Variables

Salin file `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel di `.env.local` dengan kredensial Anda:

```env
# Public Supabase (Dapatkan dari Supabase Dashboard -> Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_[YOUR_KEY]

# Server-only Supabase Service Role (JANGAN bocor ke browser)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_[YOUR_SERVICE_KEY]

# Google Gemini AI (Dapatkan dari https://aistudio.google.com/apikey)
GEMINI_API_KEY=AIzaSy_[YOUR_GEMINI_KEY]
GEMINI_MODEL=gemini-2.5-flash

# RSS Configuration (Format JSON Array)
RSS_FEED_URLS=["https://www.cnbcindonesia.com/news/rss"]
RSS_CACHE_TTL_HOURS=24
RSS_MAX_ARTICLES_PER_FEED=5
RSS_REQUEST_TIMEOUT_MS=8000

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_TIMEZONE=Asia/Jakarta
```

---

## 🗄️ Panduan Migrasi Database (Supabase SQL Editor)

Jalankan seluruh skrip SQL di folder `supabase/migrations/` secara **berurutan** pada Supabase SQL Editor:

1. `00001_initial_schema.sql` — Ekstensi pgcrypto, tabel `tasks` dasar, tabel `briefings`, RLS policies, trigger `updated_at`.
2. `00002_add_start_time.sql` — Menambahkan kolom `start_time` (TIME) ke tabel `tasks`.
3. `00003_add_priority.sql` — Menambahkan kolom `priority` (urgent, high, medium, low) ke tabel `tasks`.
4. `00004_add_task_series.sql` — Tabel `task_series` untuk aturan tugas berulang dan index relasi `series_id`.
5. `00005_add_focus_sessions.sql` — Tabel `focus_sessions` dengan proteksi single active session per user.

---

## 🧪 Perintah Pengujian & Pengecekan

```bash
# Menjalankan server pengembangan
npm run dev

# Memeriksa type safety TypeScript
npm run typecheck

# Menjalankan unit tests
npm test

# Membangun bundle produksi
npm run build

# Menjalankan bundle produksi lokal
npm start
```

---

## 🌐 Panduan Deployment ke Vercel

1. **Push ke GitHub/GitLab**:
   Pastikan berkas `.env.local` masuk dalam `.gitignore` (tidak pernah di-push ke git).
2. **Impor Proyek ke Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com) $\to$ **Add New Project**.
   - Pilih repositori Dayflow Anda.
   - Framework preset otomatis terdeteksi sebagai **Next.js**.
3. **Atur Environment Variables di Vercel Settings**:
   Masukkan semua variabel berikut pada bagian **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (atau `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (`gemini-2.5-flash`)
   - `RSS_FEED_URLS` (`["https://www.cnbcindonesia.com/news/rss"]`)
   - `RSS_CACHE_TTL_HOURS` (`24`)
   - `RSS_MAX_ARTICLES_PER_FEED` (`5`)
   - `RSS_REQUEST_TIMEOUT_MS` (`8000`)
   - `NEXT_PUBLIC_APP_URL` (`https://your-domain.vercel.app`)
   - `APP_TIMEZONE` (`Asia/Jakarta`)
4. **Klik Deploy**:
   Vercel akan mengompilasi proyek secara otomatis. Dalam 1–2 menit, aplikasi Dayflow siap digunakan di produksi!
