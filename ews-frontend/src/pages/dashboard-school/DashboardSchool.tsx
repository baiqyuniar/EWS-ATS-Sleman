import {
  School2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import DashboardLayout from "../../layouts/DashboardLayout";

//import SummaryCard from "../../components/dashsekolah/SummaryCard";
import ProgressCard from "../../components/dashsekolah/ProgressTable";
import StatusCard from "../../components/dashsekolah/StatCard";
import DashboardChart from "../../components/dashsekolah/DashboardChart";
import ReportTable from "../../components/dashsekolah/ReportTable";
import AnalyticsPanel from "../../components/dashboard/AnalyticsPanel";
import { getSchoolAnalytics, getDashboard } from "../../services/dashboard.service";
import type { SekolahDashboardData } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const schoolId = user?.schoolId ?? undefined;

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["school-analytics", schoolId],
    queryFn: () => getSchoolAnalytics(schoolId as number),
    enabled: !!schoolId,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard", "SEKOLAH"],
    queryFn: getDashboard,
  });
  const d = dashboard as SekolahDashboardData | undefined;
  const progressOf = (label: string) => d?.progress.find((p) => p.label === label)?.value ?? 0;


  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ===================================================== */}
        {/* WELCOME */}
        {/* ===================================================== */}

{/* ===================================================== */}
{/* WELCOME */}
{/* ===================================================== */}

<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 text-white p-8 shadow-xl">

  {/* Background */}
  <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/10" />
  <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-white/10" />

  <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

    {/* Left */}
    <div className="flex-1">

      <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-2 mb-5">
        <School2 size={18} />
        <span className="text-sm font-medium">
          Dashboard Sekolah
        </span>
      </div>

      <h1 className="text-3xl lg:text-4xl font-bold">
        Selamat Datang
      </h1>

      <p className="mt-4 max-w-2xl text-blue-50 leading-7">
        Pantau kondisi siswa secara real-time,
        lakukan monitoring risiko Anak Tidak Sekolah,
        serta kelola proses intervensi dengan lebih cepat
        dan terintegrasi.
      </p>

    </div>

    {/* Right */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto">

      {/* Intervensi */}
      <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-5 text-center min-w-[170px]">
        <h2 className="text-3xl font-bold">
          {d?.intervensiBerjalan ?? "-"}
        </h2>

        <p className="text-sm text-blue-100 mt-2">
          Intervensi Berjalan
        </p>
      </div>

      {/* Belum Diprediksi */}
      <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-5 text-center">
      <h2 className="text-3xl font-bold">
        {analytics?.sebaranRisiko?.belumDiprediksi ?? "-"}
      </h2>

      <p className="text-sm text-blue-100 mt-1">
        Belum Diprediksi
      </p>
    </div>

      {/* Penerima KIP */}
      <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-5 text-center">
  <h2 className="text-3xl font-bold">
    {analytics?.bantuanSosial?.penerimaKip ?? "-"}
  </h2>

  <p className="text-sm text-blue-100 mt-1">
    Penerima KIP
  </p>
</div>

    </div>

  </div>

</div>



        {/* ===================================================== */}
        {/* CHART + TIMELINE */}
        {/* ===================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2">

            <DashboardChart
              schoolId={schoolId}
              totalSiswa={d?.totalSiswa}
              risikoTinggi={analytics?.sebaranRisiko.tinggi}
              risikoSedang={analytics?.sebaranRisiko.sedang}
              risikoRendah={analytics?.sebaranRisiko.rendah}
            />

          </div>

          <StatusCard />

        </div>

        {/* ===================================================== */}
        {/* PROGRESS */}
        {/* ===================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

  {/* Progress */}
  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
    <ProgressCard
      title="Progress Penanganan Sekolah"
      items={[
        { label: "Verifikasi Kasus", value: progressOf("Verifikasi Kasus") },
        { label: "Home Visit", value: progressOf("Home Visit") },
        { label: "Intervensi Berjalan", value: progressOf("Intervensi Berjalan") },
        { label: "Kasus Selesai", value: progressOf("Kasus Selesai") },
      ]}
    />
  </div>

  {/* Report Table */}
  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
    <ReportTable />
  </div>

</div>

        {/* ===================================================== */}
        {/* ANALISIS OTOMATIS — MASTERING DATA */}
        {/* ===================================================== */}

        <AnalyticsPanel
          data={analytics}
          isLoading={analyticsLoading}
          scopeLabel={analytics?.school ? `sekolah ${analytics.school.nama}` : "sekolah Anda"}
        />

      </div>
    </DashboardLayout>
  );
}