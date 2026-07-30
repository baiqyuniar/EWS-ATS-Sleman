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
      <div className="flex justify-between items-center p-6 border-b">
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
  Lihat Semua Laporan
</Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={20} /> Memuat data...
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">
          Belum ada kasus tercatat.
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="text-left p-4">Nama Siswa</th>
              <th className="text-left p-4">Wilayah</th>
              <th className="text-left p-4">Kategori</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((item) => {
              const style = statusStyle[item.statusColor] ?? statusStyle.slate;
              return (
                <tr
                  key={item.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                        {item.studentName.charAt(0)}
                      </div>

                      <div>
                        <p className="font-semibold">
                          {item.studentName}
                        </p>

                        <p className="text-xs text-slate-500">
                          NIK {item.nikMasked}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    {item.wilayah}
                  </td>

                  <td className="p-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${style.badge}`}
                    >
                      {item.category}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${style.dot}`}
                      />

                      {item.status}
                    </div>
                  </td>

                  
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
