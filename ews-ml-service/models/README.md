# Folder Model

Letakkan di sini file hasil export dari repo `ewsDropOut`
(https://github.com/hdmeasure/ewsDropOut, folder `platform_export/models/`):

```
models/
  aspd_num_spec.json       <- spesifikasi model utama (fitur, kalibrasi, threshold)
  aspd_num_booster.json    <- model XGBoost utama (native, lintas-bahasa)
  tanpa_aspd_spec.json     <- spesifikasi model fallback
  tanpa_aspd_booster.json  <- model XGBoost fallback
```

Cara mendapatkannya (dari repo ewsDropOut, setelah training selesai):

```bash
cd ewsDropOut/platform_export
python3 export_model.py --in-dir /path/ke/output --out-dir models
# lalu salin models/aspd_num_spec.json, models/aspd_num_booster.json,
# models/tanpa_aspd_spec.json, models/tanpa_aspd_booster.json ke folder ini.
```

File `.rds` dan `.joblib` tidak dipakai oleh service ini — cukup pasangan
`_spec.json` + `_booster.json` untuk masing-masing model (`aspd_num`, `tanpa_aspd`).

Tanpa file ini, endpoint `/predict` akan mengembalikan HTTP 503 dengan pesan
yang menjelaskan file mana yang belum ada.
