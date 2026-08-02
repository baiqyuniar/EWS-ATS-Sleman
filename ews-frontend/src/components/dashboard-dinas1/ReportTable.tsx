import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getRecentCases } from "../../services/dashboard.service";

const statusStyle: Record<string, { badge: string; dot: string }> = {
  red: { badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  yellow: { badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  blue: { badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  green: { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  slate: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
};

export default function ReportTable() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["dashboard", "recent-cases"],
    queryFn: getRecentCases,
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Aduan & Laporan Terbaru
          </h2>

          <p className="text-sm text-slate-500">
            Kasus yang paling baru dibuat/diperbarui
          </p>
        </div>

        <Link
          to="/cases"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          Lihat Semua
        </Link>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={20} />
          Memuat data...
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">
          Belum ada kasus tercatat.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {reports.map((item) => {
            const style =
              statusStyle[item.statusColor] ?? statusStyle.slate;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50 transition"
              >
                {/* Left */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700 shrink-0">
                    {item.studentName.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate uppercase">
                      {item.studentName}
                    </p>

                    <p className="text-xs text-slate-500 truncate">
                      {item.wilayah}
                    </p>

                    <p className="text-xs text-slate-400">
                      NIK {item.nikMasked}
                    </p>
                  </div>
                </div>

                {/* Center */}
                <div className="hidden lg:flex flex-col items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${style.badge}`}
                  >
                    {item.category}
                  </span>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div
                      className={`w-2 h-2 rounded-full ${style.dot}`}
                    />

                    <span>{item.status}</span>
                  </div>
                </div>

                {/* Right */}
                <Link
                  to={`/cases/${item.id}`}
                  className="shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
                >
                  Detail
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}