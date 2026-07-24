-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SEKOLAH', 'KAPANEWON', 'OPD', 'DINAS_PENDIDIKAN');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('RENDAH', 'SEDANG', 'TINGGI');

-- CreateEnum
CREATE TYPE "CaseSource" AS ENUM ('PELAPORAN_SEKOLAH', 'PENGADUAN_MASYARAKAT');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'CASE_CREATED', 'VERIFIKASI_NIK', 'HOME_VISIT', 'SELESAI_PENCEGAHAN', 'MENUNGGU_RUJUKAN', 'DIRUJUK_OPD', 'INTERVENSI_BERJALAN', 'VERIFIKASI_PENYELESAIAN', 'MONITORING', 'CLOSED_CASE');

-- CreateEnum
CREATE TYPE "HomeVisitResult" AS ENUM ('BELUM_SELESAI', 'KEMBALI_SEKOLAH', 'TIDAK_KEMBALI');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('MENUNGGU', 'DITERIMA', 'INTERVENSI_BERJALAN', 'SELESAI_DIAJUKAN', 'SELESAI_DISETUJUI', 'PERLU_PERBAIKAN');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVE', 'PERLU_PERBAIKAN');

-- CreateEnum
CREATE TYPE "PredictionSource" AS ENUM ('ML_BATCH', 'MANUAL');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('AKTIF', 'PUTUS_SEKOLAH', 'KEMBALI_SEKOLAH', 'LULUS', 'PINDAH');

-- CreateEnum
CREATE TYPE "AttachmentOwnerType" AS ENUM ('CASE', 'HOME_VISIT', 'INTERVENTION', 'REGULATION', 'CASE_REPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" INTEGER,
    "opdId" INTEGER,
    "wilayahId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wilayah" (
    "id" SERIAL NOT NULL,
    "kapanewon" TEXT NOT NULL,
    "kalurahan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wilayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "npsn" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenjang" TEXT NOT NULL,
    "alamat" TEXT,
    "kapanewon" TEXT,
    "kalurahan" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sulingjarKesiapsiagaanBencana" INTEGER,
    "sulingjarKualitasPembelajaran" INTEGER,
    "sulingjarRefleksiGuru" INTEGER,
    "sulingjarKepemimpinanKepsek" INTEGER,
    "sulingjarIklimKeamanan" INTEGER,
    "sulingjarIklimKesetaraanGender" INTEGER,
    "sulingjarIklimKebinekaan" INTEGER,
    "sulingjarIklimInklusivitas" INTEGER,
    "sulingjarPartisipasiWarga" INTEGER,
    "sulingjarProgramSatuanPendidikan" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opd" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jenisLayanan" TEXT,
    "alamat" TEXT,
    "kontak" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_factors" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "deskripsi" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intervention_types" (
    "id" SERIAL NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "opdId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intervention_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulations" (
    "id" SERIAL NOT NULL,
    "nomor" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "nisn" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3),
    "jenisKelamin" TEXT,
    "kelas" TEXT,
    "alamat" TEXT,
    "namaOrtu" TEXT,
    "kontakOrtu" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'AKTIF',
    "numerasi" DOUBLE PRECISION,
    "kodePendidikanAyah" INTEGER,
    "kodePendidikanIbu" INTEGER,
    "kodePenghasilanAyah" INTEGER,
    "kodePenghasilanIbu" INTEGER,
    "schoolId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "probabilitas" DOUBLE PRECISION NOT NULL,
    "riskCategory" "RiskCategory" NOT NULL,
    "probDo" DOUBLE PRECISION,
    "risikoDoLabel" TEXT,
    "alasanRisiko" TEXT[],
    "modelDipakai" TEXT,
    "source" "PredictionSource" NOT NULL DEFAULT 'ML_BATCH',
    "datasetBatch" TEXT,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_risk_factors" (
    "id" SERIAL NOT NULL,
    "predictionId" INTEGER NOT NULL,
    "riskFactorId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,

    CONSTRAINT "prediction_risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" SERIAL NOT NULL,
    "nomorKasus" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "source" "CaseSource" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'CASE_CREATED',
    "predictionId" INTEGER,
    "catatan" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_reports" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "nikVerified" BOOLEAN,
    "nikVerifiedAt" TIMESTAMP(3),
    "namaPelapor" TEXT,
    "kontakPelapor" TEXT,
    "caraPengaduan" TEXT,
    "validasiIdentitas" BOOLEAN,
    "kondisiAwal" TEXT,
    "koordinasiSekolah" TEXT,
    "isiLaporan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_visits" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "visitNumber" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "hasil" "HomeVisitResult" NOT NULL,
    "catatan" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "petugasId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "riskFactorId" INTEGER,
    "tingkatRisiko" "RiskCategory" NOT NULL,
    "opdId" INTEGER NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'MENUNGGU',
    "catatan" TEXT,
    "referredById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" SERIAL NOT NULL,
    "referralId" INTEGER NOT NULL,
    "interventionTypeId" INTEGER NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "hasil" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "petugasId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "referralId" INTEGER NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "catatan" TEXT,
    "reviewedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitorings" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "catatan" TEXT NOT NULL,
    "petugasId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitorings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_timeline" (
    "id" SERIAL NOT NULL,
    "caseId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fromStatus" "CaseStatus",
    "toStatus" "CaseStatus",
    "actorId" INTEGER NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "ownerType" "AttachmentOwnerType" NOT NULL,
    "caseId" INTEGER,
    "homeVisitId" INTEGER,
    "interventionId" INTEGER,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "schools_npsn_key" ON "schools"("npsn");

-- CreateIndex
CREATE UNIQUE INDEX "opd_kode_key" ON "opd"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "risk_factors_kode_key" ON "risk_factors"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "intervention_types_kode_key" ON "intervention_types"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "students_nisn_key" ON "students"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "students_nik_key" ON "students"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_risk_factors_predictionId_riskFactorId_key" ON "prediction_risk_factors"("predictionId", "riskFactorId");

-- CreateIndex
CREATE UNIQUE INDEX "cases_nomorKasus_key" ON "cases"("nomorKasus");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_studentId_idx" ON "cases"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "case_reports_caseId_key" ON "case_reports"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "home_visits_caseId_visitNumber_key" ON "home_visits"("caseId", "visitNumber");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_caseId_key" ON "referrals"("caseId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_wilayahId_fkey" FOREIGN KEY ("wilayahId") REFERENCES "wilayah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_types" ADD CONSTRAINT "intervention_types_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_risk_factors" ADD CONSTRAINT "prediction_risk_factors_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_risk_factors" ADD CONSTRAINT "prediction_risk_factors_riskFactorId_fkey" FOREIGN KEY ("riskFactorId") REFERENCES "risk_factors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_reports" ADD CONSTRAINT "case_reports_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_visits" ADD CONSTRAINT "home_visits_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_visits" ADD CONSTRAINT "home_visits_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_riskFactorId_fkey" FOREIGN KEY ("riskFactorId") REFERENCES "risk_factors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "opd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_interventionTypeId_fkey" FOREIGN KEY ("interventionTypeId") REFERENCES "intervention_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorings" ADD CONSTRAINT "monitorings_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitorings" ADD CONSTRAINT "monitorings_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_timeline" ADD CONSTRAINT "case_timeline_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_timeline" ADD CONSTRAINT "case_timeline_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_homeVisitId_fkey" FOREIGN KEY ("homeVisitId") REFERENCES "home_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
