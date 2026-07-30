import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getMonthlyTrend } from "../../services/dashboard.service";

const colors = [
  "#E5E7EB",
  "#CBD5E1",
  "#94A3B8",
  "#64748B",
  "#475569",
  "#334155",
  "#0F2D59",
  "#4B5563",
];

export default function DashboardChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "monthly-trend"],
    queryFn: getMonthlyTrend,
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Tren Anak Putus Sekolah
          </h2>

          <p className="text-sm text-slate-500">
            Analisis bulanan jumlah kasus baru (6 bulan terakhir)
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-3 h-3 rounded-full bg-[#0F2D59]" />
          Kasus Baru
        </div>
      </div>

      {isLoading ? (
        <div className="h-[330px] flex items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mr-2" size={20} /> Memuat data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={330}>
          <BarChart data={data ?? []}>
            <CartesianGrid strokeDasharray="4 4" />

            <XAxis dataKey="label" />

            <YAxis allowDecimals={false} />

            <Tooltip />

            <Bar
              dataKey="kasusBaru"
              radius={[4, 4, 0, 0]}
            >
              {(data ?? []).map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
