# Mastering Data Siswa — Ringkasan Perubahan

> **Update terbaru**: (1) memperbaiki error TypeScript di `students.service.ts`
> yang muncul setelah `prisma generate` dijalankan (lihat §4), dan (2)
> menyambungkan seluruh kartu dashboard (Total Siswa, Risiko Tinggi, Kunjungan
> Rumah Aktif, progress bar, status selesai/pending, dst — di keempat dashboard:
> Sekolah, Kapanewon, OPD, dan Dinas/Admin) ke data API asli, bukan lagi angka
> statis (lihat §5).

Dokumen ini menjelaskan penambahan fitur *mastering data* berdasarkan
`Data_Siswa_Aktif.xlsx`, dan langkah yang perlu dijalankan di environment
Anda (migrasi & seed **belum** dijalankan otomatis — lihat catatan di bawah).

## 1. Apa yang ditambahkan

### Backend (`ews-backend`)
- **`prisma/schema.prisma`** — 7 model master baru (additive, tidak mengubah yang lama):
  `Agama`, `KebutuhanKhusus`, `JenisTinggal`, `AlatTransportasi`, `PekerjaanOrtu`,
  `PendidikanOrtu` (kodeOrdinal 0-8), `PenghasilanOrtu` (kodeOrdinal 0-6).
  Model `Student` mendapat ±35 kolom baru (alamat detail, agama, kebutuhan khusus,
  jenis tinggal, alat transportasi, KIP/KPS/PIP, data ayah & ibu lengkap) — semua
  **opsional**, dan kolom ML lama (`kodePendidikanAyah/Ibu`, `kodePenghasilanAyah/Ibu`)
  **tetap ada, tidak dihapus**.
- **`src/master/{agama,kebutuhan-khusus,jenis-tinggal,alat-transportasi,pekerjaan-ortu,
  pendidikan-ortu,penghasilan-ortu}/`** — 7 modul NestJS CRUD baru (pola sama seperti
  modul `wilayah`), didaftarkan di `src/master/master.module.ts`.
- **`src/students/`** — DTO & service diperluas menerima field mastering data baru.
  `StudentsService.syncOrdinalCodes()` otomatis mengisi `kodePendidikanAyah/Ibu` &
  `kodePenghasilanAyah/Ibu` (fitur ML lama) dari `kodeOrdinal` master saat
  `pendidikanAyahId/IbuId` / `penghasilanAyahId/IbuId` diisi — tanpa menimpa bila
  Anda mengisi kode manual di payload yang sama.
- **`src/dashboard/`** — endpoint baru:
  - `GET /dashboard/schools/:schoolId/analytics`
  - `GET /dashboard/kapanewon/:kapanewon/analytics`
  Keduanya mengagregasi sebaran agama, ekonomi/pendidikan ortu, kebutuhan khusus,
  jenis tinggal, alat transportasi, bantuan sosial (KPS/KIP/PIP), dan sebaran risiko
  ML terbaru. Scoping role tetap dihormati (SEKOLAH hanya sekolah sendiri, KAPANEWON
  hanya kapanewon sendiri).
- **`prisma/seed-data/`**:
  - `schools.json` — ditambah 4 sekolah (TK ABA Pereng Dawe, TK ABA Gamping,
    TK Mutiara Gamping, POS PAUD Mekar Harapan) yang ada di Excel tapi belum
    terdaftar. 889 entri lama **tidak diubah**.
  - `agama.json`, `kebutuhan-khusus.json`, `jenis-tinggal.json`,
    `alat-transportasi.json`, `pekerjaan-ortu.json`, `pendidikan-ortu.json`,
    `penghasilan-ortu.json` — master baru, diturunkan dari nilai unik di Excel +
    referensi standar (mis. 6 agama resmi, 17 kategori kebutuhan khusus Dapodik A-Q).
  - `students-aktif.json` — 3.576 siswa aktif (dari 3.579 baris Excel; 3 dilewati
    karena NISN/NIK kosong atau duplikat), siap di-upsert idempotent.
- **`prisma/seed.ts`** — diperluas memuat & meng-*upsert* (skipDuplicates) semua
  data di atas. Aman dijalankan berulang kali.

### Frontend (`ews-frontend`)
- **`src/types/api.ts`** & **`src/services/master.service.ts`** — tipe + API client
  untuk 7 master baru.
