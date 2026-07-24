-- Riwayat alasan DO siswa dari data sumber (Dapodik/ATS), terpisah dari Referral aktual.

ALTER TABLE "students" ADD COLUMN "alasanDoRiskFactorId" INTEGER;
ALTER TABLE "students" ADD COLUMN "alasanDoKeterangan" TEXT;

ALTER TABLE "students"
  ADD CONSTRAINT "students_alasanDoRiskFactorId_fkey"
  FOREIGN KEY ("alasanDoRiskFactorId") REFERENCES "risk_factors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
