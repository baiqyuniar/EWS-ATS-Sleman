# EWS-APS ML Service

Membungkus model prediksi risiko putus sekolah dari repo
[`hdmeasure/ewsDropOut`](https://github.com/hdmeasure/ewsDropOut) sebagai REST API,
supaya bisa dipanggil dari backend NestJS (`ews-backend`) tanpa perlu menjalankan R/Python
langsung di server Node.

Ini **bukan** model baru — ini persis mereproduksi pipeline skoring di
`platform_export/predict.R` / `predict.py` milik repo tersebut (kalibrasi + koreksi
prior populasi + threshold), hanya dibungkus jadi service HTTP yang selalu hidup.

## Setup

```bash
cd ews-ml-service
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Lalu **wajib**: letakkan file model di `models/` — lihat `models/README.md` untuk detail
cara mendapatkannya dari repo `ewsDropOut` kamu (hasil `export_model.py`).

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

Cek: `curl http://localhost:8000/health` → `{"status":"ok"}`

Dokumentasi interaktif (Swagger otomatis dari FastAPI): `http://localhost:8000/docs`

## Contoh pemanggilan

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "nisn": "0051234567",
    "jk_bin": 1,
    "num": 62,
    "kode_pendidikan_ayah": 3,
    "kode_pendidikan_ibu": 2,
    "kode_penghasilan_ayah": 2,
    "kode_penghasilan_ibu": 1,
    "sulingjar": {
      "kesiapsiagaan_bencana": 2,
      "kualitas_pembelajaran": 2,
      "refleksi_guru": 3,
      "kepemimpinan_kepsek": 2,
      "iklim_keamanan": 3,
      "iklim_kesetaraan_gender": 3,
      "iklim_kebinekaan": 2,
      "iklim_inklusivitas": 2,
      "partisipasi_warga": 2,
      "program_satuan_pendidikan": 2
    }
  }'
```

Response:
```json
{
  "nisn": "0051234567",
  "prob_do": 0.031,
  "risiko_do": "Tidak",
  "alasan_risiko": [],
  "model_dipakai": "aspd_num"
}
```

Jika `num` dikosongkan (`null`), service otomatis memakai model fallback `tanpa_aspd`
(pendekatan tiered, sesuai desain repo ewsDropOut). Jika kolom wajib untuk model yang
dipilih masih kosong, `risiko_do` akan berisi `"Data Tidak Lengkap"`.

## Bagaimana ini dipakai backend NestJS

Set `ML_SERVICE_URL=http://localhost:8000` di `.env` backend (`ews-backend`).
`PredictionService` di backend akan memanggil `POST {ML_SERVICE_URL}/predict` setiap kali
Sekolah menjalankan simulasi prediksi atau upload data batch, lalu menyimpan hasilnya
(`prob_do`, `risiko_do`, `alasan_risiko`, `model_dipakai`) ke tabel `predictions`.

Jika `ML_SERVICE_URL` tidak diset atau service ini sedang tidak bisa diakses, backend
otomatis jatuh ke rule-based scoring sementara (lihat catatan di
`ews-backend/src/prediction/prediction-engine.service.ts`) supaya sistem tetap berjalan.

## Deploy (opsional, Docker)

```bash
docker build -t ews-ml-service .
docker run -p 8000:8000 -v $(pwd)/models:/app/models ews-ml-service
```

## Catatan penting

- **Urutan fitur** pada request harus sesuai `features` di `<name>_spec.json` — service
  ini sudah menanganinya secara otomatis (mapping nama fitur → posisi kolom), selama
  nama kolom di `spec.json` kamu sama dengan yang dipakai di `scoring.py`
  (`FEATURE_LABELS`). Kalau nama fitur di model kamu berbeda, sesuaikan mapping di
  `_flatten_features()` (`app.py`) dan `FEATURE_LABELS` (`scoring.py`).
- **SHAP** dipakai untuk `alasan_risiko`. Kalau versi `xgboost`/`shap` di server kamu
  tidak kompatibel dengan versi saat model dilatih, `alasan_risiko` akan otomatis
  dikosongkan (bukan error) — `prob_do`/`risiko_do` tetap terkirim dengan benar.
- **Threshold operasional**: sesuai catatan repo ewsDropOut, saat diterapkan ke populasi
  penuh (bukan data uji), sebaiknya hitung ulang `threshold` sebagai kuantil populasi
  agar proporsi siswa ter-flag tetap masuk akal. Update nilai `threshold` di
  `<name>_spec.json` sesuai kebutuhan operasional — tidak perlu mengubah kode.
