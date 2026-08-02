import { api } from "../lib/api";
import type { CaseStatus, CaseSource } from "../types/api";

export interface ReportQuery {
  from?: string;
  to?: string;
}

export interface RekapKasus {
  total: number;
  byStatus: { status: CaseStatus; _count: number }[];
  bySource: { source: CaseSource; _count: number }[];
}

// NPSN (identitas resmi sekolah dari Dapodik) — bukan id internal database.
export interface StatistikSekolahRow {
  npsn: string;
  nama: string;
  total: number;
  aktif: number;
}

export const getRekap = async (query: ReportQuery = {}): Promise<RekapKasus> => {
  const { data } = await api.get("/reports/rekap", { params: query });
  return data;
};

export const getStatistikSekolah = async (): Promise<StatistikSekolahRow[]> => {
  const { data } = await api.get("/reports/statistik-sekolah");
  return data;
};

export const getExportRows = async (query: ReportQuery = {}) => {
  const { data } = await api.get("/reports/export", { params: query });
  return data;
};
