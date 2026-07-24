# EWS-APS — Early Warning System Anak Putus Sekolah
### Backend API — Kabupaten Sleman

Backend NestJS + PostgreSQL + Prisma untuk sistem EWS-APS, dibangun mengikuti `SRS_EWS.pdf` dan `Flowchart_EWS-ATS.png` yang diberikan: Alur Pencegahan (berbasis pelaporan sekolah) dan Alur Penanganan (berbasis pengaduan masyarakat), dengan state machine 10-status (S01–S10), 5 aktor (Admin, Sekolah, Kapanewon, OPD, Dinas Pendidikan), dan seluruh Business Rules (BR-01 s/d BR-20) dari SRS.

---

## 1. Arsitektur Singkat

```
Layer 1 (Intelligence)   -> Modul Prediction   : skor risiko siswa (lihat catatan ML di bawah)
Layer 2 (Case Mgmt/inti) -> Modul Cases         : "Satu Kasus = Satu Siklus Penanganan"
Layer 3 (Decision)       -> RiskFactor -> tingkat risiko -> rekomendasi OPD (ditentukan Kapanewon)
Layer 4 (Intervention)   -> Modul Referral (Rujukan) + Modul Intervention
```

Setiap Case punya **satu status aktif** (BR-03) yang divalidasi & dicatat oleh
`CaseStateMachineService` (`src/cases/case-state-machine.service.ts`). Semua transisi
status masuk ke tabel `case_timeline` sebagai audit trail **append-only** (BR-04, BR-05).

### State Machine (persis dari SRS)

| State | Nama | PIC |
|---|---|---|
| S01 | Case Created | Sekolah / Kapanewon |
| S02 | Verifikasi NIK | Sekolah |
| S03 | Home Visit | Sekolah |
| S04 | Selesai Pencegahan (final, jalur pencegahan) | Sekolah |
| S05 | Menunggu Rujukan | Kapanewon |
| S06 | Dirujuk ke OPD | Kapanewon |
| S07 | Intervensi Berjalan | OPD |
| S08 | Verifikasi Penyelesaian | Dinas Pendidikan |
| S09 | Monitoring | Dinas Pendidikan |
| S10 | Closed Case (final) | Dinas Pendidikan |

Jalur **Pelaporan Sekolah**: S01 → S02 → S03 → (S04 selesai, ATAU S05 jika tidak kembali).
Jalur **Pengaduan Masyarakat**: S01 → S05 langsung (setelah Kapanewon verifikasi pengaduan).
Keduanya bertemu di S05 → S06 → S07 → S08 → S09 → S10.

### 🧠 Model ML: `ews-ml-service` (integrasi model asli ewsDropOut)

