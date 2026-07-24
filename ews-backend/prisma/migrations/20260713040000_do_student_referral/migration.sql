-- Penyesuaian: rujukan siswa Putus Sekolah (DO) langsung oleh Admin, tanpa melalui Case.

-- 1. Enum baru: asal Referral
CREATE TYPE "ReferralOrigin" AS ENUM ('CASE', 'DO_STUDENT');

-- 2. Referral.caseId menjadi opsional (drop NOT NULL constraint)
ALTER TABLE "referrals" ALTER COLUMN "caseId" DROP NOT NULL;

-- 3. Kolom baru pada Referral: origin & studentId
ALTER TABLE "referrals" ADD COLUMN "origin" "ReferralOrigin" NOT NULL DEFAULT 'CASE';
ALTER TABLE "referrals" ADD COLUMN "studentId" INTEGER;

-- 4. Foreign key studentId -> students(id)
ALTER TABLE "referrals"
  ADD CONSTRAINT "referrals_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
