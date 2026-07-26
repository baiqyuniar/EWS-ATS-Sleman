import DashboardLayout from "../../layouts/DashboardLayout";

import SummaryCard from "../../components/dashboard-dinas/SummaryCard";
import ProgressCard from "../../components/dashboard-dinas/ProgressCard";
import StatusCard from "../../components/dashboard-dinas/StatusCard";
import DashboardChart from "../../components/dashboard-dinas/DashboardChart";
import ReportTable from "../../components/dashboard-dinas/ReportTable";
import VillageHeatmap from "../../components/dashboard-dinas/VillageHeatmap";
import {
  GraduationCap,
  AlertTriangle,
  House,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../../services/dashboard.service";
import type { OpdDashboardData } from "../../types/api";

export default function DashboardPage() {
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard", "OPD"],
    queryFn: getDashboard,
  });
  const d = dashboard as OpdDashboardData | undefined;
  const progressOf = (label: string) => d?.progress.find((p) => p.label === label)?.value ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ================= SUMMARY ================= */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <SummaryCard
            title="Total Siswa APS"
            value={d?.totalSiswaAps ?? "-"}
            subtitle="Rujukan ditangani"
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
            title="Intervensi Berjalan"
            value={d?.intervensiBerjalan ?? "-"}
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
                { label: "Rujukan Diterima", value: progressOf("Rujukan Diterima") },
                { label: "Intervensi Selesai", value: progressOf("Intervensi Selesai") },
              ]}
            />

            <StatusCard
              completed={d?.status.completed ?? 0}
              completedLocation={d?.status.completedLocation ?? "-"}
              pending={d?.status.pending ?? 0}
              pendingText={d?.status.pendingText ?? "Perlu verifikasi segera"}
              heading="Ringkasan Rujukan"
              completedLabel="Rujukan Selesai"
              pendingLabel="Rujukan Baru"
            />

          </div>

        </div>

        {/* ================= TABLE ================= */}

        <ReportTable />
{/* ================= HEATMAP ================= */}

<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
  <div className="mb-6">
    <h2 className="text-xl font-bold text-slate-800">
      Peta Risiko Kapanewon
    </h2>

    <p className="text-sm text-slate-500">
      Persebaran risiko anak tidak sekolah di Kabupaten Sleman
    </p>
  </div>

  <VillageHeatmap />
</div>
      </div>
    </DashboardLayout>
    
  );
}