Modul Prediction sekarang terhubung ke model **asli** dari
[`hdmeasure/ewsDropOut`](https://github.com/hdmeasure/ewsDropOut) — XGBoost tiered
(`aspd_num` + fallback `tanpa_aspd`) dengan kalibrasi probabilitas dan koreksi prior
populasi, persis seperti `platform_export/predict.R` / `predict.py` di repo tersebut.

Karena model itu XGBoost native (R/Python) dan backend ini Node.js, integrasinya lewat
**microservice Python terpisah** — folder `ews-ml-service/` (satu level di atas folder
ini) — yang membungkus model itu sebagai REST API. `PredictionService` memanggilnya
lewat `MlClientService` (`src/prediction/ml-client.service.ts`) menggunakan env var
`ML_SERVICE_URL`.

**Alur data**: NISN siswa → fitur (`jk_bin`, `num`, `kode_pendidikan_ayah/ibu`,
`kode_penghasilan_ayah/ibu` dari tabel `students`; `sulingjar_*` dari tabel `schools`,
level sekolah) → `POST {ML_SERVICE_URL}/predict` → hasil (`prob_do`, `risiko_do`,
`alasan_risiko` SHAP, `model_dipakai`) disimpan ke tabel `predictions`, plus
`probabilitas`/`riskCategory` yang diturunkan supaya tetap kompatibel dengan
Dashboard & klasifikasi 3-tingkat (Rendah/Sedang/Tinggi) di flowchart.

**Jika `ML_SERVICE_URL` kosong atau service itu tidak bisa diakses**, backend otomatis
jatuh ke rule-based scoring sementara (`prediction-engine.service.ts`) — sistem tetap
jalan, hanya akurasinya jauh lebih rendah. Field `modelDipakai` pada hasil prediksi akan
berisi `"fallback-rule-based"` supaya kondisi ini terlihat jelas di data.

**Cara mengaktifkan model asli:**
1. Siapkan `aspd_num_spec.json` + `aspd_num_booster.json` (dan `tanpa_aspd_*` untuk
   fallback) dari hasil training di repo `ewsDropOut` kamu — lihat
   `ews-ml-service/models/README.md`.
2. Jalankan `ews-ml-service` (lihat README di folder itu): `uvicorn app:app --port 8000`.
3. Set `ML_SERVICE_URL=http://localhost:8000` di `.env` backend ini, lalu restart.

BR-19 tetap dijaga di kedua jalur (ML asli maupun fallback): prediksi **tidak pernah**
membuat Case secara otomatis — hanya rekomendasi untuk Sekolah.

---

## 2. Setup

### Prasyarat
- Node.js 20+
- Docker (untuk PostgreSQL lokal) — atau PostgreSQL 14+ yang sudah terinstall

### Langkah

```bash
cd ews-backend
cp .env.example .env          # sesuaikan DATABASE_URL & JWT_SECRET jika perlu
npm install

# jalankan PostgreSQL via Docker
docker compose up -d

# generate Prisma client & migrasi database
npm run prisma:generate
npm run prisma:migrate -- --name init

# isi data awal (5 akun demo, master sekolah/OPD/wilayah/faktor risiko Sleman)
npm run seed

# jalankan server
npm run start:dev
```

Server berjalan di `http://localhost:3000/api`.
Dokumentasi Swagger otomatis di `http://localhost:3000/api/docs` (semua endpoint bisa dicoba langsung dari sana, termasuk login untuk dapat token Bearer).

### Akun demo (dari seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@sleman.go.id | admin123 |
| Dinas Pendidikan | dinas@sleman.go.id | dinas123 |
| OPD | opd.dinsos@sleman.go.id | opd123 |
| OPD | opd.disnaker@sleman.go.id | opd123 |
| OPD | opd.dinkes@sleman.go.id | opd123 |
| OPD | opd.dp3ap2kb@sleman.go.id | opd123 |
| Kapanewon | kapanewon.{slug-nama-kapanewon}@sleman.go.id | kapanewon123 |
| Sekolah | sekolah.{npsn}@sleman.go.id | sekolah123 |

Satu akun dibuat untuk **tiap** OPD (4), **tiap** kapanewon (17), dan **tiap**
sekolah (889) — bukan satu akun demo generik — supaya alur kerja lintas-role
(mis. rujukan multi-OPD) bisa diuji end-to-end dengan akun yang benar-benar
terikat ke entitas masing-masing. Lihat log saat `npm run seed` dijalankan
untuk daftar lengkap, atau cek tabel `users` langsung.

---

## 3. Ringkasan Endpoint (lihat Swagger untuk detail lengkap & request body)

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/change-password

# Master Data (Admin untuk write, semua role read)
GET|POST|PUT|DELETE  /api/users            (Admin only)
GET|POST|PUT|DELETE  /api/schools
GET|POST|PUT|DELETE  /api/opd
GET|POST|PUT|DELETE  /api/wilayah
GET|POST|PUT|DELETE  /api/risk-factors
GET|POST|PUT|DELETE  /api/intervention-types
GET|POST|PUT|DELETE  /api/regulations

# Siswa & Prediksi (Layer 1)
GET|POST|PUT|DELETE  /api/students
POST   /api/predictions/simulate          (Sekolah — simulasi 1 siswa)
POST   /api/predictions/bulk-upload       (Admin — upload dataset batch)
GET    /api/predictions
GET    /api/predictions/actionable        (siswa risiko sedang/tinggi belum ada Case)
GET    /api/predictions/student/:id

# Case — Alur Pencegahan & Penanganan (Layer 2)
POST   /api/cases/pelaporan-sekolah              (Sekolah)     -> buat Case, S01
POST   /api/cases/pengaduan-masyarakat           (Kapanewon)   -> buat Case, S01
POST   /api/cases/:id/verifikasi-nik             (Sekolah)     -> S01 -> S02
POST   /api/cases/:id/verifikasi-pengaduan       (Kapanewon)   -> S01 -> S05
GET    /api/cases
GET    /api/cases/:id
GET    /api/cases/:id/timeline

# Home Visit (BR-06, BR-07, BR-15)
POST   /api/cases/:caseId/home-visits            (Sekolah)     -> bisa berkali-kali
GET    /api/cases/:caseId/home-visits

# Rujukan (BR-10, BR-11) — Layer 3/4
POST   /api/cases/:caseId/referral               (Kapanewon)   -> S05 -> S06
GET    /api/referrals                            (OPD hanya lihat miliknya)
GET    /api/referrals/:id

# Intervensi (BR-12, BR-16)
POST   /api/referrals/:referralId/interventions          (OPD)
PUT    /api/interventions/:id/result                      (OPD)
POST   /api/referrals/:referralId/submit-completion       (OPD) -> S07 -> S08
GET    /api/referrals/:referralId/interventions

# Verifikasi Penyelesaian (Dinas)
POST   /api/referrals/:referralId/review          (Dinas) -> APPROVE: S08->S09 | PERLU_PERBAIKAN: S08->S07

# Monitoring & Closed Case (BR-13, BR-17, BR-18)
POST   /api/cases/:caseId/monitoring              (Dinas)
GET    /api/cases/:caseId/monitoring
POST   /api/cases/:caseId/close                   (Dinas) -> S09 -> S10
POST   /api/cases/:caseId/reopen                  (Dinas) -> Reopen kasus Closed

# Dashboard & Laporan
GET    /api/dashboard                              (isi berbeda sesuai role login)
GET    /api/reports/rekap                          (Admin/Dinas)
GET    /api/reports/statistik-sekolah
GET    /api/reports/export                         (Admin/Dinas)

# Upload file (foto Home Visit, lampiran Intervensi)
POST   /api/uploads   (multipart/form-data, field name: "file") -> { url }
```

Semua endpoint (kecuali `/auth/login`) butuh header `Authorization: Bearer <token>` dari hasil login.

---

## 4. Keputusan desain & simplifikasi yang perlu diketahui

- **Role** disimpan sebagai enum (`ADMIN`, `SEKOLAH`, `KAPANEWON`, `OPD`, `DINAS_PENDIDIKAN`)
  langsung di tabel `User`, bukan tabel `Role` terpisah — cukup untuk RBAC dan lebih
  sederhana untuk di-maintain. Kalau nanti butuh role dinamis/custom permission per user,
  ini bagian yang perlu diperluas jadi tabel Role+Permission.
- **Upload file** memakai disk lokal (folder `uploads/`) via Multer — cukup untuk
  development. Untuk produksi, ganti storage engine di `src/uploads/uploads.controller.ts`
  ke S3/MinIO/GCS (kode lain tidak perlu berubah, karena kontraknya cuma "kembalikan URL").
  Field `mode: 'insensitive'` di beberapa query mengasumsikan PostgreSQL.
- **Master data DTO** (`schools`, `opd`, `wilayah`, `risk-factors`, `intervention-types`,
  `regulations`) memakai tipe `any` untuk mempercepat scaffolding awal. Untuk validasi
  input yang lebih ketat, tambahkan `class-validator` DTO per entity (pola yang sama
  seperti `src/students/dto/student.dto.ts`).
- **Soft-delete**: `User` dan `School` di-nonaktifkan (`active: false`), bukan dihapus,
  supaya histori Case/Timeline yang mereferensikannya tidak rusak (selaras BR-14).
- **BR-20** (cek Case aktif sebelum membuat Case baru untuk siswa yang sama) dikembalikan
  sebagai `409 Conflict` berisi info Case aktif; caller lalu bisa kirim ulang dengan
  `forceNewCase: true` jika memang mau membuat Case terpisah.

---

## 5. Belum termasuk / langkah lanjutan yang disarankan

1. **Frontend integration**: frontend yang sudah ada (`ews-ats-frontend`) memakai
   service layer axios sendiri — endpoint & bentuk response di atas kemungkinan perlu
   disesuaikan sedikit di sisi frontend (base URL `http://localhost:3000/api`, field
   nama JSON, dsb). Ini langkah berikutnya sesuai kesepakatan kita.
2. **Rate limiting, logging terstruktur, dan test otomatis (e2e)** belum ditambahkan —
   direkomendasikan sebelum deploy produksi.
3. **Notifikasi realtime** (SRS menyebut "Notifikasi ke OPD"/"Notifikasi ke Dinas
   Pendidikan") saat ini berupa data yang bisa di-query (Case baru berstatus tertentu);
   kalau butuh push notification/email, tambahkan modul notifikasi terpisah yang
   di-trigger dari `CaseStateMachineService.transition()`.
4. **Model file untuk `ews-ml-service`** (`*_spec.json` + `*_booster.json`) belum
   disertakan di sini — itu artefak hasil training dari repo `ewsDropOut` kamu sendiri
   (data siswa bersifat rahasia). Lihat `ews-ml-service/models/README.md`.
