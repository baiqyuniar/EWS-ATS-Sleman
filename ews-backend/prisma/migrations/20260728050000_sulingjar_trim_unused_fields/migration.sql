-- Hanya 4 indikator sulingjar yang dipakai model ML final (aspd_num + tanpa_aspd
-- gabungan, lihat ews-ml-service/models/*_spec.json): D.18, D.1, D.2, D.6.
-- Kolom lain di bawah ini tidak pernah dipakai oleh model manapun, jadi dihapus
-- supaya BE, FE, dan ML service konsisten dengan parameter yang benar-benar
-- dipakai model.

-- AlterTable
ALTER TABLE "schools"
  DROP COLUMN "sulingjarKepemimpinanKepsek",
  DROP COLUMN "sulingjarIklimKeamanan",
  DROP COLUMN "sulingjarIklimKebinekaan",
  DROP COLUMN "sulingjarIklimInklusivitas",
  DROP COLUMN "sulingjarPartisipasiWarga",
  DROP COLUMN "sulingjarProgramSatuanPendidikan";
