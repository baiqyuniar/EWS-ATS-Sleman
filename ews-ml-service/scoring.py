"""
Scoring pipeline — mereproduksi PERSIS logika di ewsDropOut/platform_export/predict.R
dan predict.py (https://github.com/hdmeasure/ewsDropOut):

    p_raw  = booster.predict(X[features])          # urutan fitur wajib sesuai spec
    p_cal  = calibrate(p_raw)                       # sigmoid: 1/(1+exp(-(a*logit(p)+b)))
                                                     # isotonic: interpolasi linier (x, y)
    offset = logit(pi_pop) - logit(pi_train)
    p_adj  = sigmoid(logit(p_cal) + offset)         # koreksi prior ke base rate populasi
    label  = "BERISIKO" if p_adj >= threshold else "Tidak"

Setiap model (`aspd_num`, `tanpa_aspd`) diekspor sebagai dua file di models/:
  - <name>_spec.json     : { "features": [...], "calibration": {...}, "pi_pop": ..,
                             "pi_train": .., "threshold": .. }   (sumber kebenaran)
  - <name>_booster.json  : model XGBoost native, lintas-bahasa

Letakkan kedua file itu (hasil export dari repo ewsDropOut kamu) di folder models/
sebelum menjalankan service ini. Lihat models/README.md.
"""

import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import xgboost as xgb

MODELS_DIR = Path(__file__).parent / "models"

# Label Bahasa Indonesia untuk tiap kolom fitur, dipakai saat menyusun `alasan_risiko`
# dari kontribusi SHAP. Lihat docs/CODEBOOK.md di repo ewsDropOut untuk definisi lengkap.
FEATURE_LABELS: Dict[str, str] = {
    "jk_bin": "Jenis kelamin",
    "num": "Skor numerasi (asesmen standar)",
    "kode_pendidikan_ayah": "Tingkat pendidikan ayah",
    "kode_pendidikan_ibu": "Tingkat pendidikan ibu",
    "kode_penghasilan_ayah": "Tingkat penghasilan ayah",
    "kode_penghasilan_ibu": "Tingkat penghasilan ibu",
    # Kunci di sini HARUS persis sama dengan nama fitur di models/*_spec.json
    # (mis. "sulingjar_D.18"), karena _top_reasons() mencocokkan berdasarkan
    # nama fitur booster, bukan nama ramah di API. Hanya 4 indikator sulingjar
    # berikut yang benar-benar dipakai model final (aspd_num + tanpa_aspd
    # gabungan) — lihat platform_export/models/*_spec.json di repo ewsDropOut.
    "sulingjar_D.18": "Mutu sekolah: kesiapsiagaan bencana",
    "sulingjar_D.1": "Mutu sekolah: kualitas pembelajaran",
    "sulingjar_D.2": "Mutu sekolah: refleksi & perbaikan pembelajaran guru",
    "sulingjar_D.6": "Mutu sekolah: iklim kesetaraan gender",
}


def logit(p: np.ndarray) -> np.ndarray:
    p = np.clip(p, 1e-6, 1 - 1e-6)
    return np.log(p / (1 - p))


def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-z))


def calibrate(p_raw: np.ndarray, cal: Dict[str, Any]) -> np.ndarray:
    if cal["method"] == "sigmoid":
        return sigmoid(cal["a"] * logit(p_raw) + cal["b"])
    # isotonic: interpolasi linier dengan clip di ujung (setara `approx(..., rule = 2)` di R)
    x = np.array(cal["x"], dtype=float)
    y = np.array(cal["y"], dtype=float)
    return np.interp(p_raw, x, y)


