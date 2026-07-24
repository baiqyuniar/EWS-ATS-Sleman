import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MlSulingjar {
  kesiapsiagaan_bencana?: number | null;
  kualitas_pembelajaran?: number | null;
  refleksi_guru?: number | null;
  kepemimpinan_kepsek?: number | null;
  iklim_keamanan?: number | null;
  iklim_kesetaraan_gender?: number | null;
  iklim_kebinekaan?: number | null;
  iklim_inklusivitas?: number | null;
  partisipasi_warga?: number | null;
  program_satuan_pendidikan?: number | null;
}

export interface MlFeatures {
  nisn?: string;
  jk_bin: number;
  num?: number | null;
  kode_pendidikan_ayah?: number | null;
  kode_pendidikan_ibu?: number | null;
  kode_penghasilan_ayah?: number | null;
  kode_penghasilan_ibu?: number | null;
  sulingjar?: MlSulingjar;
}

export interface MlPredictionResult {
  nisn?: string;
  prob_do: number | null;
  risiko_do: 'BERISIKO' | 'Tidak' | 'Data Tidak Lengkap';
  risk_band: 'RENDAH' | 'SEDANG' | 'TINGGI' | null;
  alasan_risiko: string[];
  model_dipakai: 'aspd_num' | 'tanpa_aspd';
}

/**
 * HTTP client for `ews-ml-service` (the FastAPI wrapper around the ewsDropOut XGBoost
 * model — see https://github.com/hdmeasure/ewsDropOut). Returns `null` whenever the
 * service is unreachable or not configured, so callers can fall back gracefully to the
 * temporary rule-based engine (PredictionEngineService) instead of hard-failing.
 */
@Injectable()
export class MlClientService {
  private readonly logger = new Logger(MlClientService.name);
  private readonly baseUrl: string | undefined;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('ML_SERVICE_URL') || undefined;
  }

  get isConfigured(): boolean {
    return !!this.baseUrl;
  }

  async predict(features: MlFeatures): Promise<MlPredictionResult | null> {
    if (!this.baseUrl) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(`ML service returned ${res.status}: ${body}`);
        return null;
      }

      return (await res.json()) as MlPredictionResult;
    } catch (err) {
      this.logger.warn(`ML service unreachable, falling back to rule-based engine: ${err}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
