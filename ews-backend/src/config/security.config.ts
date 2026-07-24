import { ConfigService } from '@nestjs/config';

/**
 * SECURITY: sebelumnya JWT_SECRET punya fallback hardcoded `'dev-secret'` di dua
 * tempat (jwt.strategy.ts & auth.module.ts). Jika env var lupa di-set saat deploy
 * (kesalahan konfigurasi yang sangat umum), aplikasi tetap jalan diam-diam memakai
 * secret yang sudah publik/predictable — siapa pun bisa memalsukan token JWT
 * (termasuk role ADMIN) dan membobol seluruh sistem. Sekarang aplikasi menolak
 * untuk start sama sekali jika JWT_SECRET tidak diset atau terlalu lemah, supaya
 * kesalahan ini ketahuan saat deploy (fail fast), bukan saat sudah di-pentest.
 */
export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  const isProd = config.get<string>('NODE_ENV') === 'production';

  if (!secret) {
    throw new Error(
      'JWT_SECRET belum diset. Set environment variable JWT_SECRET (string acak, minimal 32 karakter) ' +
        'sebelum menjalankan aplikasi. Contoh generate: `openssl rand -base64 48`.',
    );
  }
  if (secret === 'dev-secret' || secret === 'change-this-to-a-long-random-secret-in-production') {
    throw new Error(
      'JWT_SECRET masih memakai nilai placeholder/contoh. Ganti dengan string acak unik ' +
        'sebelum deploy. Contoh generate: `openssl rand -base64 48`.',
    );
  }
  if (secret.length < 32) {
    if (isProd) {
      throw new Error('JWT_SECRET terlalu pendek (minimal 32 karakter) untuk environment production.');
    }
    // eslint-disable-next-line no-console
    console.warn(
      '[SECURITY WARNING] JWT_SECRET kurang dari 32 karakter. Ini masih diizinkan di ' +
        'development, tapi WAJIB diperpanjang sebelum deploy ke production.',
    );
  }
  return secret;
}
