import PowWorker from "../workers/pow.worker?worker";

/**
 * Menyelesaikan captcha Proof-of-Work di background (Web Worker) tanpa nge-freeze
 * halaman. Lihat backend `src/auth/captcha.service.ts` untuk detail skema.
 *
 * Butuh browser modern dengan dukungan Web Worker + Web Crypto API (`crypto.subtle`)
 * dalam secure context (HTTPS atau localhost) — sudah didukung semua browser
 * evergreen sejak lama, tapi TIDAK jalan kalau situs diakses lewat HTTP polos
 * (bukan localhost) karena browser memblokir `crypto.subtle` di halaman non-HTTPS.
 */
export function solveCaptcha(
  challenge: string,
  difficulty: number,
  onProgress?: (attempts: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined" || !window.crypto?.subtle) {
      reject(
        new Error(
          "Browser ini tidak mendukung verifikasi keamanan (Web Worker/Web Crypto). " +
            "Pastikan situs diakses lewat HTTPS dan browser sudah versi terbaru.",
        ),
      );
      return;
    }

    const worker = new PowWorker();
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Verifikasi keamanan memakan waktu terlalu lama. Coba muat ulang halaman."));
    }, 30_000);

    worker.onmessage = (e: MessageEvent<{ nonce?: string; progress?: number; error?: string }>) => {
      if (e.data.nonce !== undefined) {
        clearTimeout(timeout);
        worker.terminate();
        resolve(e.data.nonce);
      } else if (e.data.error) {
        clearTimeout(timeout);
        worker.terminate();
        reject(new Error(e.data.error));
      } else if (e.data.progress !== undefined) {
        onProgress?.(e.data.progress);
      }
    };
    worker.onerror = (err) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(err);
    };
    worker.postMessage({ challenge, difficulty });
  });
}