- **`src/pages/master/{Agama,KebutuhanKhusus,JenisTinggal,AlatTransportasi,
  PekerjaanOrtu,PendidikanOrtu,PenghasilanOrtu}Page.tsx`** — halaman CRUD baru
  (pakai komponen `MasterCrudPage` yang sudah ada), terdaftar di `App.tsx` &
  menu sidebar baru "MASTERING DATA SISWA".
- **`src/pages/students/StudentListPage.tsx`** — form tambah/edit siswa diperluas
  penuh mengikuti kolom `Data_Siswa_Aktif.xlsx` (alamat detail, agama, kebutuhan
  khusus, jenis tinggal, alat transportasi, KIP/KPS, data ayah/ibu lengkap dengan
  dropdown master — bukan lagi input angka mentah).
- **`src/services/dashboard.service.ts`** (baru) & **`src/components/dashboard/
  AnalyticsPanel.tsx`** (baru) — panel "Analisis Otomatis" yang menampilkan data
  asli dari endpoint analytics di atas, disisipkan di bagian bawah
  `DashboardSchool.tsx` dan `dashboard-kapanewon/DashboardPage.tsx` (bagian dashboard
  lain yang sudah ada tidak diubah/dihapus).

## 2. Langkah menjalankan di environment Anda

> **Catatan penting**: perubahan ini dikerjakan di sandbox tanpa akses ke
> `binaries.prisma.sh` (di-blok jaringan), sehingga saya **tidak bisa** menjalankan
> `prisma generate` / `prisma migrate dev` secara langsung untuk menguji end-to-end.
> Skema sudah divalidasi struktural (parser resmi Prisma via WASM) dan seluruh kode
> TypeScript sudah dicek dengan `tsc --noEmit` — satu-satunya error yang tersisa
> adalah "properti tidak ditemukan di PrismaClient", yang **akan hilang otomatis**
> setelah `prisma generate` dijalankan di environment Anda (karena Prisma Client
> lama belum tahu model/kolom baru).

```bash
cd ews-backend

# 1. Install dependency (bila belum)
npm install

# 2. Generate ulang Prisma Client (mengambil model & kolom baru)
npx prisma generate

# 3. Buat & jalankan migrasi (Prisma otomatis membuat file migrasi SQL dari schema.prisma)
npx prisma migrate dev --name mastering_data_siswa

# 4. Jalankan seed (idempotent — aman dijalankan ulang)
npm run seed
```

Setelah itu backend siap jalan seperti biasa (`npm run start:dev`).
Untuk frontend tidak ada langkah tambahan selain `npm install` & `npm run dev` seperti biasa.

## 3. Hal yang perlu Anda tinjau

(lanjutan poin-poin di bawah)

## 4. Perbaikan error `students.service.ts` (setelah `prisma generate`)

Setelah Anda menjalankan `prisma generate` di environment nyata, TypeScript sempat
melaporkan error pada `create()`:

```
Type '{ tanggalLahir: Date | undefined; }' is not assignable to type 'Without<StudentCreateInput, ...>'
```

Penyebabnya: helper `syncOrdinalCodes()` awalnya diketik sebagai
`Record<string, any>`, sehingga TypeScript kehilangan info bahwa `CreateStudentDto`
menjamin field wajib `nisn`/`nik`/`nama`. Sudah diperbaiki dengan membuat fungsi
tersebut generic (`<T extends Record<string, any>>`) supaya tipe asli DTO tetap
terjaga sepanjang alur `create()`/`update()`. Tidak ada perubahan perilaku, murni
perbaikan tipe.

## 5. Kartu Dashboard sekarang data-driven (bukan lagi statis)

Sebelumnya seluruh kartu ringkasan (SummaryCard), progress bar (ProgressCard), dan
status selesai/pending (StatusCard) di keempat dashboard berisi angka contoh yang
ditulis langsung di kode (`value="1,284"`, dst). Sekarang semuanya diambil dari
`GET /dashboard` (endpoint yang sudah ada sebelumnya, hanya diperluas payload-nya)
— backend otomatis menyesuaikan isi respons berdasarkan role pengguna yang login:

| Role di token login | Halaman FE | Method backend |
|---|---|---|
| `SEKOLAH` | `/dashboard/school` (`DashboardSchool.tsx`) | `DashboardService.sekolahDashboard()` |
| `KAPANEWON` | `/dashboard/kapanewon` | `DashboardService.kapanewonDashboard()` |
| `OPD` | `/dashboard/dinas` (nama folder lama, sebenarnya untuk role OPD) | `DashboardService.opdDashboard()` |
| `ADMIN` / `DINAS_PENDIDIKAN` | `/dashboard` (folder `pages/dashboard`) | `DashboardService.dinasDashboard()` |

