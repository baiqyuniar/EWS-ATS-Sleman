import { api } from "../lib/api";
import type {
  Paginated,
  Case,
  CaseStatus,
  CaseSource,
  CaseTimelineEntry,
  CreatePelaporanSekolahPayload,
  CreatePengaduanMasyarakatPayload,
  VerifikasiNikPayload,
  VerifikasiPengaduanPayload,
} from "../types/api";

export interface CaseQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CaseStatus;
  source?: CaseSource;
}

export const createPelaporanSekolah = async (
  payload: CreatePelaporanSekolahPayload,
): Promise<Case> => {
  const { data } = await api.post<Case>("/cases/pelaporan-sekolah", payload);
  return data;
};

export const createPengaduanMasyarakat = async (
  payload: CreatePengaduanMasyarakatPayload,
): Promise<Case> => {
  const { data } = await api.post<Case>("/cases/pengaduan-masyarakat", payload);
  return data;
};

export const verifikasiNik = async (
  caseId: number,
  payload: VerifikasiNikPayload,
): Promise<Case> => {
  const { data } = await api.post<Case>(`/cases/${caseId}/verifikasi-nik`, payload);
  return data;
};

export const verifikasiPengaduan = async (
  caseId: number,
  payload: VerifikasiPengaduanPayload,
): Promise<Case> => {
  const { data } = await api.post<Case>(`/cases/${caseId}/verifikasi-pengaduan`, payload);
  return data;
};

export const getCases = async (query: CaseQuery = {}): Promise<Paginated<Case>> => {
  const { data } = await api.get<Paginated<Case>>("/cases", { params: query });
  return data;
};

export const getCase = async (id: number): Promise<Case> => {
  const { data } = await api.get<Case>(`/cases/${id}`);
  return data;
};

export const getCaseTimeline = async (id: number): Promise<CaseTimelineEntry[]> => {
  const { data } = await api.get<CaseTimelineEntry[]>(`/cases/${id}/timeline`);
  return data;
};
