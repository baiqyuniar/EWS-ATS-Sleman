/**
 * Backfill satu kali: enkripsi NIK siswa yang masih plaintext (data lama, sebelum
 * migrasi `20260801060000_login_lockdown_nik_encryption`) + isi kolom `nikHash`.
 *
 * Aman dijalankan berulang kali (idempotent) — baris yang NIK-nya sudah dalam
 * format terenkripsi (prefix "v1:") dilewati.
 *
 * Jalankan SETELAH `npx prisma migrate deploy` (kolom nikHash sudah ada) dan
 * SETELAH ENCRYPTION_KEY diset di .env:
 *
 *   cd ews-backend
 *   npx ts-node prisma/scripts/encrypt-existing-nik.ts
 */
import { PrismaClient } from '@prisma/client';
import { encryptSensitive, blindIndex } from '../../src/common/crypto.util';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({ select: { id: true, nik: true, nikHash: true } });
  let migrated = 0;
  let skipped = 0;

  for (const s of students) {
    if (!s.nik) {
      skipped++;
      continue;
    }
    if (s.nik.startsWith('v1:') && s.nikHash) {
      // Sudah terenkripsi & sudah punya blind index.
      skipped++;
      continue;
    }

    const plainNik = s.nik.startsWith('v1:') ? s.nik : s.nik; // masih plaintext di sini
    const hash = blindIndex(plainNik);
    const encrypted = s.nik.startsWith('v1:') ? s.nik : encryptSensitive(plainNik);

    await prisma.student.update({
      where: { id: s.id },
      data: { nik: encrypted, nikHash: hash },
    });
    migrated++;
  }

  console.log(`Selesai. ${migrated} baris di-enkripsi/di-isi nikHash, ${skipped} dilewati (sudah terenkripsi/kosong).`);
}

main()
  .catch((err) => {
    console.error('Backfill gagal:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
