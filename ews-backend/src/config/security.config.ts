// import { ConfigService } from '@nestjs/config';

// /**
//  * SECURITY: sebelumnya JWT_SECRET punya fallback hardcoded `'dev-secret'` di dua
//  * tempat (jwt.strategy.ts & auth.module.ts). Jika env var lupa di-set saat deploy
//  * (kesalahan konfigurasi yang sangat umum), aplikasi tetap jalan diam-diam memakai
//  * secret yang sudah publik/predictable — siapa pun bisa memalsukan token JWT
//  * (termasuk role ADMIN) dan membobol seluruh sistem. Sekarang aplikasi menolak
//  * untuk start sama sekali jika JWT_SECRET tidak diset atau terlalu lemah, supaya
//  * kesalahan ini ketahuan saat deploy (fail fast), bukan saat sudah di-pentest.
//  */
// export function getJwtSecret(config: ConfigService): string {
//   const secret = config.get<string>('JWT_SECRET');
//   const isProd = config.get<string>('NODE_ENV') === 'production';

//   if (!secret) {
//     throw new Error(
//       'JWT_SECRET belum diset. Set environment variable JWT_SECRET (string acak, minimal 32 karakter) ' +
//         'sebelum menjalankan aplikasi. Contoh generate: `openssl rand -base64 48`.',
//     );
//   }
//   if (secret === 'dev-secret' || secret === 'change-this-to-a-long-random-secret-in-production') {
//     throw new Error(
//       'JWT_SECRET masih memakai nilai placeholder/contoh. Ganti dengan string acak unik ' +
//         'sebelum deploy. Contoh generate: `openssl rand -base64 48`.',
//     );
//   }
//   if (secret.length < 32) {
//     if (isProd) {
//       throw new Error('JWT_SECRET terlalu pendek (minimal 32 karakter) untuk environment production.');
//     }
//     // eslint-disable-next-line no-console
//     console.warn(
//       '[SECURITY WARNING] JWT_SECRET kurang dari 32 karakter. Ini masih diizinkan di ' +
//         'development, tapi WAJIB diperpanjang sebelum deploy ke production.',
//     );
//   }
//   return secret;
// }

// /**
//  * SECURITY: NIK siswa (data pribadi anak, UU PDP No. 27/2022) disimpan terenkripsi
//  * (AES-256-GCM) di database — lihat src/common/crypto.util.ts. Sama seperti
//  * JWT_SECRET, aplikasi menolak start jika ENCRYPTION_KEY tidak diset/tidak valid,
//  * supaya kesalahan konfigurasi ketahuan saat deploy, bukan saat data sudah bocor.
//  */
// export function assertEncryptionKeyConfigured(config: ConfigService): void {
//   const raw = config.get<string>('ENCRYPTION_KEY');
//   const isProd = config.get<string>('NODE_ENV') === 'production';

//   if (!raw) {
//     throw new Error(
//       'ENCRYPTION_KEY belum diset. Set environment variable ENCRYPTION_KEY (base64, 32 byte) ' +
//         'sebelum menjalankan aplikasi. Contoh generate: `openssl rand -base64 32`.',
//     );
//   }
//   const decodedLength = Buffer.from(raw, 'base64').length;
//   if (decodedLength !== 32) {
//     const message = `ENCRYPTION_KEY tidak valid: hasil decode base64 harus tepat 32 byte (didapat ${decodedLength} byte).`;
//     if (isProd) throw new Error(message);
//     console.warn(`[SECURITY WARNING] ${message} Generate ulang dengan: \`openssl rand -base64 32\`.`);
//   }
// }

import { ConfigService } from '@nestjs/config';

/**
 * SECURITY: JWT sekarang dikirim lewat cookie httpOnly, bukan disimpan di
 * localStorage oleh frontend. Cookie httpOnly tidak bisa dibaca oleh
 * JavaScript sama sekali, jadi walau ada celah XSS di frontend, token tidak
 * bisa dicuri lewat script. `secure: true` memastikan cookie hanya terkirim
 * lewat HTTPS, dan `sameSite` membatasi pengiriman cookie lintas situs
 * (mitigasi CSRF dasar).
 */
export const ACCESS_TOKEN_COOKIE = 'access_token';

export function getAccessTokenCookieOptions(config: ConfigService) {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  const sameSite = (config.get<string>('COOKIE_SAMESITE') as 'strict' | 'lax' | 'none') || 'lax';

  return {
    httpOnly: true,
    secure: isProd, // WAJIB true di production (butuh HTTPS)
    sameSite,
    // Samakan dengan expiry JWT (default JwtModule di auth.module.ts, biasanya '1d').
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  };
}

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

/**
 * SECURITY: NIK siswa (data pribadi anak, UU PDP No. 27/2022) disimpan terenkripsi
 * (AES-256-GCM) di database — lihat src/common/crypto.util.ts. Sama seperti
 * JWT_SECRET, aplikasi menolak start jika ENCRYPTION_KEY tidak diset/tidak valid,
 * supaya kesalahan konfigurasi ketahuan saat deploy, bukan saat data sudah bocor.
 */
export function assertEncryptionKeyConfigured(config: ConfigService): void {
  const raw = config.get<string>('ENCRYPTION_KEY');
  const isProd = config.get<string>('NODE_ENV') === 'production';

  if (!raw) {
    throw new Error(
      'ENCRYPTION_KEY belum diset. Set environment variable ENCRYPTION_KEY (base64, 32 byte) ' +
        'sebelum menjalankan aplikasi. Contoh generate: `openssl rand -base64 32`.',
    );
  }
  const decodedLength = Buffer.from(raw, 'base64').length;
  if (decodedLength !== 32) {
    const message = `ENCRYPTION_KEY tidak valid: hasil decode base64 harus tepat 32 byte (didapat ${decodedLength} byte).`;
    if (isProd) throw new Error(message);
    console.warn(`[SECURITY WARNING] ${message} Generate ulang dengan: \`openssl rand -base64 32\`.`);
  }
}