Semua angka dihitung real dari tabel `Case`, `HomeVisit`, `Referral`, `Prediction`,
dan `Student` (lihat `dashboard.service.ts`) — bukan estimasi. Beberapa label kartu
saya sesuaikan supaya jujur dengan apa yang benar-benar bisa dihitung dari data yang
ada (mis. "Pemberian Beasiswa"/"Konseling Psikologis" di ProgressCard diganti
"Verifikasi Kasus"/"Dirujuk ke OPD", karena tidak ada data historis program beasiswa
tersendiri di skema saat ini — silakan sesuaikan lagi bila Anda punya sumber data
untuk itu, mis. via `InterventionType`).

Catatan lain:
- 4 komponen `SummaryCard` (satu per folder dashboard) awalnya menerima prop
  `change`/`changeColor`/`subtitle`/`iconBg` yang **tidak terdaftar** di
  interface-nya (bug lama di template — akan gagal type-check). Sudah diperbaiki
  dengan menambahkan prop tersebut secara opsional ke masing-masing komponen.
- `components/dashboard-dinas/StatusCard.tsx` sebelumnya adalah komponen tanpa
  props (feed aktivitas statis "Timeline Aktivitas") padahal halamannya sudah
  memanggil dengan prop `completed`/`pending` (juga akan gagal type-check). Sudah
  diganti jadi varian `completed`/`pending` yang konsisten dengan dashboard lain.
- `ReportTable`, `DashboardChart` (grafik tren), dan `VillageHeatmap` di keempat
  dashboard **masih berisi data contoh** — belum disambungkan ke API pada iterasi
  ini karena strukturnya lebih kompleks (perlu data historis bulanan & data
  per-kalurahan). Ini bisa jadi langkah lanjutan berikutnya bila diperlukan.

## 6. `ReportTable`, `DashboardChart`, `VillageHeatmap` — sekarang juga data-driven

Melanjutkan §5, tiga komponen yang sebelumnya masih data contoh kini tersambung ke
endpoint baru:

| Endpoint baru | Dipakai oleh | Isi |
|---|---|---|
| `GET /dashboard/recent-cases` | `ReportTable` (Kapanewon/OPD/Dinas) | 6 kasus terbaru (nama siswa, NIK tersamar, wilayah, kategori, status) |
| `GET /dashboard/top-risk-students` | `ReportTable` (Sekolah) | 6 siswa risiko tertinggi (dari prediksi ML terbaru) + faktor dominan (SHAP) + status kasus |
| `GET /dashboard/monthly-trend` | `DashboardChart` (Kapanewon/OPD/Dinas) | Jumlah kasus baru & selesai per bulan, 6 bulan terakhir |
| `GET /dashboard/schools/:id/risk-trend?period=week\|month\|year` | `DashboardChart` (Sekolah) | Jumlah prediksi risiko Tinggi/Sedang per minggu/bulan/tahun |
| `GET /dashboard/kapanewon-heatmap` | `VillageHeatmap` | Total siswa & jumlah risiko tinggi per kapanewon (17 kapanewon Sleman), menggantikan `data/villages.ts` yang statis |

Semua endpoint role-scoped mengikuti pola yang sama seperti `GET /dashboard`
(`caseWhereForUser()` helper baru memusatkan logic scoping supaya konsisten).

**Catatan verifikasi**: saat mengembangkan `getRecentCases`, saya sempat menemukan
pola bug yang **sama persis** dengan bug `students.service.ts` di §4 — mengetik
sebuah helper (`caseWhereForUser`) sebagai `Promise<any>` merusak resolusi generic
Prisma untuk `include`. Sudah diperbaiki dengan mengetik return-nya sebagai
`Prisma.CaseWhereInput` (bukan `any`). Saya verifikasi dengan isolated test di
sandbox saya untuk memastikan akar masalahnya, jadi kali ini sudah dicek lebih
ketat sebelum diserahkan.

`data/villages.ts` (file statis lama) tidak lagi dipakai oleh `VillageHeatmap`, tapi
sengaja tidak saya hapus filenya — aman dihapus manual bila tidak dipakai di tempat
lain.


