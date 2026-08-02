export type UserRole =
  | "ADMIN"
  | "SEKOLAH"
  | "KAPANEWON"
  | "OPD"
  | "DINAS_PENDIDIKAN";

export type RiskCategory = "RENDAH" | "SEDANG" | "TINGGI";

export type CaseSource = "PELAPORAN_SEKOLAH" | "PENGADUAN_MASYARAKAT";

export type CaseStatus =
  | "DRAFT"
  | "CASE_CREATED" // S01
  | "VERIFIKASI_NIK" // S02
  | "HOME_VISIT" // S03
  | "SELESAI_PENCEGAHAN" // S04 (final)
  | "MENUNGGU_RUJUKAN" // S05
  | "DIRUJUK_OPD" // S06
  | "INTERVENSI_BERJALAN" // S07
  | "VERIFIKASI_PENYELESAIAN" // S08
  | "MONITORING" // S09
  | "CLOSED_CASE"; // S10 (final)

export type HomeVisitResult =
  | "BELUM_SELESAI"
  | "KEMBALI_SEKOLAH"
  | "TIDAK_KEMBALI";

export type AssignmentStatus =
  | "MENUNGGU"
  | "DITERIMA"
  | "INTERVENSI_BERJALAN"
  | "SELESAI_DIAJUKAN"
  | "SELESAI_DISETUJUI"
  | "PERLU_PERBAIKAN";

export type ReviewDecision = "APPROVE" | "PERLU_PERBAIKAN";

export type PredictionSource = "ML_BATCH" | "MANUAL";

export type StudentStatus =
  | "AKTIF"
  | "PUTUS_SEKOLAH"
  | "KEMBALI_SEKOLAH"
  | "LULUS"
  | "PINDAH";

// Asal Referral: dari alur Case (BR-10, oleh Kapanewon) atau jalur ringan rujukan
// siswa Putus Sekolah (DO) langsung oleh Admin, tanpa Case.
export type ReferralOrigin = "CASE" | "DO_STUDENT";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// ---------------------------------------------------------------------
// Master data
// ---------------------------------------------------------------------

export interface Wilayah {
  id: number;
  kapanewon: string;
  kalurahan?: string | null;
  createdAt: string;
}

