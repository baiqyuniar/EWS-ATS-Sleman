import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";

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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Rekap Kasus
            </h3>
            <p className="text-sm text-slate-500">
              Ringkasan statistik kasus berdasarkan periode.
            </p>
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
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Download size={16} />
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* Rekap */}
        <div className="mt-6">
          {loadingRekap ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
              <Loader2 className="animate-spin" size={18} />
              Memuat rekap...
            </div>
          ) : rekapEntries.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Data rekap belum tersedia.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rekapEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:shadow-sm"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {key.replace(/([A-Z])/g, " $1")}
                  </p>

                  <div className="mt-2">
                    {Array.isArray(value) ? (
                      value.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="text-sm font-semibold text-slate-700"
                        >
                          {(item.status ?? item.source)
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/\b\w/g, (c: string) =>
                              c.toUpperCase()
                            )}
                        </div>
                      ))
                    ) : (
                      <span className="text-3xl font-bold text-slate-800">
                        {value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
