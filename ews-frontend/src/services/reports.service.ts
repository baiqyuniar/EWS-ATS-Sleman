import { api } from "../lib/api";

export interface ReportQuery {
  from?: string;
  to?: string;
}

export const getRekap = async (query: ReportQuery = {}) => {
  const { data } = await api.get("/reports/rekap", { params: query });
  return data;
};

export const getStatistikSekolah = async () => {
  const { data } = await api.get("/reports/statistik-sekolah");
  return data;
};

export const getExportRows = async (query: ReportQuery = {}) => {
  const { data } = await api.get("/reports/export", { params: query });
  return data;
};
