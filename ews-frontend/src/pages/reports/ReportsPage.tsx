import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, FileBarChart, Info } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getRekap,
  getStatistikSekolah,
  getExportRows,
} from "../../services/reports.service";
import type { CaseStatus, CaseSource } from "../../types/api";

// Label untuk halaman Laporan sengaja dibuat berbeda dari CASE_STATUS_LABEL di
// types/api.ts (yang masih pakai kode "S01"-"S10" untuk kebutuhan teknis di
// papan Kanban). Di sini kalimatnya dibuat sesederhana mungkin supaya bisa
// dibaca orang awam (mis. Kepala Sekolah, OPD, warga) tanpa perlu tahu istilah
// internal sistem — dan diurutkan sesuai alur penanganan kasus yang sebenarnya,
// bukan urutan acak dari database.
const STATUS_URUTAN: { status: CaseStatus; label: string; deskripsi: string }[] = [
  { status: "DRAFT", label: "Draf (belum dikirim)", deskripsi: "Laporan baru diketik, belum dikirim ke sistem." },
  { status: "CASE_CREATED", label: "Kasus baru dibuat", deskripsi: "Laporan sudah masuk & tercatat sebagai kasus." },
  { status: "VERIFIKASI_NIK", label: "Verifikasi data anak (NIK)", deskripsi: "Sekolah sedang mengecek kebenaran data anak." },
  { status: "HOME_VISIT", label: "Kunjungan ke rumah", deskripsi: "Sekolah mengunjungi rumah anak untuk mencari tahu penyebabnya." },
  { status: "SELESAI_PENCEGAHAN", label: "Selesai — anak kembali bersekolah", deskripsi: "Anak berhasil diyakinkan kembali sekolah, kasus selesai di tahap sekolah." },
  { status: "MENUNGGU_RUJUKAN", label: "Menunggu dirujuk ke dinas terkait", deskripsi: "Anak belum kembali sekolah, menunggu dirujuk untuk penanganan lebih lanjut." },
  { status: "DIRUJUK_OPD", label: "Sudah dirujuk ke dinas terkait", deskripsi: "Kasus sudah diteruskan ke dinas/OPD yang berwenang menangani." },
  { status: "INTERVENSI_BERJALAN", label: "Sedang ditangani", deskripsi: "Dinas terkait sedang memberikan bantuan/penanganan ke anak & keluarga." },
  { status: "VERIFIKASI_PENYELESAIAN", label: "Verifikasi hasil penanganan", deskripsi: "Mengecek apakah penanganan sudah membuahkan hasil." },
  { status: "MONITORING", label: "Dipantau setelah ditangani", deskripsi: "Anak dipantau berkala untuk memastikan tetap bersekolah." },
  { status: "CLOSED_CASE", label: "Kasus selesai/ditutup", deskripsi: "Seluruh proses penanganan sudah selesai." },
];

const SUMBER_LABEL: Record<CaseSource, string> = {
  PELAPORAN_SEKOLAH: "Dilaporkan oleh Sekolah",
  PENGADUAN_MASYARAKAT: "Pengaduan dari Masyarakat",
};

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

  // Jumlah kasus per status/sumber, dicocokkan ke tabel label di atas — status
  // yang tidak ada datanya (0 kasus) tetap ditampilkan supaya urutan alur selalu
  // lengkap & mudah diikuti, bukan cuma status yang kebetulan ada datanya.
  const jumlahPerStatus = (status: CaseStatus) =>
    rekap?.byStatus.find((s) => s.status === status)?._count ?? 0;
  const jumlahPerSumber = (source: CaseSource) =>
    rekap?.bySource.find((s) => s.source === source)?._count ?? 0;
  const totalKasus = rekap?.total ?? 0;
  const statusTerbanyak = [...STATUS_URUTAN]
    .map((s) => ({ ...s, jumlah: jumlahPerStatus(s.status) }))
    .sort((a, b) => b.jumlah - a.jumlah)[0];

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
                Ringkasan jumlah kasus anak putus sekolah berdasarkan periode waktu.
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
            ) : totalKasus === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                Belum ada kasus pada periode yang dipilih.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ringkasan singkat berbahasa awam di paling atas */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
                  <FileBarChart className="text-blue-500 shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Ada <span className="font-bold">{totalKasus} kasus</span> anak
                    berisiko putus sekolah yang tercatat pada periode ini.
                    {statusTerbanyak && statusTerbanyak.jumlah > 0 && (
                      <>
                        {" "}Paling banyak berada pada tahap{" "}
                        <span className="font-bold">
                          &ldquo;{statusTerbanyak.label.toLowerCase()}&rdquo;
                        </span>{" "}
                        ({statusTerbanyak.jumlah} kasus).
                      </>
                    )}
                  </p>
                </div>

                {/* Berdasarkan sumber laporan */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Dari Mana Kasus Ini Berasal?
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(Object.keys(SUMBER_LABEL) as CaseSource[]).map((source) => {
                      const jumlah = jumlahPerSumber(source);
                      const persen = totalKasus > 0 ? Math.round((jumlah / totalKasus) * 100) : 0;
                      return (
                        <div
                          key={source}
                          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <p className="text-xs font-medium text-slate-500">
                            {SUMBER_LABEL[source]}
                          </p>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-800">{jumlah}</span>
                            <span className="text-xs text-slate-400">kasus ({persen}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Berdasarkan tahap penanganan — urut sesuai alur, bukan acak */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Sedang di Tahap Mana Kasus-Kasus Ini?
                  </h4>
                  <div className="space-y-2">
                    {STATUS_URUTAN.map(({ status, label, deskripsi }) => {
                      const jumlah = jumlahPerStatus(status);
                      const persen = totalKasus > 0 ? Math.round((jumlah / totalKasus) * 100) : 0;
                      return (
                        <div
                          key={status}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-700">{label}</p>
                            <p className="text-xs text-slate-400">{deskripsi}</p>
                          </div>
                          <div className="w-28 shrink-0">
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${persen}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 shrink-0 text-right">
                            <span className="text-sm font-bold text-slate-800">{jumlah}</span>
                            <span className="text-xs text-slate-400"> ({persen}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-bold text-slate-800">
              Jumlah Kasus per Sekolah
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
            <Info size={13} className="text-slate-400" />
            NPSN adalah nomor identitas resmi sekolah dari Dapodik (Kemendikbud) —
            bisa dicek ulang lewat NPSN ini, bukan nomor internal sistem.
          </p>
          {!statistikSekolah || statistikSekolah.length === 0 ? (
            <p className="text-sm text-slate-400">
              Belum ada data kasus per sekolah.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="px-4 py-2 font-medium">NPSN</th>
                    <th className="px-4 py-2 font-medium">Nama Sekolah</th>
                    <th className="px-4 py-2 font-medium">Total Kasus (Sepanjang Waktu)</th>
                    <th className="px-4 py-2 font-medium">Kasus yang Masih Ditangani</th>
                  </tr>
                </thead>
                <tbody>
                  {[...statistikSekolah]
                    .sort((a, b) => b.total - a.total)
                    .map((row) => (
                      <tr key={row.npsn} className="border-b border-slate-50">
                        <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{row.npsn}</td>
                        <td className="px-4 py-2.5 text-slate-700 font-medium uppercase">{row.nama}</td>
                        <td className="px-4 py-2.5 text-slate-700">{row.total} kasus</td>
                        <td className="px-4 py-2.5">
                          {row.aktif > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1">
                              {row.aktif} masih ditangani
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1">
                              Semua sudah selesai
                            </span>
                          )}
                        </td>
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
