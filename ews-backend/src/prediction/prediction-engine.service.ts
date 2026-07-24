import { Injectable } from '@nestjs/common';

export interface PredictionFeatures {
  num?: number | null; // skor numerasi 0-100
  kodePendidikanAyah?: number | null; // 0-8
  kodePendidikanIbu?: number | null; // 0-8
  kodePenghasilanAyah?: number | null; // 0-6
  kodePenghasilanIbu?: number | null; // 0-6
}

export interface PredictionResult {
  probabilitas: number; // 0 - 100
  riskCategory: 'RENDAH' | 'SEDANG' | 'TINGGI';
}

/**
 * FALLBACK RULE-BASED SCORING ENGINE — dipakai HANYA jika `ews-ml-service` (wrapper
 * REST untuk model XGBoost asli dari https://github.com/hdmeasure/ewsDropOut) tidak
 * dikonfigurasi (`ML_SERVICE_URL` kosong) atau sedang tidak bisa diakses.
 *
 * Ini BUKAN model ML sungguhan — hanya heuristik berbobot transparan berbasis fitur
 * yang sama (skor numerasi, pendidikan & penghasilan orang tua) supaya sistem tetap
 * bisa menghasilkan skor kasar saat model asli sedang tidak tersedia, alih-alih gagal
 * total. Lihat `ml-client.service.ts` dan `../../ews-ml-service/` untuk model asli.
 */
@Injectable()
export class PredictionEngineService {
  score(features: PredictionFeatures): PredictionResult {
    let points = 0;

    if (features.num !== undefined && features.num !== null) {
      if (features.num < 40) points += 30;
      else if (features.num < 60) points += 15;
    }

    if (features.kodePendidikanAyah !== undefined && features.kodePendidikanAyah !== null && features.kodePendidikanAyah <= 2) {
      points += 15;
    }
    if (features.kodePendidikanIbu !== undefined && features.kodePendidikanIbu !== null && features.kodePendidikanIbu <= 2) {
      points += 15;
    }
    if (features.kodePenghasilanAyah !== undefined && features.kodePenghasilanAyah !== null && features.kodePenghasilanAyah <= 1) {
      points += 20;
    }
    if (features.kodePenghasilanIbu !== undefined && features.kodePenghasilanIbu !== null && features.kodePenghasilanIbu <= 1) {
      points += 10;
    }

    const probabilitas = Math.min(100, points);

    let riskCategory: PredictionResult['riskCategory'] = 'RENDAH';
    if (probabilitas >= 60) riskCategory = 'TINGGI';
    else if (probabilitas >= 30) riskCategory = 'SEDANG';

    return { probabilitas, riskCategory };
  }
}
