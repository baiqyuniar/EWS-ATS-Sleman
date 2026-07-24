import { api } from "../lib/api";
import type {
  SchoolAnalytics,
  KapanewonAnalytics,
  DashboardData,
  RecentCaseItem,
  MonthlyTrendItem,
  TopRiskStudent,
  SchoolRiskTrendItem,
  KapanewonHeatmapItem,
} from "../types/api";

// Metrik kartu dashboard (banner, SummaryCard, ProgressCard, StatusCard) — role-scoped
// otomatis oleh backend berdasarkan token login (SEKOLAH/KAPANEWON/OPD/DINAS_PENDIDIKAN/ADMIN).
export const getDashboard = async (): Promise<DashboardData> => {
  const { data } = await api.get<DashboardData>("/dashboard");
  return data;
};

// Dipakai komponen "ReportTable" — daftar kasus terbaru (role-scoped).
export const getRecentCases = async (): Promise<RecentCaseItem[]> => {
  const { data } = await api.get<RecentCaseItem[]>("/dashboard/recent-cases");
  return data;
};

// Dipakai komponen "DashboardChart" — tren jumlah kasus per bulan (role-scoped).
export const getMonthlyTrend = async (): Promise<MonthlyTrendItem[]> => {
  const { data } = await api.get<MonthlyTrendItem[]>("/dashboard/monthly-trend");
  return data;
};

// Dipakai komponen "ReportTable" di Dashboard Sekolah — siswa risiko tertinggi.
export const getTopRiskStudents = async (): Promise<TopRiskStudent[]> => {
  const { data } = await api.get<TopRiskStudent[]>("/dashboard/top-risk-students");
  return data;
};

// Dipakai komponen "DashboardChart" (varian sekolah) — tren risiko per periode.
export const getSchoolRiskTrend = async (
  schoolId: number,
  period: "week" | "month" | "year",
): Promise<SchoolRiskTrendItem[]> => {
  const { data } = await api.get<SchoolRiskTrendItem[]>(`/dashboard/schools/${schoolId}/risk-trend`, {
    params: { period },
  });
  return data;
};

// Dipakai komponen "VillageHeatmap" — peta risiko per kapanewon (kabupaten-wide).
export const getKapanewonHeatmap = async (): Promise<KapanewonHeatmapItem[]> => {
  const { data } = await api.get<KapanewonHeatmapItem[]>("/dashboard/kapanewon-heatmap");
  return data;
};

// Analisis otomatis (mastering data) untuk Dashboard Sekolah & Dashboard Kapanewon.
// Lihat DashboardService.schoolAnalytics / kapanewonAnalytics di backend.
export const getSchoolAnalytics = async (schoolId: number): Promise<SchoolAnalytics> => {
  const { data } = await api.get<SchoolAnalytics>(`/dashboard/schools/${schoolId}/analytics`);
  return data;
};

export const getKapanewonAnalytics = async (kapanewon: string): Promise<KapanewonAnalytics> => {
  const { data } = await api.get<KapanewonAnalytics>(
    `/dashboard/kapanewon/${encodeURIComponent(kapanewon)}/analytics`,
  );
  return data;
};
