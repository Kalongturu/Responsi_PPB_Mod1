# API Peminjaman Buku Perpustakaan

REST API sederhana untuk mencatat peminjaman buku oleh anggota perpustakaan.
Dibangun dengan **Node.js**, **Express.js**, dan **Supabase** (PostgreSQL).

## Fitur

- CRUD data peminjaman, anggota, dan buku
- Filter peminjaman berdasarkan status, anggota, atau buku (contoh: `GET /api/loans?status=Terlambat`)
- Status **Terlambat** dihitung otomatis dari tanggal jatuh tempo
- Validasi input dan pesan error yang konsisten

## Teknologi

| Komponen | Teknologi |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 5 |
| Database | Supabase (PostgreSQL) |
| Deploy | Vercel |

## Prasyarat

- Node.js 18 atau lebih baru
- Akun [Supabase](https://supabase.com) dengan satu project

## Instalasi

1. Clone repositori lalu masuk ke foldernya.
   ```bash
   git clone <url-repositori>
   cd perpustakaan-api
   ```
2. Pasang dependensi.
   ```bash
   npm install
   ```
3. Siapkan database: buka **Supabase Dashboard → SQL Editor**, lalu jalankan isi file `supabase/schema.sql`.
   File ini membuat tabel `members`, `books`, `loans`, beserta data contoh.
4. Buat file `.env` di root proyek (sejajar dengan `package.json`).
   ```bash
   cp .env.example .env
   ```
   Isi nilainya:
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_KEY=isi_dengan_anon_atau_service_role_key
   PORT=3000
   ```
   - `SUPABASE_URL` adalah **Project URL** dari *Project Settings → API*. Hanya domain, tanpa `/rest/v1`, tanpa garis miring di akhir, dan tanpa tanda kutip.
   - Jika memakai anon key, nonaktifkan RLS pada tabel `members`, `books`, dan `loans` (atau buat policy). Service role key melewati RLS, tetapi hanya boleh dipakai di server dan tidak boleh bocor.
5. Jalankan server.
   ```bash
   npm run dev     # development (auto-reload dengan nodemon)
   npm start       # production
   ```
   Server berjalan di `http://localhost:3000`.

## Endpoint

Base URL: `http://localhost:3000`

### Peminjaman

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/loans` | Daftar peminjaman |
| GET | `/api/loans/:id` | Detail peminjaman |
| POST | `/api/loans` | Catat peminjaman baru |
| PUT | `/api/loans/:id` | Ubah data / catat pengembalian |
| DELETE | `/api/loans/:id` | Hapus peminjaman |

### Anggota

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/members` | Daftar anggota |
| GET | `/api/members/:id` | Detail anggota |
| POST | `/api/members` | Tambah anggota |
| PUT | `/api/members/:id` | Ubah anggota |
| DELETE | `/api/members/:id` | Hapus anggota |

### Buku

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/books` | Daftar buku |
| GET | `/api/books/:id` | Detail buku |
| POST | `/api/books` | Tambah buku |
| PUT | `/api/books/:id` | Ubah buku |
| DELETE | `/api/books/:id` | Hapus buku |

## Filter peminjaman

| Query | Nilai | Contoh |
|---|---|---|
| `status` | `Dipinjam`, `Dikembalikan`, `Terlambat` (tidak peka huruf besar/kecil) | `/api/loans?status=Terlambat` |
| `member_id` | id anggota | `/api/loans?member_id=2` |
| `book_id` | id buku | `/api/loans?book_id=1` |

Filter dapat digabung: `/api/loans?status=Terlambat&member_id=1`.

## Contoh penggunaan

**Tambah anggota**
```http
POST /api/members
Content-Type: application/json

{ "name": "Budi Santoso", "email": "budi@example.com", "phone": "081234567890" }
```

**Tambah buku**
```http
POST /api/books
Content-Type: application/json

{ "title": "Laskar Pelangi", "author": "Andrea Hirata", "isbn": "9789793062792" }
```

**Catat peminjaman** (hanya `member_id` dan `book_id` yang wajib)
```http
POST /api/loans
Content-Type: application/json

{ "member_id": 1, "book_id": 1, "due_date": "2026-10-20", "notes": "Pinjam 1 minggu" }
```

**Kembalikan buku**
```http
PUT /api/loans/1
Content-Type: application/json

{ "status": "Dikembalikan" }
```

**Respons `GET /api/loans?status=Terlambat`**
```json
[
  {
    "id": 1,
    "member_id": 1,
    "book_id": 1,
    "loan_date": "2026-09-20",
    "due_date": "2026-09-27",
    "return_date": null,
    "status": "Terlambat",
    "notes": null,
    "created_at": "2026-09-20T03:00:00+00:00",
    "member": { "id": 1, "name": "Budi Santoso" },
    "book": { "id": 1, "title": "Laskar Pelangi", "author": "Andrea Hirata" }
  }
]
```

## Aturan bisnis

- `loan_date` default hari ini (WIB) dan `due_date` default 7 hari setelah `loan_date`.
- Status yang tersimpan hanya `Dipinjam` dan `Dikembalikan`. **`Terlambat`** adalah status turunan: peminjaman `Dipinjam` yang `due_date`-nya sudah lewat. Mengirim `status: "Terlambat"` lewat `PUT` ditolak.
- Mengubah status menjadi `Dikembalikan` mengisi `return_date` dengan hari ini (atau nilai `return_date` yang dikirim). Mengirim `return_date` saja juga menandai buku sudah dikembalikan.
- Satu buku dianggap satu eksemplar: buku yang belum dikembalikan tidak bisa dipinjam lagi (`409`).
- Anggota atau buku yang masih punya riwayat peminjaman tidak bisa dihapus (`409`).

## Kode respons

| Kode | Arti |
|---|---|
| 200 | Berhasil |
| 201 | Data berhasil dibuat |
| 400 | Input tidak valid |
| 404 | Data tidak ditemukan |
| 409 | Konflik (buku sedang dipinjam, data masih dipakai, nilai unik duplikat) |
| 500 | Kesalahan server |

Format error selalu `{ "error": "pesan" }`.

## Struktur proyek

```
perpustakaan-api/
├── src/
│   ├── index.js                 # entry point Express
│   ├── config/supabaseClient.js # koneksi Supabase
│   ├── routes/                  # definisi route
│   ├── controllers/             # validasi & respons HTTP
│   ├── models/                  # query ke Supabase
│   └── utils/                   # helper validasi, error, CRUD generik
├── supabase/schema.sql          # skema tabel & data contoh
├── PPB_Perpustakaan.postman_collection.json
├── vercel.json
├── .env.example
└── package.json
```

## Deploy ke Vercel

1. Push proyek ke GitHub (pastikan `.env` tidak ikut ter-commit).
2. Import repositori di [vercel.com](https://vercel.com).
3. Tambahkan **Environment Variables** `SUPABASE_URL` dan `SUPABASE_KEY` di pengaturan project Vercel.
4. Deploy. Konfigurasi sudah ada di `vercel.json`.

## Pengujian dengan Postman

Import file `PPB_Perpustakaan.postman_collection.json`. Variabel `baseUrl` bawaannya `http://localhost:3000`.
Urutan pengujian: buat anggota dan buku lebih dulu, baru peminjaman.

## Pemecahan masalah

| Gejala | Penyebab & solusi |
|---|---|
| `SUPABASE_URL dan SUPABASE_KEY wajib diisi` | File harus bernama `.env` (bukan `.env.example`) dan berada di root proyek. |
| `Terjadi kesalahan pada server` dengan log `PGRST125` | `SUPABASE_URL` salah. Gunakan hanya `https://<project>.supabase.co`. |
| Log `Could not find the table` | Jalankan `supabase/schema.sql` di SQL Editor. |
| Data selalu kosong / `permission denied` | RLS aktif. Nonaktifkan RLS atau buat policy. |
| Perubahan `.env` tidak terbaca | Hentikan server (`Ctrl+C`) lalu jalankan ulang. Nodemon tidak memantau `.env`. |
| `npm install` menampilkan "3 high severity vulnerabilities" | Berasal dari `nodemon` (dependensi development). Aman diabaikan, dan jangan jalankan `npm audit fix --force`. |
