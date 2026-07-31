import {
  MapPin,
  Users,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getKapanewonHeatmap } from "../../services/dashboard.service";
import { useState } from "react";

type Props = {
  expanded: boolean;
};

export default function VillageHeatmap({ expanded }: Props) {
  const [mode] = useState<"residence" | "school">("residence");

const { data: villages = [], isLoading } = useQuery({
  queryKey: ["dashboard", "kapanewon-heatmap", mode],
  queryFn: () => getKapanewonHeatmap(mode),
});

  const displayedVillages = expanded
    ? villages ?? []
    : (villages ?? []).slice(0, 3);

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

  const getPercentage = (
    highRisk: number,
    totalStudents: number
  ) => {
    return totalStudents > 0
      ? (highRisk / totalStudents) * 100
      : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={20} />
        Memuat data...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedVillages.map((village) => {
        const percentage = getPercentage(village.highRisk, village.totalStudents);
        const status = getStatus(percentage);

        return (
          <div
            key={village.name}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white px-5 py-4 hover:border-blue-200 hover:shadow-sm transition"
          >
    {/* Nama Kapanewon */}
    <div className="flex items-center gap-3 lg:w-64">
      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
        <MapPin size={18} className="text-blue-600" />
      </div>

      <div>
        <h3 className="font-semibold text-slate-800">
          {village.name}
        </h3>

        <p className="text-xs text-slate-500">
          {village.totalStudents.toLocaleString("id-ID")} siswa
        </p>
      </div>
    </div>

    {/* Progress */}
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-500">
          Tingkat Risiko
        </span>

        <span className={`font-semibold ${status.color}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`${status.bg} h-full rounded-full`}
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>
    </div>

    {/* Statistik */}
    <div className="flex items-center justify-between lg:justify-end gap-8 lg:w-64">

      <div className="text-center">
        <Users
          size={16}
          className="mx-auto text-slate-400 mb-1"
        />

        <p className="text-xs text-slate-500">
          Total
        </p>

        <p className="font-bold text-slate-800">
          {village.totalStudents}
        </p>
      </div>

      <div className="text-center">
        <AlertTriangle
          size={16}
          className={`mx-auto mb-1 ${status.color}`}
        />

        <p className="text-xs text-slate-500">
          Risiko
        </p>

        <p className={`font-bold ${status.color}`}>
          {village.highRisk}
        </p>
      </div>

      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${status.badge}`}
      >
        {status.text}
      </span>

    </div>
  </div>
        );
      })}
    </div>
  );
}