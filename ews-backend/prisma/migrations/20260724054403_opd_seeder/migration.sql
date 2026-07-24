/*
  Warnings:

  - A unique constraint covering the columns `[caseId,opdId]` on the table `referrals` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "referrals_caseId_key";

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "agamaId" INTEGER,
ADD COLUMN     "alamatJalan" TEXT,
ADD COLUMN     "alatTransportasiId" INTEGER,
ADD COLUMN     "anakKeberapa" INTEGER,
ADD COLUMN     "desaKelurahan" TEXT,
ADD COLUMN     "jenisTinggalId" INTEGER,
ADD COLUMN     "kabupaten" TEXT,
ADD COLUMN     "kebutuhanKhususAyahId" INTEGER,
ADD COLUMN     "kebutuhanKhususIbuId" INTEGER,
ADD COLUMN     "kebutuhanKhususId" INTEGER,
ADD COLUMN     "kebutuhanKhususKeterangan" TEXT,
ADD COLUMN     "kecamatan" TEXT,
ADD COLUMN     "layakPip" BOOLEAN,
ADD COLUMN     "namaAyah" TEXT,
ADD COLUMN     "namaDusun" TEXT,
ADD COLUMN     "namaIbu" TEXT,
ADD COLUMN     "namaKip" TEXT,
ADD COLUMN     "nikAyah" TEXT,
ADD COLUMN     "nikIbu" TEXT,
ADD COLUMN     "noKip" TEXT,
ADD COLUMN     "noKks" TEXT,
ADD COLUMN     "noKps" TEXT,
ADD COLUMN     "pekerjaanAyahId" INTEGER,
ADD COLUMN     "pekerjaanIbuId" INTEGER,
ADD COLUMN     "pendidikanAyahId" INTEGER,
ADD COLUMN     "pendidikanIbuId" INTEGER,
ADD COLUMN     "penerimaKip" BOOLEAN,
ADD COLUMN     "penerimaKps" BOOLEAN,
ADD COLUMN     "penghasilanAyahId" INTEGER,
ADD COLUMN     "penghasilanIbuId" INTEGER,
ADD COLUMN     "provinsi" TEXT,
ADD COLUMN     "regAktaLahir" TEXT,
ADD COLUMN     "rt" TEXT,
ADD COLUMN     "rw" TEXT,
ADD COLUMN     "tahunLahirAyah" INTEGER,
ADD COLUMN     "tahunLahirIbu" INTEGER,
ADD COLUMN     "tempatLahir" TEXT;

-- CreateTable
CREATE TABLE "agama" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kebutuhan_khusus" (
    "id" SERIAL NOT NULL,
    "kode" TEXT,
    "nama" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kebutuhan_khusus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_tinggal" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jenis_tinggal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alat_transportasi" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alat_transportasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pekerjaan_ortu" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pekerjaan_ortu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendidikan_ortu" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "kodeOrdinal" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pendidikan_ortu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penghasilan_ortu" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "kodeOrdinal" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penghasilan_ortu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agama_nama_key" ON "agama"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "kebutuhan_khusus_nama_key" ON "kebutuhan_khusus"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_tinggal_nama_key" ON "jenis_tinggal"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "alat_transportasi_nama_key" ON "alat_transportasi"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "pekerjaan_ortu_nama_key" ON "pekerjaan_ortu"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "pendidikan_ortu_nama_key" ON "pendidikan_ortu"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "penghasilan_ortu_nama_key" ON "penghasilan_ortu"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_caseId_opdId_key" ON "referrals"("caseId", "opdId");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_agamaId_fkey" FOREIGN KEY ("agamaId") REFERENCES "agama"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_kebutuhanKhususId_fkey" FOREIGN KEY ("kebutuhanKhususId") REFERENCES "kebutuhan_khusus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_jenisTinggalId_fkey" FOREIGN KEY ("jenisTinggalId") REFERENCES "jenis_tinggal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_alatTransportasiId_fkey" FOREIGN KEY ("alatTransportasiId") REFERENCES "alat_transportasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_pendidikanAyahId_fkey" FOREIGN KEY ("pendidikanAyahId") REFERENCES "pendidikan_ortu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_pekerjaanAyahId_fkey" FOREIGN KEY ("pekerjaanAyahId") REFERENCES "pekerjaan_ortu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_penghasilanAyahId_fkey" FOREIGN KEY ("penghasilanAyahId") REFERENCES "penghasilan_ortu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_kebutuhanKhususAyahId_fkey" FOREIGN KEY ("kebutuhanKhususAyahId") REFERENCES "kebutuhan_khusus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_pendidikanIbuId_fkey" FOREIGN KEY ("pendidikanIbuId") REFERENCES "pendidikan_ortu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_pekerjaanIbuId_fkey" FOREIGN KEY ("pekerjaanIbuId") REFERENCES "pekerjaan_ortu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_penghasilanIbuId_fkey" FOREIGN KEY ("penghasilanIbuId") REFERENCES "penghasilan_ortu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_kebutuhanKhususIbuId_fkey" FOREIGN KEY ("kebutuhanKhususIbuId") REFERENCES "kebutuhan_khusus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
