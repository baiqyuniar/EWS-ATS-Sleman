-- Lockdown policy login: percobaan gagal & waktu kunci akun dilacak per user
-- (lihat AuthService.login()), tambahan atas rate-limit per-IP yang sudah ada.
ALTER TABLE "users"
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- Enkripsi NIK (UU PDP No. 27/2022): kolom "nik" mulai saat ini menyimpan
-- ciphertext (AES-256-GCM), bukan plaintext lagi — lihat src/common/crypto.util.ts.
-- Constraint UNIQUE lama di kolom "nik" (plaintext) dilepas karena ciphertext acak
-- per baris tidak bisa dipakai untuk uniqueness. Sebagai gantinya, kolom baru
-- "nikHash" (blind index / HMAC-SHA256 deterministik dari NIK asli) yang di-UNIQUE-kan.
--
-- PENTING — langkah wajib setelah migrasi ini, SEBELUM aplikasi baru di-deploy ke
-- data production yang sudah ada: jalankan `ts-node prisma/scripts/encrypt-existing-nik.ts`
-- untuk mengenkripsi NIK yang masih plaintext di baris lama + mengisi nikHash-nya.
-- Baris baru yang dibuat lewat aplikasi (StudentsService) otomatis terenkripsi.
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_nik_key";
ALTER TABLE "students" ADD COLUMN "nikHash" TEXT;
CREATE UNIQUE INDEX "students_nikHash_key" ON "students"("nikHash");
