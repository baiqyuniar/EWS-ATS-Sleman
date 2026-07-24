import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileBarChart, Download, Loader2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getRekap,
  getStatistikSekolah,
  getExportRows,
} from "../../services/reports.service";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: rekap, isLoading: loadingRekap } = useQuery({
    queryKey: ["reports-rekap", from, to],
    queryFn: () => getRekap({ from: from || undefined, to: to || undefined }),
  });

  const { data: statistikSekolah } = useQuery({
    queryKey: ["reports-statistik-sekolah"],
    queryFn: getStatistikSekolah,
  });

  const handleExport = async () => {
    const rows = await getExportRows({
      from: from || undefined,
      to: to || undefined,
    });
    const data = Array.isArray(rows) ? rows : ((rows as any)?.data ?? []);
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((r: any) =>
        headers.map((h) => JSON.stringify(r[h] ?? "")).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-ews-aps-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rekapEntries =
    rekap && typeof rekap === "object"
      ? Object.entries(rekap as Record<string, any>)
      : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileBarChart size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Laporan &amp; Rekapitulasi
              </h2>
              <p className="text-sm text-slate-500">
                Rekap kasus, statistik sekolah, dan ekspor data.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
            <span className="text-slate-400 text-sm">s/d</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm"
            >
              <Download size={16} /> Ekspor CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Rekap Kasus</h3>
          {loadingRekap ? (
            <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
              <Loader2 className="animate-spin" size={18} /> Memuat rekap...
            </div>
          ) : rekapEntries.length === 0 ? (
            <p className="text-sm text-slate-400">Data rekap belum tersedia.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rekapEntries.map(([key, value]) => (
                <div key={key} className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {typeof value === "number" ? value : JSON.stringify(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">
            Statistik per Sekolah
          </h3>
          {!statistikSekolah ||
          (Array.isArray(statistikSekolah) && statistikSekolah.length === 0) ? (
            <p className="text-sm text-slate-400">
              Belum ada data statistik sekolah.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    {Object.keys((statistikSekolah as any[])[0] ?? {}).map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-2 font-medium capitalize"
                        >
                          {h.replace(/([A-Z])/g, " $1")}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(statistikSekolah as any[]).map((row, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-4 py-2.5 text-slate-700">
                          {String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
