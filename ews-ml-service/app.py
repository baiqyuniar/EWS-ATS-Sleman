"""
EWS-APS ML Service — membungkus model ewsDropOut (https://github.com/hdmeasure/ewsDropOut)
sebagai REST API supaya bisa dipanggil dari backend NestJS.

Jalankan:
    pip install -r requirements.txt
    uvicorn app:app --host 0.0.0.0 --port 8000

Sebelum itu, letakkan file model di models/ (lihat models/README.md):
    models/aspd_num_spec.json
    models/aspd_num_booster.json
    models/tanpa_aspd_spec.json
    models/tanpa_aspd_booster.json
"""

from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from scoring import TieredScorer

app = FastAPI(
    title="EWS-APS ML Service",
    description="Wrapper REST untuk model prediksi risiko putus sekolah (ewsDropOut, XGBoost tiered).",
    version="1.0.0",
)

scorer = TieredScorer()


class SulingjarIndicators(BaseModel):
    """Indikator mutu sekolah (level sekolah, dari survei lingkungan belajar / Rapor Pendidikan).
    Nilai 1=Kurang, 2=Sedang, 3=Baik. Semua opsional — isi sesuai ketersediaan data sekolah."""

    kesiapsiagaan_bencana: Optional[int] = None
    kualitas_pembelajaran: Optional[int] = None
    refleksi_guru: Optional[int] = None
    kepemimpinan_kepsek: Optional[int] = None
    iklim_keamanan: Optional[int] = None
    iklim_kesetaraan_gender: Optional[int] = None
    iklim_kebinekaan: Optional[int] = None
    iklim_inklusivitas: Optional[int] = None
    partisipasi_warga: Optional[int] = None
    program_satuan_pendidikan: Optional[int] = None


class StudentFeatures(BaseModel):
    """Sesuai docs/CODEBOOK.md pada repo ewsDropOut."""

    nisn: Optional[str] = Field(None, description="ID siswa, hanya untuk pelacakan di response")
    jk_bin: int = Field(..., description="1 = laki-laki, 0 = perempuan")
    num: Optional[float] = Field(None, description="Skor numerasi ASPD 0-100. Kosongkan jika siswa tidak punya skor asesmen.")
    kode_pendidikan_ayah: Optional[int] = Field(None, ge=0, le=8)
    kode_pendidikan_ibu: Optional[int] = Field(None, ge=0, le=8)
    kode_penghasilan_ayah: Optional[int] = Field(None, ge=0, le=6)
    kode_penghasilan_ibu: Optional[int] = Field(None, ge=0, le=6)
    sulingjar: SulingjarIndicators = Field(default_factory=SulingjarIndicators)


class PredictionResult(BaseModel):
    nisn: Optional[str] = None
    prob_do: Optional[float]
    risiko_do: str  # "BERISIKO" | "Tidak" | "Data Tidak Lengkap"
    risk_band: Optional[str] = None  # "RENDAH" | "SEDANG" | "TINGGI" (None jika Data Tidak Lengkap)
    alasan_risiko: List[str]
    model_dipakai: str  # "aspd_num" | "tanpa_aspd"


def _flatten_features(payload: StudentFeatures) -> Dict[str, Optional[float]]:
    s = payload.sulingjar
    return {
        "jk_bin": payload.jk_bin,
        "num": payload.num,
        "kode_pendidikan_ayah": payload.kode_pendidikan_ayah,
        "kode_pendidikan_ibu": payload.kode_pendidikan_ibu,
        "kode_penghasilan_ayah": payload.kode_penghasilan_ayah,
        "kode_penghasilan_ibu": payload.kode_penghasilan_ibu,
        "sulingjar_kesiapsiagaan_bencana": s.kesiapsiagaan_bencana,
        "sulingjar_kualitas_pembelajaran": s.kualitas_pembelajaran,
        "sulingjar_refleksi_guru": s.refleksi_guru,
        "sulingjar_kepemimpinan_kepsek": s.kepemimpinan_kepsek,
        "sulingjar_iklim_keamanan": s.iklim_keamanan,
        "sulingjar_iklim_kesetaraan_gender": s.iklim_kesetaraan_gender,
        "sulingjar_iklim_kebinekaan": s.iklim_kebinekaan,
        "sulingjar_iklim_inklusivitas": s.iklim_inklusivitas,
        "sulingjar_partisipasi_warga": s.partisipasi_warga,
        "sulingjar_program_satuan_pendidikan": s.program_satuan_pendidikan,
    }


@app.get("/cek")
def cek():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResult)
def predict(payload: StudentFeatures):
    try:
        result = scorer.score(_flatten_features(payload))
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return PredictionResult(nisn=payload.nisn, **result)


@app.post("/predict/batch", response_model=List[PredictionResult])
def predict_batch(payloads: List[StudentFeatures]):
    results = []
    for payload in payloads:
        try:
            result = scorer.score(_flatten_features(payload))
        except FileNotFoundError as e:
            raise HTTPException(status_code=503, detail=str(e))
        results.append(PredictionResult(nisn=payload.nisn, **result))
    return results
