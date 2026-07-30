import DashboardLayout from "../../layouts/DashboardLayout";

//import SummaryCard from "../../components/dashboard-kapanewon/SummaryCard";
import ProgressCard from "../../components/dashboard-kapanewon/ProgressCard";
import StatusCard from "../../components/dashboard-kapanewon/StatusCard";
import DashboardChart from "../../components/dashboard-kapanewon/DashboardChart";
import ReportTable from "../../components/dashboard-kapanewon/ReportTable";
import AnalyticsPanel from "../../components/dashboard/AnalyticsPanel";
import {
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

        {/* ===================================================== */}
{/* HEADER */}
{/* ===================================================== */}

<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 text-white p-8 shadow-xl">

  <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/10" />
  <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-white/10" />

  <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

    {/* Left */}
    <div>

      <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-md mb-5">

        <House size={18} />

        <span className="text-sm font-medium">
          Dashboard Kapanewon
        </span>

      </div>

      <h1 className="text-4xl font-bold">
        Selamat Datang
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-blue-50">
        Pantau kondisi Anak Tidak Sekolah pada tingkat kapanewon,
        identifikasi wilayah prioritas, serta koordinasikan proses
        intervensi dengan sekolah dan OPD secara real-time.
      </p>

      <p className="mt-3 text-blue-100 font-medium">
        {kapanewon ? `Kapanewon ${kapanewon}` : "-"}
      </p>

    </div>

    {/* Right */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      <div className="rounded-2xl border border-white/20 bg-white/15 p-5 text-center backdrop-blur-md">

        <h2 className="text-3xl font-bold">
          {analytics?.totalSiswa ?? "-"}
        </h2>

        <p className="mt-1 text-sm text-blue-100">
          Total Siswa APS
        </p>

      </div>

      <div className="rounded-2xl border border-white/20 bg-white/15 p-5 text-center backdrop-blur-md">

        <h2 className="text-3xl font-bold">
          {analytics?.sebaranRisiko?.belumDiprediksi ?? "-"}
        </h2>

        <p className="mt-1 text-sm text-blue-100">
          Belum Diprediksi
        </p>

      </div>

      <div className="rounded-2xl border border-white/20 bg-white/15 p-5 text-center backdrop-blur-md">

        <h2 className="text-3xl font-bold">
          {analytics?.bantuanSosial?.penerimaKip ?? "-"}
        </h2>

        <p className="mt-1 text-sm text-blue-100">
          Penerima KIP
        </p>

      </div>

    </div>

  </div>

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