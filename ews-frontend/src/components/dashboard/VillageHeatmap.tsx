import { MapPin, Users, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { getKapanewonHeatmap } from "../../services/dashboard.service";

export default function VillageHeatmap() {
  const { data: villages, isLoading } = useQuery({
    queryKey: ["dashboard", "kapanewon-heatmap"],
    queryFn: () => getKapanewonHeatmap(),
  });

  const getStatus = (risk: number) => {
    if (risk >= 130) {
      return {
        text: "Tinggi",
        color: "text-red-600",
        bg: "bg-red-500",
        badge: "bg-red-100 text-red-700",
      };
    }

    if (risk >= 80) {
      return {
        text: "Sedang",
        color: "text-yellow-600",
        bg: "bg-yellow-500",
        badge: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      text: "Rendah",
      color: "text-emerald-600",
      bg: "bg-emerald-500",
      badge: "bg-emerald-100 text-emerald-700",
    };
  };

  const getPercentage = (highRisk: number, totalStudents: number) => {
    return totalStudents > 0 ? (highRisk / totalStudents) * 100 : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Memuat data...
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(villages ?? []).map((village) => {
          const status = getStatus(village.highRisk);

          const percentage = getPercentage(
            village.highRisk,
            village.totalStudents,
          );

          return (
            <div
              key={village.name}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {/* Header */}

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-blue-600" />

                    <h3 className="font-bold text-lg text-slate-800">
                      {village.name}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-500 mt-1">Kapanewon</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${status.badge}`}
                >
                  {status.text}
                </span>
              </div>

              {/* Statistik */}

              <div className="grid grid-cols-2 gap-5 mt-6">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Users size={16} />
                    Total
                  </div>

                  <p className="text-2xl font-bold mt-2 text-slate-800">
                    {village.totalStudents.toLocaleString("id-ID")}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <AlertTriangle size={16} />
                    Risiko
                  </div>

                  <p className={`text-2xl font-bold mt-2 ${status.color}`}>
                    {village.highRisk}
                  </p>
                </div>
              </div>

              {/* Progress */}

              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Tingkat Risiko</span>

                  <span className={status.color}>{percentage.toFixed(1)}%</span>
                </div>

                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${status.bg}`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}

      <div className="mt-8 flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-emerald-500" />

          <span className="text-sm text-slate-600">Rendah (&lt;80)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-yellow-500" />

          <span className="text-sm text-slate-600">Sedang (80-129)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-red-500" />

          <span className="text-sm text-slate-600">Tinggi (≥130)</span>
        </div>
      </div>
    </div>
  );
}
