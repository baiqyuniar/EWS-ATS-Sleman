import { useState } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

import {
  TrendingUp,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { getSchoolRiskTrend } from "../../services/dashboard.service";

interface DashboardChartProps {
  schoolId?: number;
  totalSiswa?: number;
  risikoTinggi?: number;
  risikoSedang?: number;
  risikoRendah?: number;
}

export default function DashboardChart({
  schoolId,
  totalSiswa,
  risikoTinggi,
  risikoSedang,
  risikoRendah,
}: DashboardChartProps) {

  const [period, setPeriod] =
    useState<"week" | "month" | "year">("month");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "school-risk-trend", schoolId, period],
    queryFn: () => getSchoolRiskTrend(schoolId as number, period),
    enabled: !!schoolId,
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 border-b border-slate-100">

        <div>

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">

              <TrendingUp
                className="text-blue-600"
                size={22}
              />

            </div>

            <div>

              <h2 className="font-bold text-lg text-slate-800">
                Statistik Risiko ATS
              </h2>

              <p className="text-sm text-slate-500">
                Monitoring perkembangan siswa
              </p>

            </div>

          </div>

        </div>

        {/* FILTER */}

        <div className="flex items-center gap-2">

          <CalendarDays
            size={18}
            className="text-slate-500"
          />

          {(["week", "month", "year"] as const).map((item) => (

            <button
              key={item}
              onClick={() => setPeriod(item)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                period === item
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item === "week"
                ? "Minggu"

                : item === "month"

                ? "Bulan"

                : "Tahun"}
            </button>

          ))}

        </div>

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">

        <div className="bg-red-50 rounded-2xl p-5">

          <p className="text-sm text-red-600">
            Risiko Tinggi
          </p>

          <h3 className="text-3xl font-bold text-red-600 mt-2">
            {risikoTinggi ?? "-"}
          </h3>

        </div>

        <div className="bg-yellow-50 rounded-2xl p-5">

          <p className="text-sm text-yellow-700">
            Risiko Sedang
          </p>

          <h3 className="text-3xl font-bold text-yellow-600 mt-2">
            {risikoSedang ?? "-"}
          </h3>

        </div>

        <div className="bg-green-50 rounded-2xl p-5">

          <p className="text-sm text-green-700">
            Risiko Rendah
          </p>

          <h3 className="text-3xl font-bold text-green-600 mt-2">
            {risikoRendah ?? "-"}
          </h3>

        </div>

        <div className="bg-blue-50 rounded-2xl p-5">

          <p className="text-sm text-blue-700">
            Total Siswa
          </p>

          <h3 className="text-3xl font-bold text-blue-600 mt-2">
            {totalSiswa ?? "-"}
          </h3>

        </div>

      </div>

      {/* CHART */}

      <div className="h-[380px] px-6 pb-6">

        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Memuat data...
          </div>
        ) : (
        <ResponsiveContainer>

          <AreaChart
            data={data ?? []}
          >

            <defs>

              <linearGradient
                id="high"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="5%"
                  stopColor="#ef4444"
                  stopOpacity={0.4}
                />

                <stop
                  offset="95%"
                  stopColor="#ef4444"
                  stopOpacity={0}
                />

              </linearGradient>

              <linearGradient
                id="medium"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >

                <stop
                  offset="5%"
                  stopColor="#f59e0b"
                  stopOpacity={0.35}
                />

                <stop
                  offset="95%"
                  stopColor="#f59e0b"
                  stopOpacity={0}
                />

              </linearGradient>

            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#e5e7eb"
            />

            <XAxis
              dataKey="name"
            />

            <YAxis allowDecimals={false} />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="tinggi"
              stroke="#ef4444"
              fill="url(#high)"
              strokeWidth={3}
            />

            <Area
              type="monotone"
              dataKey="sedang"
              stroke="#f59e0b"
              fill="url(#medium)"
              strokeWidth={3}
            />

          </AreaChart>

        </ResponsiveContainer>
        )}

      </div>

      {/* FOOTER */}

      <div className="border-t border-slate-100 p-5 flex justify-between items-center">

        <div className="flex gap-6">

          <div className="flex items-center gap-2">

            <div className="w-3 h-3 rounded-full bg-red-500" />

            <span className="text-sm text-slate-500">
              Risiko Tinggi
            </span>

          </div>

          <div className="flex items-center gap-2">

            <div className="w-3 h-3 rounded-full bg-yellow-500" />

            <span className="text-sm text-slate-500">
              Risiko Sedang
            </span>

          </div>

        </div>

        <p className="text-sm text-slate-400">
          Update terakhir: Hari ini
        </p>

      </div>

    </div>
  );
}
