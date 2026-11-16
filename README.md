# 📘 PANDUAN LENGKAP — E-Asesmen Mandiri

**Sistem Evaluasi Berbasis Web dengan Google Sheets sebagai Backend**

> ©noer_w@smkn3pct — SMK Negeri 3 Pacitan

---

## 📌 Daftar Isi

1. [Pengenalan](#1-pengenalan)
2. [Fitur Utama](#2-fitur-utama)
3. [Persyaratan](#3-persyaratan)
4. [Setup Google Sheets](#4-setup-google-sheets)
5. [Setup Google Apps Script](#5-setup-google-apps-script)
6. [Konfigurasi Frontend](#6-konfigurasi-frontend)
7. [Deploy ke Netlify](#7-deploy-ke-netlify)
8. [Cara Menggunakan (Guru)](#8-cara-menggunakan-guru)
9. [Cara Menggunakan (Peserta)](#9-cara-menggunakan-peserta)
10. [Menambahkan Gambar pada Soal](#10-menambahkan-gambar-pada-soal)
11. [Troubleshooting](#11-troubleshooting)
12. [FAQ](#12-faq)
13. [Struktur Data](#13-struktur-data)
14. [Kredit](#14-kredit)

---

## 1. Pengenalan

**E-Asesmen Mandiri** adalah sistem asesmen berbasis web yang ringan, gratis, dan mudah digunakan. Dikembangkan untuk membantu guru menyelenggarakan asesmen harian, tengah semester, dan akhir semester tanpa harus membuat soal satu per satu di Google Forms.

### Mengapa E-Asesmen Mandiri?

| Masalah dengan Google Forms | Solusi E-Asesmen Mandiri |
|-----------------------------|--------------------------|
| Buat soal satu per satu | Kelola soal di Google Sheets, sekali input bisa dipakai berulang |
| Tidak ada timer | Timer fleksibel 60/90/120 menit |
| Tidak ada anti-cheat | Klik kanan, copy-paste, devtools, pindah tab diblokir |
| Jawaban esai harus dikoreksi manual | Penilaian otomatis untuk PG dan isian |
| Hasil tersebar | Semua hasil di 1 spreadsheet |
| Butuh kuota Google Forms | 100% gratis |

---

## 2. Fitur Utama

- ✅ **Dua tipe soal**: Pilihan Ganda (PG) dan Jawaban Singkat (isian)
- ✅ **Dukungan gambar**: dari URL publik atau Google Drive
- ✅ **Durasi fleksibel**: 60, 90, atau 120 menit
- ✅ **Pilih soal bebas**: misal no. 1-25, atau acak per peserta
- ✅ **Acak soal & opsi**: tiap peserta bisa dapat urutan berbeda
- ✅ **Anti-cheat**: klik kanan, copy-paste, F12, pindah tab, resize window
- ✅ **Timer visual**: peringatan merah saat ≤5 menit
- ✅ **Penilaian server-side**: kunci jawaban tidak dikirim ke client
- ✅ **Tanpa instalasi**: peserta cukup buka browser
- ✅ **Data terpusat**: semua di Google Sheets
- ✅ **Gratis**: Google Sheets + Apps Script + Netlify

---

## 3. Persyaratan

| Perangkat | Keterangan |
|-----------|-----------|
| **Akun Google** | Untuk Sheets dan Apps Script |
| **Akun Netlify** | Gratis, daftar di [netlify.com](https://netlify.com) |
| **Browser modern** | Chrome, Edge, Firefox, Safari |
| **Teks editor** | Notepad, VS Code, atau sejenisnya |
| **Koneksi internet** | Untuk deploy & akses |

---

## 4. Setup Google Sheets

### Langkah 1: Buat Spreadsheet

1. Buka [https://sheets.google.com](https://sheets.google.com)
2. Klik **"+ Blank"** → beri nama **"Database E-Asesmen"**

### Langkah 2: Buat 3 Sheet

Klik ikon **"+"** di bawah untuk menambah sheet. Buat 3 sheet:

- `BankSoal`
- `Sesi`
- `Hasil`

### Langkah 3: Isi Header Setiap Sheet

#### Sheet `BankSoal` — baris 1:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| id | tipe | soal | gambar | pilihan | jawaban | aktif |

#### Sheet `Sesi` — baris 1:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| id_sesi | nama_sesi | soal_ids | durasi | acak_soal | acak_opsi | token | waktu_dibuat | status |

#### Sheet `Hasil` — baris 1:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| timestamp | id_sesi | nama | kelas | skor | benar | total | pelanggaran | detail |

### Langkah 4: Isi Contoh Soal

Di sheet `BankSoal`, isi minimal 3 soal:

| id | tipe | soal | gambar | pilihan | jawaban | aktif |
|----|------|------|--------|---------|---------|-------|
| 1 | pg | Apa ibu kota Indonesia? | | `["Bandung","Jakarta","Surabaya","Medan"]` | Jakarta | TRUE |
| 2 | isian | Hasil dari 15 + 27 = ... | | | 42 | TRUE |
| 3 | pg | Siapa presiden pertama Indonesia? | | `["Soekarno","Soeharto","Habibie","Jokowi"]` | Soekarno | TRUE |

> 💡 **Catatan format `pilihan`**: berupa JSON array (pakai tanda `["...","..."]`). Untuk soal isian, kolom `pilihan` boleh kosong.

---

## 5. Setup Google Apps Script

### Langkah 1: Buka Editor

Dari spreadsheet, klik **Extensions → Apps Script**.

### Langkah 2: Paste Kode

1. Hapus semua kode default
2. Copy-paste seluruh isi file `google-apps-script/Code.gs`
3. Simpan (Ctrl+S)

### Langkah 3: Deploy sebagai Web App

1. Klik **Deploy → New deployment**
2. Klik ikon gerigi ⚙️ → pilih **Web app**
3. Isi:
   - **Description**: `E-Asesmen v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Klik **Deploy**
5. Klik **Authorize access** → pilih akun Google → **Allow**
6. **Copy URL** yang muncul (format: `https://script.google.com/macros/s/XXXXX/exec`)

> ⚠️ **Simpan URL ini** — akan digunakan di `config.js`.

---

## 6. Konfigurasi Frontend

### Langkah 1: Edit `config.js`

Buka `config.js`, ganti `API_URL`:

```javascript
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/XXXXX/exec', // ← paste URL Anda
};
```

---

## 7. Deploy ke Netlify

### Cara 1 — Drag & Drop (TERMUDAH)

1. Buka [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. **Drag folder `e-asesmen/`** (berisi semua file) ke browser
3. Tunggu ±30 detik
4. Netlify memberi URL: `https://random-name.netlify.app`
5. **Selesai!**

### Cara 2 — Via GitHub (Opsional)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/e-asesmen.git
git push -u origin main
```

Lalu di Netlify: **Add new site → Import from Git → pilih repo → Deploy**.

### URL Setelah Deploy

- **Panel Admin**: `https://[nama-situs].netlify.app/admin.html`
- **Peserta**: `https://[nama-situs].netlify.app/index.html?token=XXX`

---

## 8. Cara Menggunakan (Guru)

### A. Menambah Soal

**Via Google Sheets** (cepat):

1. Buka sheet `BankSoal`
2. Tambah baris baru, isi semua kolom
3. Selesai

**Via Panel Admin** (dengan preview):

1. Buka `https://[situs].netlify.app/admin.html`
2. Klik tab **"➕ Tambah Soal"**
3. Isi form → klik **"💾 Simpan Soal"**

### B. Membuat Sesi Ujian

1. Buka `admin.html` → tab **"⚙️ Buat Sesi"**
2. Isi **Nama Sesi** (misal: "UTS Matematika Kelas XI")
3. Pilih **Durasi**: 60, 90, atau 120 menit
4. **Centang soal** yang akan diujikan (bisa filter PG/isian, search)
5. Centang **Acak Soal** / **Acak Opsi** jika perlu
6. Klik **"🚀 Generate Link Ujian"**
7. Muncul **Token** dan **Link Peserta**
8. Klik **"Copy"** → bagikan link ke peserta (WhatsApp, Classroom, dll)

### C. Melihat Hasil

1. Setelah sesi dibuat, klik **"📊 Lihat Hasil Peserta"**
2. Muncul tabel: Nama, Kelas, Skor, Benar/Total, Pelanggaran
3. Detail lengkap ada di sheet `Hasil` kolom `detail` (format JSON)

### D. Tips Mengelola Soal

- **Menonaktifkan soal**: ubah kolom `aktif` menjadi `FALSE` (tidak dihapus, bisa diaktifkan lagi)
- **Menghapus soal**: hapus baris (permanen)
- **Edit soal**: langsung ubah di sheet
- **Backup**: file → download sebagai Excel/CSV secara berkala

---

## 9. Cara Menggunakan (Peserta)

### A. Mengakses Ujian

1. Buka link yang diberikan guru (misal: `.../index.html?token=ABC123`)
2. Isi **Nama Lengkap** dan **Kelas**
3. Klik **"Mulai Evaluasi"**

### B. Mengerjakan Soal

1. Soal muncul satu per satu
2. **PG**: klik opsi jawaban yang benar
3. **Isian**: ketik jawaban
4. Klik **"Selanjutnya →"** / **"← Sebelumnya"** untuk navigasi
5. Jawaban otomatis tersimpan saat pindah soal

### C. Aturan Selama Ujian

❌ **DILARANG**:

- Klik kanan
- Copy / paste / cut teks
- Buka Developer Tools (F12, Ctrl+Shift+I)
- View Source (Ctrl+U)
- Pindah ke tab lain
- Resize window secara drastis

⚠️ Setiap pelanggaran dicatat dan dilaporkan ke guru.

### D. Menyelesaikan Ujian

1. Setelah semua soal dijawab, klik **"Selesai & Kirim"**
2. Konfirmasi
3. Muncul halaman "Terima Kasih"

> ⏰ Jika waktu habis, jawaban otomatis terkirim.

---

## 10. Menambahkan Gambar pada Soal

### Cara A: URL Gambar Publik

Cukup paste URL gambar ke kolom `gambar`. Contoh:

```
https://i.imgur.com/abc123.jpg
https://contoh.com/gambar/diagram.png
```

### Cara B: Google Drive (Disarankan)

1. Buka [https://drive.google.com](https://drive.google.com)
2. **New → File upload** → pilih gambar
3. **Klik kanan** file → **"Get link"**
4. Ubah akses dari **"Restricted"** → **"Anyone with the link"**
5. Klik **"Copy link"**
6. Paste ke kolom `gambar` (atau form "Tambah Soal")

Sistem akan **otomatis mengonversi** link Drive seperti:

```
https://drive.google.com/file/d/ABC123/view
```

Menjadi URL gambar langsung:

```
https://lh3.googleusercontent.com/d/ABC123=w1200
```

### Tips Gambar

- Ukuran file disarankan **≤ 1 MB**
- Dimensi maksimal **1200×1200 px**
- Format: JPG, PNG, atau WebP
- Jika preview tidak muncul → pastikan akses publik **"Anyone with the link"**

---

## 11. Troubleshooting

### ❌ Gambar tidak muncul di soal

**Penyebab**: Link Drive belum publik.

**Solusi**:
1. Buka Drive → klik kanan file → "Get link"
2. Pastikan **"Anyone with the link"** (bukan "Restricted")
3. Copy ulang link → paste ulang

### ❌ Soal tidak muncul / "Token tidak valid"

**Penyebab**: Token salah, atau sesi tidak aktif.

**Solusi**:
- Cek URL: pastikan `?token=XXXXXX` sesuai
- Cek sheet `Sesi` → kolom `status` harus `aktif`

### ❌ Data tidak masuk ke Google Sheets

**Penyebab**: URL Apps Script salah, atau deployment belum di-update.

**Solusi**:
1. Cek `config.js` → pastikan `API_URL` benar
2. Di Apps Script: **Deploy → Manage deployments → ✏️ → New version → Deploy**
3. Buka sheet `Hasil` → pastikan ada baris baru

### ❌ Muncul error CORS

**Penyebab**: Ini normal saat POST dengan `mode: 'no-cors'`.

**Solusi**: Data tetap masuk ke Sheets meskipun response tidak bisa dibaca. Untuk melihat hasil, klik **"Lihat Hasil"** di admin atau buka sheet langsung.

### ❌ Timer tidak reset saat refresh

**Penyebab**: Timer berjalan di client, tidak persistent.

**Solusi**: Ini adalah keterbatasan desain. Peserta sebaiknya tidak refresh. Untuk ujian ketat, siapkan pengawasan guru.

### ❌ Ingin update kode backend

**Solusi**:
1. Edit `Code.gs` di Apps Script
2. **Deploy → Manage deployments → ✏️ → New version → Deploy**
3. URL tetap sama, frontend tidak perlu diubah

---

## 12. FAQ

**Q: Apakah ada batasan jumlah soal?**  
A: Google Sheets bisa menampung ribuan soal. Praktisnya, untuk 1 sesi asesmen 25-100 soal sangat aman.

**Q: Apakah bisa dipakai untuk 100+ peserta sekaligus?**  
A: Bisa. Apps Script memiliki kuota ±20.000 request/hari untuk akun gratis. 100 peserta × 5 request = 500 request, sangat aman.

**Q: Apakah hasil aman?**  
A: Kunci jawaban **tidak dikirim ke client**, dinilai di server. Peserta tidak bisa melihat jawaban lewat DevTools. Namun, tanpa login NIS, peserta bisa mengerjakan berkali-kali.

**Q: Bagaimana backup data?**  
A: Di Google Sheets → File → Download → Microsoft Excel (.xlsx). Lakukan berkala.

**Q: Apakah bisa custom domain?**  
A: Bisa. Di Netlify: **Domain settings → Add custom domain**.

**Q: Berapa biaya operasional?**  
A: **Rp 0,-** (gratis sepenuhnya). Google Sheets, Apps Script, dan Netlify punya tier gratis yang cukup untuk skala sekolah.

**Q: Bagaimana kalau Google down?**  
A: Sistem tidak bisa diakses sementara. Sangat jarang terjadi. Untuk antisipasi, siapkan backup soal dalam bentuk cetak.

---

## 13. Struktur Data

### Sheet `BankSoal`

| Kolom | Contoh | Keterangan |
|-------|--------|------------|
| id | 1 | ID unik (auto) |
| tipe | `pg` / `isian` | Jenis soal |
| soal | "Apa ibu kota Indonesia?" | Teks soal |
| gambar | `https://...` | URL gambar (opsional) |
| pilihan | `["A","B","C","D"]` | JSON array (khusus PG) |
| jawaban | "Jakarta" | Kunci jawaban |
| aktif | `TRUE` / `FALSE` | Status soal |

### Sheet `Sesi`

| Kolom | Contoh | Keterangan |
|-------|--------|------------|
| id_sesi | `S1731234567` | Auto-generated |
| nama_sesi | "UTS Matematika" | Nama sesi |
| soal_ids | `[1,2,3,4,5]` | Array ID soal |
| durasi | 90 | Menit |
| acak_soal | TRUE / FALSE | Acak urutan soal |
| acak_opsi | TRUE / FALSE | Acak opsi jawaban |
| token | `ABC123` | Token akses peserta |
| waktu_dibuat | ISO string | Timestamp |
| status | `aktif` / `nonaktif` | Status sesi |

### Sheet `Hasil`

| Kolom | Contoh | Keterangan |
|-------|--------|------------|
| timestamp | ISO string | Waktu submit |
| id_sesi | `S1731234567` | ID sesi |
| nama | "Budi Santoso" | Nama peserta |
| kelas | "XI IPA 1" | Kelas peserta |
| skor | 90 | Skor 0-100 |
| benar | 9 | Jumlah benar |
| total | 10 | Total soal |
| pelanggaran | 2 | Jumlah pelanggaran |
| detail | JSON | Detail per soal |

---

## 14. Kredit

**E-Asesmen Mandiri v2.0**

Dikembangkan sebagai karya inovasi pembelajaran untuk memajukan pendidikan Indonesia.

> ©noer_w@smkn3pct — SMK Negeri 3 Pacitan

**Teknologi yang digunakan:**
- Google Sheets (basis data)
- Google Apps Script (API backend)
- HTML, CSS, JavaScript (frontend)
- Netlify (hosting gratis)

**Lisensi:** Bebas digunakan untuk keperluan pendidikan. Modifikasi diperbolehkan dengan menyertakan kredit.

---

## 📞 Bantuan

Jika menemui kendala:

1. Baca ulang bagian **Troubleshooting** di atas
2. Cek sheet `Hasil` untuk memastikan data masuk
3. Pastikan semua langkah di [Setup](#5-setup-google-apps-script) sudah diikuti

**Selamat mengajar! 🎓**