class LoadedModel:
    def __init__(self, name: str):
        spec_path = MODELS_DIR / f"{name}_spec.json"
        booster_path = MODELS_DIR / f"{name}_booster.json"
        if not spec_path.exists() or not booster_path.exists():
            raise FileNotFoundError(
                f"Model '{name}' belum tersedia. Letakkan {name}_spec.json dan "
                f"{name}_booster.json di folder models/ (lihat models/README.md)."
            )
        with open(spec_path) as f:
            self.spec = json.load(f)

        self.booster = xgb.Booster()
        self.booster.load_model(str(booster_path))

        self.features: List[str] = self.spec["features"]
        self.calibration = self.spec["calibration"]
        self.pi_pop = float(self.spec["pi_pop"])
        self.pi_train = float(self.spec["pi_train"])
        self.threshold = float(self.spec["threshold"])

    def score(self, feature_values: Dict[str, Optional[float]]) -> Tuple[float, str, str, List[str]]:
        row = [feature_values.get(f) for f in self.features]
        if any(v is None for v in row):
            missing = [f for f, v in zip(self.features, row) if v is None]
            raise ValueError(f"Data tidak lengkap untuk model ini, kolom hilang: {missing}")

        X = np.array([row], dtype=float)
        dmatrix = xgb.DMatrix(X, feature_names=self.features)

        p_raw = self.booster.predict(dmatrix)
        p_cal = calibrate(p_raw, self.calibration)
        offset = math.log(self.pi_pop / (1 - self.pi_pop)) - math.log(self.pi_train / (1 - self.pi_train))
        p_adj = sigmoid(logit(p_cal) + offset)

        prob_do = round(float(p_adj[0]), 4)
        label = "BERISIKO" if prob_do >= self.threshold else "Tidak"

        # Band 3-tingkat (Rendah/Sedang/Tinggi) untuk selaras dengan klasifikasi di
        # Flowchart_EWS-ATS.png & SRS (Hijau/Kuning/Merah). BERISIKO selalu = Tinggi;
        # di bawah threshold dibagi dua berdasarkan jarak relatif ke threshold tsb.
        if label == "BERISIKO":
            band = "TINGGI"
        elif prob_do >= self.threshold * 0.5:
            band = "SEDANG"
        else:
            band = "RENDAH"

        alasan = self._top_reasons(X)
        return prob_do, label, band, alasan

    def _top_reasons(self, X: np.ndarray, top_k: int = 3) -> List[str]:
        """SHAP-based explanation: fitur dengan kontribusi positif terbesar terhadap risiko DO."""
        try:
            import shap

            explainer = shap.TreeExplainer(self.booster)
            shap_values = explainer.shap_values(X)
            values = np.array(shap_values)[0]
            ranked = sorted(zip(self.features, values), key=lambda t: t[1], reverse=True)
            reasons = [FEATURE_LABELS.get(f, f) for f, v in ranked if v > 0][:top_k]
            return reasons
        except Exception:
            # SHAP gagal (mis. versi xgboost tidak kompatibel) — jangan sampai gagal total,
            # cukup kembalikan daftar kosong dan biarkan prob_do/risiko_do tetap terkirim.
            return []


class TieredScorer:
    """
    Pendekatan tiered persis README ewsDropOut:
      - pakai model 'aspd_num' jika siswa punya skor numerasi (`num`),
      - fallback ke 'tanpa_aspd' jika tidak.
    """

    def __init__(self):
        self._cache: Dict[str, LoadedModel] = {}

    def _get(self, name: str) -> LoadedModel:
        if name not in self._cache:
            self._cache[name] = LoadedModel(name)
        return self._cache[name]

    def score(self, features: Dict[str, Optional[float]]) -> Dict[str, Any]:
        model_name = "aspd_num" if features.get("num") is not None else "tanpa_aspd"
        try:
            model = self._get(model_name)
            prob_do, label, band, alasan = model.score(features)
            return {
                "prob_do": prob_do,
                "risiko_do": label,
                "risk_band": band,
                "alasan_risiko": alasan,
                "model_dipakai": model_name,
            }
        except ValueError:
            # Kolom wajib untuk tier ini masih kosong.
            return {
                "prob_do": None,
                "risiko_do": "Data Tidak Lengkap",
                "risk_band": None,
                "alasan_risiko": [],
                "model_dipakai": model_name,
            }
