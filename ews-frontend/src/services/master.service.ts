// Master data services (SRS "Modul Master") — all follow the same REST shape:
// GET (list, paginated), GET :id, POST (Admin), PUT :id (Admin), DELETE :id (Admin)
import { api } from "../lib/api";
import type {
  Paginated,
  School,
  Opd,
  Wilayah,
  RiskFactor,
  InterventionType,
  Regulation,
  Agama,
  KebutuhanKhusus,
  JenisTinggal,
  AlatTransportasi,
  PekerjaanOrtu,
  PendidikanOrtu,
  PenghasilanOrtu,
} from "../types/api";

export interface MasterQuery {
  page?: number;
  limit?: number;
  search?: string;
}

function crud<T>(basePath: string) {
  return {
    list: async (query: MasterQuery = {}): Promise<Paginated<T>> => {
      const { data } = await api.get<Paginated<T>>(basePath, { params: query });
      return data;
    },
    get: async (id: number): Promise<T> => {
      const { data } = await api.get<T>(`${basePath}/${id}`);
      return data;
    },
    create: async (payload: any): Promise<T> => {
      const { data } = await api.post<T>(basePath, payload);
      return data;
    },
    update: async (id: number, payload: any): Promise<T> => {
      const { data } = await api.put<T>(`${basePath}/${id}`, payload);
      return data;
    },
    remove: async (id: number): Promise<void> => {
      await api.delete(`${basePath}/${id}`);
    },
  };
}

export const schoolsApi = crud<School>("/schools");
export const opdApi = crud<Opd>("/opd");
export const wilayahApi = crud<Wilayah>("/wilayah");
export const riskFactorsApi = crud<RiskFactor>("/risk-factors");
export const interventionTypesApi = crud<InterventionType>("/intervention-types");
export const regulationsApi = crud<Regulation>("/regulations");

// Mastering data siswa (dari "Data Siswa Aktif" / Dapodik) — additive.
export const agamaApi = crud<Agama>("/agama");
export const kebutuhanKhususApi = crud<KebutuhanKhusus>("/kebutuhan-khusus");
export const jenisTinggalApi = crud<JenisTinggal>("/jenis-tinggal");
export const alatTransportasiApi = crud<AlatTransportasi>("/alat-transportasi");
export const pekerjaanOrtuApi = crud<PekerjaanOrtu>("/pekerjaan-ortu");
export const pendidikanOrtuApi = crud<PendidikanOrtu>("/pendidikan-ortu");
export const penghasilanOrtuApi = crud<PenghasilanOrtu>("/penghasilan-ortu");