export interface School {
  id: number;
  npsn: string;
  nama: string;
  jenjang: string;
  alamat?: string | null;
  kapanewon?: string | null;
  kalurahan?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active: boolean;
  // Hanya 4 indikator sulingjar yang dipakai model ML final — lihat
  // ews-ml-service/models/*_spec.json (fitur D.18, D.1, D.2, D.6).
  sulingjarKesiapsiagaanBencana?: number | null;
  sulingjarKualitasPembelajaran?: number | null;
  sulingjarRefleksiGuru?: number | null;
  sulingjarIklimKesetaraanGender?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Opd {
  id: number;
  kode: string;
  nama: string;
  jenisLayanan?: string | null;
  alamat?: string | null;
  kontak?: string | null;
  active: boolean;
  createdAt: string;
}

export interface RiskFactor {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  deskripsi?: string | null;
  active: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------
// Mastering data siswa (dari "Data Siswa Aktif" / Dapodik) — additive.
// ---------------------------------------------------------------------
export interface Agama {
  id: number;
  nama: string;
  active: boolean;
  createdAt: string;
}

export interface KebutuhanKhusus {
  id: number;
  kode?: string | null;
  nama: string;
  active: boolean;
  createdAt: string;
}

export interface JenisTinggal {
  id: number;
  nama: string;
  active: boolean;
  createdAt: string;
}

export interface AlatTransportasi {
  id: number;
  nama: string;
  active: boolean;
  createdAt: string;
}

export interface PekerjaanOrtu {
  id: number;
  nama: string;
  active: boolean;
  createdAt: string;
}

export interface PendidikanOrtu {
  id: number;
  nama: string;
  kodeOrdinal: number;
  active: boolean;
  createdAt: string;
}

export interface PenghasilanOrtu {
  id: number;
  nama: string;
  kodeOrdinal: number;
  active: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------
// Dashboard analytics (mastering data) — GET /dashboard/schools/:id/analytics
// dan GET /dashboard/kapanewon/:kapanewon/analytics
// ---------------------------------------------------------------------
export interface LabelCount {
  label: string;
  jumlah: number;
}

export interface StudentAnalytics {
  totalSiswa: number;
  sebaranJenisKelamin: LabelCount[];
  sebaranRisiko: {
    rendah: number;
    sedang: number;
    tinggi: number;
    belumDiprediksi: number;
  };
  sebaranAgama: LabelCount[];
  sebaranJenisTinggal: LabelCount[];
  sebaranAlatTransportasi: LabelCount[];
  sebaranKebutuhanKhusus: LabelCount[];
  sebaranPekerjaanAyah: LabelCount[];
  sebaranPekerjaanIbu: LabelCount[];
  sebaranPenghasilanAyah: LabelCount[];
  sebaranPenghasilanIbu: LabelCount[];
  sebaranPendidikanAyah: LabelCount[];
  sebaranPendidikanIbu: LabelCount[];
  bantuanSosial: { penerimaKps: number; penerimaKip: number; layakPip: number };
}

export interface SchoolAnalytics extends StudentAnalytics {
  school: { id: number; nama: string; npsn: string; kapanewon: string | null };
}

export interface KapanewonAnalytics extends StudentAnalytics {
  kapanewon: string;
  jumlahSekolah: number;
  perSekolah: { schoolId: number; nama: string; jumlahSiswa: number }[];
}

// ---------------------------------------------------------------------
// Dashboard cards (GET /dashboard) — metrik banner/SummaryCard/ProgressCard/
// StatusCard, role-scoped otomatis oleh backend berdasarkan token login.
// ---------------------------------------------------------------------
export interface DashboardProgressItem {
  label: string;
  value: number; // persentase 0-100
}

export interface DashboardStatus {
  completed: number;
  completedLocation: string;
  pending: number;
  pendingText: string;
}

export interface SekolahDashboardData {
  role: "SEKOLAH";
  jumlahPrediksi: number;
  jumlahPelaporan: number;
  jumlahHomeVisit: number;
  jumlahSelesai: number;
  totalSiswa: number;
  risikoTinggi: number;
  sedangDipantau: number;
  intervensiSelesai: number;
  intervensiBerjalan: number;
  progress: DashboardProgressItem[];
}

export interface KapanewonDashboardData {
  role: "KAPANEWON";
  kapanewon: string | null;
  pengaduanBaru: number;
  menungguVerifikasi: number;
  menungguRujukan: number;
  riwayat: number;
  totalSiswaAps: number;
  kasusBerisikoTinggi: number;
  kunjunganRumahAktif: number;
  progress: DashboardProgressItem[];
  status: DashboardStatus;
}

export interface OpdDashboardData {
  role: "OPD";
  kasusBaru: number;
  intervensiAktif: number;
  intervensiSelesai: number;
  totalSiswaAps: number;
  kasusBerisikoTinggi: number;
  intervensiBerjalan: number;
  progress: DashboardProgressItem[];
  status: DashboardStatus;
}

export interface DinasDashboardData {
  role: "DINAS_PENDIDIKAN";
  semuaCase: number;
  kasusPencegahan: number;
  kasusPenanganan: number;
  closed: number;
  monitoring: number;
  byStatus: { status: string; _count: number }[];
  totalSiswaAps: number;
  kasusBerisikoTinggi: number;
  kunjunganRumahAktif: number;
  progress: DashboardProgressItem[];
  status: DashboardStatus;
}

export type DashboardData =
  | SekolahDashboardData
  | KapanewonDashboardData
  | OpdDashboardData
  | DinasDashboardData;

// GET /dashboard/recent-cases — dipakai komponen "ReportTable" di keempat dashboard.
export interface RecentCaseItem {
  id: number;
  nomorKasus: string;
  studentName: string;
  nikMasked: string;
  wilayah: string;
  category: string;
  status: string;
  statusColor: "red" | "yellow" | "blue" | "green" | "slate";
}

// GET /dashboard/monthly-trend — dipakai komponen "DashboardChart" di keempat dashboard.
export interface MonthlyTrendItem {
  label: string;
  kasusBaru: number;
  kasusSelesai: number;
}

// GET /dashboard/top-risk-students — dipakai komponen "ReportTable" di Dashboard Sekolah.
export interface TopRiskStudent {
  studentId: number;
  name: string;
  nisn: string;
  kelas: string;
  risiko: number; // persen 0-100
  riskCategory: "RENDAH" | "SEDANG" | "TINGGI";
  factor: string;
  status: string;
}

// GET /dashboard/schools/:id/risk-trend — dipakai komponen "DashboardChart" (varian sekolah).
export interface SchoolRiskTrendItem {
  name: string;
  tinggi: number;
  sedang: number;
}

// GET /dashboard/kapanewon-heatmap — dipakai komponen "VillageHeatmap".
export interface KapanewonHeatmapItem {
  name: string;
  totalStudents: number;
  highRisk: number;
}

export interface InterventionType {
  id: number;
  kode: string;
  nama: string;
  deskripsi?: string | null;
  opdId?: number | null;
  opd?: Opd | null;
  active: boolean;
  createdAt: string;
}

export interface Regulation {
  id: number;
  nomor: string;
  judul: string;
  deskripsi?: string | null;
  fileUrl?: string | null;
  createdAt: string;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  schoolId?: number | null;
  opdId?: number | null;
  wilayahId?: number | null;
  school?: { id: number; nama: string } | null;
  opd?: { id: number; nama: string } | null;
  wilayah?: { id: number; kapanewon: string } | null;
  createdAt?: string;
}

// ---------------------------------------------------------------------
// Student & Prediction
// ---------------------------------------------------------------------

export interface Student {
  id: number;
  nisn: string;
  nik: string;
  nama: string;
  tanggalLahir?: string | null;
  jenisKelamin?: string | null;
  kelas?: string | null;
  alamat?: string | null;
  namaOrtu?: string | null;
  kontakOrtu?: string | null;
  status: StudentStatus;
  numerasi?: number | null;
  kodePendidikanAyah?: number | null;
  kodePendidikanIbu?: number | null;
  kodePenghasilanAyah?: number | null;
  kodePenghasilanIbu?: number | null;
  schoolId?: number | null;
  school?: School | null;
  // Alasan historis DO dari data sumber (Dapodik/ATS) — bukan Referral aktual.
  alasanDoRiskFactor?: RiskFactor | null;
  alasanDoKeterangan?: string | null;
  createdAt: string;
  updatedAt: string;
  // Rujukan DO langsung (origin=DO_STUDENT) terbaru, jika ada. Diisi backend saat findAll.
  referrals?: Referral[];
  // Hasil prediksi ML terbaru (jika ada, array berisi maksimal 1 item, urut terbaru
  // dulu). Diisi backend saat findAll — dipakai kolom "Prediksi" di daftar siswa.
  predictions?: Prediction[];
}

export interface Prediction {
  id: number;
  studentId: number;
  student?: Student;
  probabilitas: number;
  riskCategory: RiskCategory;
  probDo?: number | null;
  risikoDoLabel?: string | null;
  alasanRisiko: string[];
  modelDipakai?: string | null;
  source: PredictionSource;
  datasetBatch?: string | null;
  uploadedById?: number | null;
  createdAt: string;
  riskFactors?: {
    riskFactorId: number;
    weight?: number | null;
    riskFactor: RiskFactor;
  }[];
}

// ---------------------------------------------------------------------
// Case (Layer 2 — jantung sistem)
// ---------------------------------------------------------------------

export interface CaseReport {
  id: number;
  caseId: number;
  nikVerified?: boolean | null;
  nikVerifiedAt?: string | null;
  namaPelapor?: string | null;
  kontakPelapor?: string | null;
  caraPengaduan?: string | null;
  validasiIdentitas?: boolean | null;
  kondisiAwal?: string | null;
  koordinasiSekolah?: string | null;
  isiLaporan?: string | null;
  createdAt: string;
}

export interface Attachment {
  id: number;
  fileUrl: string;
  fileName?: string | null;
  mimeType?: string | null;
  uploadedAt: string;
}

export interface HomeVisit {
  id: number;
  caseId: number;
  visitNumber: number;
  tanggal: string;
  hasil: HomeVisitResult;
  catatan?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  petugasId: number;
  petugas?: { id: number; name: string; role: UserRole };
  createdAt: string;
  fotos?: Attachment[];
}

export interface Intervention {
  id: number;
  referralId: number;
  interventionTypeId: number;
  interventionType?: InterventionType;
  deskripsi: string;
  hasil?: string | null;
  tanggal: string;
  petugasId: number;
  petugas?: { id: number; name: string; role: UserRole };
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}

export interface Review {
  id: number;
  referralId: number;
  decision: ReviewDecision;
  catatan?: string | null;
  reviewedById: number;
  reviewedBy?: { id: number; name: string; role: UserRole };
  createdAt: string;
}

export interface Referral {
  id: number;
  origin: ReferralOrigin;
  caseId?: number | null;
  case?: Case | null;
  // Hanya terisi ketika origin = DO_STUDENT (rujukan langsung siswa DO oleh Admin)
  studentId?: number | null;
  student?: Student | null;
  riskFactorId?: number | null;
  riskFactor?: RiskFactor | null;
  tingkatRisiko: RiskCategory;
  opdId: number;
  opd: Opd;
  status: AssignmentStatus;
  catatan?: string | null;
  referredById: number;
  referredBy?: { id: number; name: string; role: UserRole };
  createdAt: string;
  updatedAt: string;
  interventions?: Intervention[];
  reviews?: Review[];
}

export interface Monitoring {
  id: number;
  caseId: number;
  catatan: string;
  petugasId: number;
  petugas?: { id: number; name: string; role: UserRole };
  createdAt: string;
}

export interface CaseTimelineEntry {
  id: number;
  caseId: number;
  eventType: string;
  title: string;
  description?: string | null;
  fromStatus?: CaseStatus | null;
  toStatus?: CaseStatus | null;
  actorId: number;
  actor?: { id: number; name: string; role: UserRole };
  actorRole: UserRole;
  createdAt: string;
}

export interface Case {
  id: number;
  nomorKasus: string;
  studentId: number;
  student: Student;
  source: CaseSource;
  status: CaseStatus;
  predictionId?: number | null;
  catatan?: string | null;
  createdById: number;
  createdBy?: { id: number; name: string; role: UserRole };
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  reopenedAt?: string | null;
  report?: CaseReport | null;
  homeVisits?: HomeVisit[];
  // Multi-OPD: satu Case bisa dirujuk ke beberapa OPD sekaligus (satu Referral per OPD).
  referrals?: Referral[];
  monitorings?: Monitoring[];
}

// ---------------------------------------------------------------------
// Request DTOs (must match backend class-validator DTOs field-for-field)
// ---------------------------------------------------------------------

export interface LoginPayload {
  email: string;
  password: string;
  captchaToken: string;
  captchaNonce: string;
  /** Honeypot — harus selalu kosong, lihat LoginPage.tsx */
  website?: string;
}

export interface CaptchaChallenge {
  token: string;
  challenge: string;
  difficulty: number;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    schoolId?: number | null;
    opdId?: number | null;
    wilayahId?: number | null;
  };
}

export interface CreateStudentPayload {
  nisn: string;
  nik: string;
  nama: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  kelas?: string;
  alamat?: string;
  namaOrtu?: string;
  kontakOrtu?: string;
  schoolId?: number;
  numerasi?: number;
  kodePendidikanAyah?: number;
  kodePendidikanIbu?: number;
  kodePenghasilanAyah?: number;
  kodePenghasilanIbu?: number;
}

export type UpdateStudentPayload = Partial<CreateStudentPayload> & {
  status?: StudentStatus;
};

export interface SimulatePredictionPayload {
  studentId: number;
  num?: number;
  kodePendidikanAyah?: number;
  kodePendidikanIbu?: number;
  kodePenghasilanAyah?: number;
  kodePenghasilanIbu?: number;
  sulingjarD18?: number;
  sulingjarD1?: number;
  sulingjarD2?: number;
  sulingjarD6?: number;
  riskFactorIds?: number[];
}

export interface BulkPredictionRow {
  nisn: string;
  num?: number;
  kodePendidikanAyah?: number;
  kodePendidikanIbu?: number;
  kodePenghasilanAyah?: number;
  kodePenghasilanIbu?: number;
  sulingjarD18?: number;
  sulingjarD1?: number;
  sulingjarD2?: number;
  sulingjarD6?: number;
}

export interface BulkPredictionResult {
  nisn: string;
  studentId?: number;
  success: boolean;
  predictionId?: number;
  probabilitas?: number;
  riskCategory?: string;
  modelDipakai?: string | null;
  error?: string;
}

export interface BulkPredictionResponse {
  processed: number;
  success: number;
  failed: number;
  results: BulkPredictionResult[];
}

export interface CreatePelaporanSekolahPayload {
  studentId: number;
  predictionId?: number;
  catatan?: string;
  isiLaporan?: string;
  forceNewCase?: boolean;
}

export interface CreatePengaduanMasyarakatPayload {
  studentId: number;
  namaPelapor: string;
  kontakPelapor?: string;
  caraPengaduan?: string;
  kondisiAwal?: string;
  isiLaporan?: string;
  forceNewCase?: boolean;
}

export interface ActiveCaseConflict {
  message: string;
  existingCase: { id: number; nomorKasus: string; status: CaseStatus };
}

export interface VerifikasiNikPayload {
  nikVerified: boolean;
  catatan?: string;
}

export interface VerifikasiPengaduanPayload {
  validasiIdentitas: boolean;
  koordinasiSekolah?: string;
  catatan?: string;
}

export interface CreateHomeVisitPayload {
  tanggal: string;
  hasil: HomeVisitResult;
  catatan?: string;
  latitude?: number;
  longitude?: number;
  fotoUrls: string[];
}

// Rujukan oleh Kapanewon (BR-10) — mendukung multi-OPD sekaligus dalam satu kasus.
export interface CreateReferralPayload {
  riskFactorId?: number;
  tingkatRisiko: RiskCategory;
  opdIds: number[];
  catatan?: string;
}

// Jalur ringan: rujukan langsung siswa Putus Sekolah (DO) oleh Admin, tanpa Case.
export interface CreateDoStudentReferralPayload {
  riskFactorId?: number;
  tingkatRisiko: RiskCategory;
  opdId: number;
  catatan?: string;
}

export interface CreateInterventionPayload {
  interventionTypeId: number;
  deskripsi: string;
  tanggal?: string;
}

export interface UpdateInterventionResultPayload {
  hasil: string;
  lampiranUrls?: string[];
}

export interface SubmitCompletionPayload {
  catatan?: string;
}

export interface CreateReviewPayload {
  decision: ReviewDecision;
  catatan?: string;
}

export interface CreateMonitoringPayload {
  catatan: string;
}

export interface CloseCasePayload {
  catatan?: string;
}

export interface ReopenCasePayload {
  alasan: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  schoolId?: number;
  opdId?: number;
  wilayahId?: number;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
  active?: boolean;
  password?: string;
};

export interface UploadResponse {
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
}

// ---------------------------------------------------------------------
// Labels (for UI display)
// ---------------------------------------------------------------------

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrator",
  SEKOLAH: "Sekolah",
  KAPANEWON: "Kapanewon",
  OPD: "OPD",
  DINAS_PENDIDIKAN: "Dinas Pendidikan",
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  DRAFT: "Draft",
  CASE_CREATED: "Kasus Dibuat (S01)",
  VERIFIKASI_NIK: "Verifikasi NIK (S02)",
  HOME_VISIT: "Home Visit (S03)",
  SELESAI_PENCEGAHAN: "Selesai Pencegahan (S04)",
  MENUNGGU_RUJUKAN: "Menunggu Rujukan (S05)",
  DIRUJUK_OPD: "Dirujuk ke OPD (S06)",
  INTERVENSI_BERJALAN: "Intervensi Berjalan (S07)",
  VERIFIKASI_PENYELESAIAN: "Verifikasi Penyelesaian (S08)",
  MONITORING: "Monitoring (S09)",
  CLOSED_CASE: "Closed Case (S10)",
};

export const CASE_SOURCE_LABEL: Record<CaseSource, string> = {
  PELAPORAN_SEKOLAH: "Pelaporan Sekolah",
  PENGADUAN_MASYARAKAT: "Pengaduan Masyarakat",
};

export const RISK_LABEL: Record<RiskCategory, string> = {
  RENDAH: "Rendah",
  SEDANG: "Sedang",
  TINGGI: "Tinggi",
};

export const HOME_VISIT_RESULT_LABEL: Record<HomeVisitResult, string> = {
  BELUM_SELESAI: "Belum Selesai / Akan Visit Lagi",
  KEMBALI_SEKOLAH: "Kembali Sekolah",
  TIDAK_KEMBALI: "Tidak Kembali",
};

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  MENUNGGU: "Menunggu",
  DITERIMA: "Diterima",
  INTERVENSI_BERJALAN: "Intervensi Berjalan",
  SELESAI_DIAJUKAN: "Selesai Diajukan",
  SELESAI_DISETUJUI: "Selesai Disetujui",
  PERLU_PERBAIKAN: "Perlu Perbaikan",
};

export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  AKTIF: "Aktif",
  PUTUS_SEKOLAH: "Putus Sekolah",
  KEMBALI_SEKOLAH: "Kembali Sekolah",
  LULUS: "Lulus",
  PINDAH: "Pindah",
};