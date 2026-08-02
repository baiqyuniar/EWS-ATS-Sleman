import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {Link} from "react-router-dom";
import { getTopRiskStudents } from "../../services/dashboard.service";

const statusStyle: Record<string, { badge: string; dot: string }> = {
  "Belum Ditindak": { badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  "Dalam Pendampingan": { badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  Selesai: { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
};

export default function ReportTable() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["dashboard", "top-risk-students"],
    queryFn: getTopRiskStudents,
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Siswa Prioritas Intervensi
          </h2>

          <p className="text-sm text-slate-500">
            Daftar siswa dengan risiko tertinggi di sekolah
          </p>
        </div>

        <Link
  to="/cases"
  className="text-sm font-semibold text-blue-700 hover:text-blue-900"
>
  Lihat Semua Laporan
</Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={20} /> Memuat data...
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">
          Belum ada data prediksi risiko untuk sekolah ini.
        </div>
      ) : (
  <div className="divide-y divide-slate-100">
    {reports.map((item) => {
      const style =
        statusStyle[item.status] ??
        statusStyle["Belum Ditindak"];

      return (
        <div
          key={item.studentId}
          className="p-5 hover:bg-slate-50 transition"
        >
          <div className="flex items-start justify-between gap-4">

            {/* Left */}
            <div className="flex items-start gap-3 flex-1 min-w-0">

              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0">
                {item.name.charAt(0)}
              </div>

              <div className="min-w-0 flex-1">

                <h3 className="font-semibold text-slate-800 truncate uppercase">
                  {item.name}
                </h3>

                <p className="text-xs text-slate-500">
                  NISN {item.nisn}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-3">

                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                    {item.kelas}
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
                    {item.factor}
                  </span>

                </div>

              </div>
            </div>

            {/* Right */}
            <div className="text-right shrink-0">

              <p className="text-xs text-slate-500">
                Risiko
              </p>

              <p className="text-2xl font-bold text-red-600">
                {item.risiko}%
              </p>

            </div>

          </div>

          {/* Bottom */}
          <div className="flex items-center justify-between mt-4">

            <div className="flex items-center gap-2">

              <div
                className={`w-2.5 h-2.5 rounded-full ${style.dot}`}
              />

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${style.badge}`}
              >
                {item.status}
              </span>

            </div>

            <Link
              to={`/cases/${item.studentId}`}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Detail →
            </Link>

          </div>
        </div>
      );
    })}
  </div>
      )}
    </div>
  );
}