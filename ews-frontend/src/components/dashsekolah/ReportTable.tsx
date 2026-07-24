import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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

        <button className="text-blue-600 font-semibold hover:text-blue-800">
          Lihat Semua
        </button>
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
        <table className="w-full">
          <thead className="bg-slate-50 text-sm text-slate-500">
            <tr>
              <th className="text-left p-4">Siswa</th>
              <th className="text-left p-4">Kelas</th>
              <th className="text-left p-4">Risiko</th>
              <th className="text-left p-4">Faktor Dominan</th>
              <th className="text-left p-4">Status</th>
              <th className="text-center p-4">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((item) => {
              const style = statusStyle[item.status] ?? statusStyle["Belum Ditindak"];
              return (
                <tr
                  key={item.studentId}
                  className="border-t border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {item.name.charAt(0)}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          NISN {item.nisn}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 font-medium">
                    {item.kelas}
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-red-600">
                      {item.risiko}%
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      {item.factor}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${style.badge}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </td>

                  <td className="text-center p-4">
                    <button className="text-blue-600 font-semibold hover:text-blue-800">
                      Detail
                    </button>
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