- **Mapping ordinal pendidikan/penghasilan** (`prisma/seed-data/pendidikan-ortu.json`,
  `penghasilan-ortu.json`) saya susun eksplisit berdasarkan urutan jenjang/rentang
  yang wajar, tapi silakan sesuaikan `kodeOrdinal` bila tim ML punya definisi resmi
  berbeda (lih. `docs/CODEBOOK.md` bila ada).
- **"Lainnya"** pada pendidikan ortu saya beri ordinal netral (setara SMA) karena
  jenjang sesungguhnya tidak teridentifikasi di data — pertimbangkan verifikasi manual.
- Siswa dengan `npsn` yang tidak ketemu di master sekolah akan tetap tersimpan
  (tanpa `schoolId`) — cek log `Siswa Aktif: ... tanpa schoolId` saat seed berjalan.
- Dashboard lama (kartu ringkasan, chart, tabel dummy) **tidak saya hapus** — panel
  "Analisis Otomatis — Mastering Data" ditambahkan sebagai section baru di bagian
  bawah tiap dashboard, memakai data asli. Mengganti seluruh dummy chart lama dengan
  data asli bisa jadi langkah lanjutan bila diperlukan.

## 7. Rujukan Multi-OPD (Kapanewon bisa pilih beberapa OPD sekaligus)

Sebelumnya satu Case hanya bisa dirujuk ke **satu** OPD (`Referral.caseId` bersifat
`@unique`). Sekarang Kapanewon bisa memilih **beberapa OPD terkait sekaligus** untuk
satu kasus (mis. kasus yang butuh intervensi Dinas Sosial *dan* Dinas Kesehatan
bersamaan).

### Perubahan skema
- `Case.referral Referral?` (satu-ke-satu) → `Case.referrals Referral[]` (satu-ke-banyak).
- `Referral.caseId` tidak lagi `@unique` — sekarang ada `@@unique([caseId, opdId])`
  untuk mencegah rujukan duplikat ke OPD yang sama pada Case yang sama.
- Setiap OPD tetap melacak status, intervensi, dan review-nya **secara independen**
  satu sama lain — OPD A menyelesaikan intervensinya tidak memengaruhi status OPD B.

### Perubahan API
- `POST /cases/:caseId/referral` — body berubah dari `{ opdId: number, ... }` menjadi
  `{ opdIds: number[], ... }` (minimal 1 OPD, tidak boleh duplikat). Response juga
  berubah dari satu object `Referral` menjadi **array** `Referral[]`.
- Semua endpoint lain (`GET /referrals`, `GET /referrals/:id`,
  `POST /referrals/:id/verify`, dst) **tidak berubah** — tetap beroperasi per baris
  Referral individual, jadi OPD tetap memverifikasi/menindaklanjuti rujukannya
  masing-masing seperti biasa.
- Endpoint rujukan langsung siswa DO (`POST /students/:id/referral-do`, jalur Admin)
  **tidak diubah** — tetap satu-OPD, karena tidak diminta perubahan di jalur ini.
  Skema tetap kompatibel bila suatu saat ingin dibuat multi-OPD juga.

### Perubahan UI (`CaseDetailPage.tsx`)
- Form "Rujukan oleh Kapanewon" sekarang menampilkan checkbox multi-select OPD
  (bukan dropdown single-select), dengan indikator "N OPD dipilih untuk intervensi
  bersama" dan tombol yang menyesuaikan teks ("Rujuk ke 3 OPD").
- Tampilan hasil rujukan direfaktor jadi komponen `ReferralCard` yang di-render
  berulang (`.map()`) — satu kartu terpisah per OPD yang dirujuk, masing-masing
  dengan status, daftar intervensi, dan tombol aksi (verifikasi/intervensi/review)
  miliknya sendiri.

### Catatan desain
- Multi-select hanya berlaku saat **membuat rujukan pertama kali** (status Case masih
  `MENUNGGU_RUJUKAN`). Menambah OPD susulan setelah Case berstatus `DIRUJUK_OPD` atau
  seterusnya **belum didukung** pada iterasi ini — bisa jadi pengembangan lanjutan
  bila Kapanewon perlu menambah OPD di tengah proses.
- Constraint `@@unique([caseId, opdId])` di level database jadi lapisan pertahanan
  kedua; validasi "OPD tidak boleh duplikat" juga sudah dicek di level DTO
  (`@ArrayUnique()`).

