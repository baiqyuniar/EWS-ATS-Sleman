import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * CAPTCHA berbasis Proof-of-Work (PoW) untuk halaman login — pengganti captcha
 * soal matematika sebelumnya, yang gampang dijebol karena soalnya teks polos
 * yang bisa langsung di-parse & dihitung skrip (tanpa OCR/AI vision sama sekali).
 *
 * Cara kerja: server memberi `challenge` (string acak) + `difficulty` (jumlah
 * digit heksadesimal nol di depan yang wajib dipenuhi). Browser harus MENCARI
 * sebuah `nonce` sedemikian sehingga SHA-256(challenge + nonce) diawali
 * `difficulty` digit nol — ini butuh brute-force ribuan-jutaan percobaan hash
 * (lihat `pow.worker` di frontend). Untuk SATU login manusia biaya ini sepersekian
 * detik (tidak terasa), tapi untuk bot yang mencoba ribuan/jutaan login sekaligus,
 * biaya komputasinya bertambah linear — beda dengan captcha soal matematika yang
 * biayanya nol (tinggal hitung sekali, bisa dipakai berkali-kali oleh skrip).
 *
 * Tetap 100% self-hosted (tanpa API key/layanan pihak ketiga seperti reCAPTCHA/
 * hCaptcha/Turnstile) — sesuai keputusan sebelumnya, supaya tidak bergantung pada
 * akun/kredensial eksternal yang belum tentu tersedia di semua environment deploy,
 * dan tidak ada data sesi login (IP, user-agent) yang terkirim ke pihak ketiga.
 *
 * Stateless: challenge & difficulty ditandatangani (HMAC-SHA256) dan dikirim balik
 * ke client sebagai token, jadi backend tidak perlu simpan sesi captcha di
 * memori/Redis — server tinggal re-verifikasi signature + hitung ulang hash-nya
 * saat client mengirim nonce hasil solve.
 */
const TTL_MS = 5 * 60 * 1000; // challenge berlaku 5 menit untuk diselesaikan

export interface CaptchaChallenge {
  token: string;
  challenge: string;
  difficulty: number;
}

@Injectable()
export class CaptchaService {
  constructor(private config: ConfigService) {}

  private getSecret(): string {
    // Boleh pakai secret sendiri (CAPTCHA_SECRET) atau reuse JWT_SECRET kalau tidak diset.
    return (
      this.config.get<string>('CAPTCHA_SECRET') || this.config.get<string>('JWT_SECRET') || 'insecure-fallback'
    );
  }

  private get difficulty(): number {
    // Jumlah digit hex nol di depan hash yang wajib dipenuhi. Setiap +1 digit
    // melipatgandakan rata-rata jumlah percobaan yang dibutuhkan (~16x lebih berat).
    // Default 4 (~33 ribu percobaan rata-rata, terukur ~1 detik di browser modern
    // lewat Web Worker + Web Crypto async) — cukup berat buat bot yang mencoba
    // ribuan login sekaligus, tapi tetap terasa instan buat satu pengguna manusia.
    // Bisa dituning lewat env tanpa redeploy frontend karena nilainya dikirim
    // server ke client di setiap challenge baru.
    const fromEnv = Number(this.config.get<string>('POW_CAPTCHA_DIFFICULTY'));
    return Number.isFinite(fromEnv) && fromEnv > 0 ? Math.floor(fromEnv) : 4;
  }

  generate(): CaptchaChallenge {
    const challenge = randomBytes(16).toString('hex');
    const difficulty = this.difficulty;
    const expiresAt = Date.now() + TTL_MS;
    const payload = `${challenge}.${difficulty}.${expiresAt}`;
    const signature = createHmac('sha256', this.getSecret()).update(payload).digest('hex');
    const token = Buffer.from(`${payload}.${signature}`).toString('base64url');
    return { token, challenge, difficulty };
  }

  verify(token: string | undefined, nonce: string | undefined): boolean {
    if (!token || !nonce) return false;
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split('.');
      if (parts.length !== 4) return false;
      const [challenge, difficultyStr, expiresAtStr, signature] = parts;
      const payload = `${challenge}.${difficultyStr}.${expiresAtStr}`;
      const expected = createHmac('sha256', this.getSecret()).update(payload).digest('hex');

      // Bandingkan signature pakai timing-safe agar tidak bocorkan info lewat timing side-channel.
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length) return false;
      if (!timingSafeEqual(sigBuf, expBuf)) return false;

      if (Date.now() > Number(expiresAtStr)) return false;

      // Verifikasi PoW: hitung ulang hash di server, cocokkan jumlah digit nol
      // di depan sesuai difficulty yang tertanam (bukan dari input client) —
      // supaya client tidak bisa curang mengklaim difficulty lebih rendah.
      const difficulty = Number(difficultyStr);
      const hash = createHash('sha256').update(`${challenge}${nonce}`).digest('hex');
      return hash.startsWith('0'.repeat(difficulty));
    } catch {
      return false;
    }
  }
}
