/// <reference lib="webworker" />

// Proof-of-Work captcha solver — jalan di Web Worker (thread terpisah dari UI)
// supaya mencari nonce yang valid (bisa ratusan ribu percobaan hash SHA-256)
// tidak nge-freeze halaman login. Lihat backend: src/auth/captcha.service.ts
// untuk penjelasan lengkap kenapa PoW dipilih dibanding captcha soal matematika.

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

self.onmessage = async (
  e: MessageEvent<{ challenge: string; difficulty: number }>,
) => {
  const { challenge, difficulty } = e.data;
  const prefix = "0".repeat(difficulty);
  let nonce = 0;

  // Dibatasi supaya kalau ada bug/difficulty kesalahan konfigurasi (kepenuhan
  // tinggi), worker tidak jalan selamanya — muncul error yang jelas ke pemakai
  // alih-alih diam membeku. 20 juta percobaan jauh di atas kebutuhan wajar
  // (difficulty 6 rata-rata ~16 juta percobaan).
  const MAX_ATTEMPTS = 20_000_000;

  while (nonce < MAX_ATTEMPTS) {
    const hash = await sha256Hex(`${challenge}${nonce}`);
    if (hash.startsWith(prefix)) {
      postMessage({ nonce: String(nonce) });
      return;
    }
    nonce++;
    // Lapor progres tiap 5000 percobaan supaya UI bisa tampilkan indikator.
    if (nonce % 5000 === 0) {
      postMessage({ progress: nonce });
    }
  }

  postMessage({ error: "Verifikasi keamanan terlalu lama, coba muat ulang halaman." });
};

export {};
