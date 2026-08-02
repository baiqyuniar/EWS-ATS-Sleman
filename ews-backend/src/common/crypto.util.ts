import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

/**
 * Utilitas enkripsi untuk data pribadi sensitif (mis. NIK siswa), sesuai UU No.
 * 27/2022 (PDP). NIK disimpan di database dalam bentuk terenkripsi (AES-256-GCM,
 * IV acak per baris) — bukan plaintext — sehingga kalau database/backup bocor,
 * NIK tidak langsung terbaca.
 *
 * Karena AES-GCM dengan IV acak menghasilkan ciphertext berbeda setiap kali
 * (walau plaintext sama), ciphertext TIDAK BISA dipakai langsung untuk cek
 * duplikat/pencarian exact-match di level database. Untuk itu, setiap NIK juga
 * disertai `blind index` (HMAC-SHA256 deterministik terhadap NIK asli, key
 * terpisah dari key enkripsi) yang disimpan di kolom `nikHash` — dipakai untuk
 * constraint UNIQUE dan pencarian, tanpa membocorkan nilai NIK asli dari hash
 * itu sendiri (HMAC bukan reversible).
 *
 * ENCRYPTION_KEY: string base64, harus di-decode menjadi tepat 32 byte (AES-256).
 * Generate: `openssl rand -base64 32`.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM
const VERSION_PREFIX = 'v1';

function getKeyBuffer(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'ENCRYPTION_KEY belum diset. Set environment variable ENCRYPTION_KEY (base64, hasil decode ' +
        'harus 32 byte) sebelum menjalankan aplikasi. Contoh generate: `openssl rand -base64 32`.',
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY tidak valid: hasil decode base64 harus tepat 32 byte (didapat ${key.length} byte). ` +
        'Generate ulang dengan: `openssl rand -base64 32`.',
    );
  }
  return key;
}

/** Encrypt a plaintext string. Output format: `v1:<iv>:<authTag>:<ciphertext>` (semua base64). */
export function encryptSensitive(plain: string): string {
  const key = getKeyBuffer();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION_PREFIX, iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':');
}

/** Decrypt a value produced by encryptSensitive(). Returns null if the value is empty/undefined. */
export function decryptSensitive(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION_PREFIX) {
    // Data lama yang belum terenkripsi (mis. sebelum migrasi backfill dijalankan) —
    // kembalikan apa adanya alih-alih melempar error, supaya tidak merusak UI saat
    // migrasi bertahap. Lihat prisma/scripts/encrypt-existing-nik.ts.
    return payload;
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const key = getKeyBuffer();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Deterministic HMAC-SHA256 blind index — dipakai untuk UNIQUE constraint & pencarian exact-match. */
export function blindIndex(plain: string): string {
  const key = getKeyBuffer();
  // Derive a distinct sub-key for HMAC so it's not literally the same key as AES-GCM.
  const hmacKey = createHmac('sha256', key).update('blind-index').digest();
  return createHmac('sha256', hmacKey).update(plain.trim()).digest('hex');
}
