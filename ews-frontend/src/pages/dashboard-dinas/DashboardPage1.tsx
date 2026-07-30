import DashboardLayout from "../../layouts/DashboardLayout";

import SummaryCard from "../../components/dashboard-dinas1/SummaryCard";
import ProgressCard from "../../components/dashboard-dinas1/ProgressCard";
import StatusCard from "../../components/dashboard-dinas1/StatusCard";
import DashboardChart from "../../components/dashboard-dinas1/DashboardChart";
import ReportTable from "../../components/dashboard-dinas1/ReportTable";
import VillageHeatmap from "../../components/dashboard-dinas1/VillageHeatmap";
import {
  GraduationCap,
  AlertTriangle,
  House,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../../services/dashboard.service";
import type { OpdDashboardData } from "../../types/api";
import { useState } from "react";

export default function DashboardPage() {
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard", "OPD"],
    queryFn: getDashboard,
  });
  const d = dashboard as OpdDashboardData | undefined;
  const progressOf = (label: string) => d?.progress.find((p) => p.label === label)?.value ?? 0;
  const [expanded, setExpanded] = useState(false);

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

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
  {/* Report Table */}
  <div className="xl:col-span-2">
    <ReportTable />
  </div>

  <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

  {/* Header */}
  <button
    onClick={() => setExpanded((prev) => !prev)}
    className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition"
  >
    <div className="text-left">
      <h2 className="text-xl font-bold text-slate-800">
        Peta Risiko Kapanewon
      </h2>

      <p className="text-sm text-slate-500">
        Persebaran risiko anak tidak sekolah di Kabupaten Sleman
      </p>
    </div>

    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
      {expanded ? (
        <ChevronUp className="text-slate-600" size={20} />
      ) : (
        <ChevronDown className="text-slate-600" size={20} />
      )}
    </div>
  </button>

  <div className="border-t border-slate-200" />

  {/* Body */}
  <div className="p-6">
    <VillageHeatmap expanded={expanded} />
  </div>

</div>
</div>
      </div>
    </DashboardLayout>
    
  );
}