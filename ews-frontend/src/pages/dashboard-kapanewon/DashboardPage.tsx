import DashboardLayout from "../../layouts/DashboardLayout";

import SummaryCard from "../../components/dashboard-kapanewon/SummaryCard";
import ProgressCard from "../../components/dashboard-kapanewon/ProgressCard";
import StatusCard from "../../components/dashboard-kapanewon/StatusCard";
import DashboardChart from "../../components/dashboard-kapanewon/DashboardChart";
import ReportTable from "../../components/dashboard-kapanewon/ReportTable";
import AnalyticsPanel from "../../components/dashboard/AnalyticsPanel";
import {
  GraduationCap,
  AlertTriangle,
  House,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { wilayahApi } from "../../services/master.service";
import { getKapanewonAnalytics, getDashboard } from "../../services/dashboard.service";
import type { KapanewonDashboardData } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const wilayahId = user?.wilayahId ?? undefined;

  // Resolusi wilayahId (akun login) -> nama kapanewon, dipakai memanggil endpoint analitik.
  const { data: wilayah } = useQuery({
    queryKey: ["wilayah-own", wilayahId],
    queryFn: () => wilayahApi.get(wilayahId as number),
    enabled: !!wilayahId,
  });
  const kapanewon = wilayah?.kapanewon;

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["kapanewon-analytics", kapanewon],
    queryFn: () => getKapanewonAnalytics(kapanewon as string),
    enabled: !!kapanewon,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard", "KAPANEWON"],
    queryFn: getDashboard,
  });
  const d = dashboard as KapanewonDashboardData | undefined;
  const progressOf = (label: string) => d?.progress.find((p) => p.label === label)?.value ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ================= SUMMARY ================= */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <SummaryCard
            title="Total Siswa APS"
            value={d?.totalSiswaAps ?? "-"}
            subtitle={d?.kapanewon ? `Kapanewon ${d.kapanewon}` : "Tercatat"}
            icon={<GraduationCap size={24} />}
            iconBg="bg-blue-100 text-blue-700"
          />

          <SummaryCard
            title="Kasus Berisiko Tinggi"
            value={d?.kasusBerisikoTinggi ?? "-"}
            subtitle="Perlu tindak lanjut"
            icon={<AlertTriangle size={24} />}
            iconBg="bg-red-100 text-red-600"
          />

          <SummaryCard
            title="Kunjungan Rumah Aktif"
            value={d?.kunjunganRumahAktif ?? "-"}
            subtitle="Sedang berjalan"
            icon={<House size={24} />}
            iconBg="bg-blue-100 text-blue-700"
          />

        </div>

        {/* ================= CHART ================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Chart */}

          <div className="xl:col-span-2">
            <DashboardChart />
          </div>

          {/* Right Side */}

          <div className="space-y-6">

            <ProgressCard
              title="Target Penanganan"
              items={[
                { label: "Verifikasi Kasus", value: progressOf("Verifikasi Kasus") },
                { label: "Dirujuk ke OPD", value: progressOf("Dirujuk ke OPD") },
              ]}
            />

            <StatusCard
              completed={d?.status.completed ?? 0}
              completedLocation={d?.status.completedLocation ?? "-"}
              pending={d?.status.pending ?? 0}
              pendingText={d?.status.pendingText ?? "Perlu verifikasi segera"}
            />

          </div>

        </div>

        {/* ================= TABLE ================= */}

        <ReportTable />


        {/* ===================================================== */}
        {/* ANALISIS OTOMATIS — MASTERING DATA */}
        {/* ===================================================== */}

        <AnalyticsPanel
          data={analytics}
          isLoading={analyticsLoading}
          scopeLabel={kapanewon ? `Kapanewon ${kapanewon}` : "kapanewon Anda"}
        />

      </div>
    </DashboardLayout>
    
  );
}