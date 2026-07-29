import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserX, Search, Loader2, Send } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import Modal from "../../components/ui/Modal";
import Pagination from "../../components/ui/Pagination";
import EmptyState from "../../components/ui/EmptyState";
import { ErrorAlert } from "../../components/ui/Alert";
import { AssignmentStatusBadge, RiskBadge } from "../../components/ui/Badge";
import { apiErrorMessage } from "../../lib/api";
import { getStudents } from "../../services/students.service";
import { createDoStudentReferral } from "../../services/referral.service";
import { opdApi, riskFactorsApi } from "../../services/master.service";
import type { RiskCategory, Student } from "../../types/api";
import { RISK_LABEL } from "../../types/api";

export default function StudentDoListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<Student | null>(null);
  const [form, setForm] = useState<{
    opdId: string;
    riskFactorId: string;
    tingkatRisiko: RiskCategory | "";
    catatan: string;
  }>({
    opdId: "",
    riskFactorId: "",
    tingkatRisiko: "",
    catatan: "",
  });
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["students-do", page, search],
    queryFn: () =>
      getStudents({ page, limit: 10, search, status: "PUTUS_SEKOLAH" }),
  });

  const { data: opdData } = useQuery({
    queryKey: ["master-opd-options"],
    queryFn: () => opdApi.list({ limit: 200 }),
  });
  const { data: riskFactorData } = useQuery({
    queryKey: ["master-risk-factor-options"],
    queryFn: () => riskFactorsApi.list({ limit: 200 }),
  });

  const openReferral = (student: Student) => {
    setTarget(student);
    setForm({ opdId: "", riskFactorId: "", tingkatRisiko: "", catatan: "" });
    setFormError("");
  };

  const referralMutation = useMutation({
    mutationFn: async () => {
      if (!target) return;
      if (!form.opdId || !form.tingkatRisiko) {
        throw new Error("OPD tujuan dan tingkat risiko wajib diisi");
      }
      return createDoStudentReferral(target.id, {
        opdId: Number(form.opdId),
        tingkatRisiko: form.tingkatRisiko as RiskCategory,
        riskFactorId: form.riskFactorId ? Number(form.riskFactorId) : undefined,
        catatan: form.catatan || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students-do"] });
      setTarget(null);
    },
    onError: (err) =>
      setFormError(apiErrorMessage(err, "Gagal membuat rujukan")),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const opdOptions = opdData?.data ?? [];
  const riskFactorOptions = riskFactorData?.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-sm">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama / NISN / NIK siswa..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={20} /> Memuat data...
            </div>
          ) : isError ? (
            <div className="p-6">
              <ErrorAlert message="Gagal memuat data dari server. Pastikan backend berjalan." />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={UserX}
              title="Belum ada siswa Putus Sekolah"
              description="Siswa berstatus Putus Sekolah akan muncul di sini."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="px-6 py-3 font-medium">NISN</th>
                    <th className="px-6 py-3 font-medium">Nama</th>
                    <th className="px-6 py-3 font-medium">Sekolah Asal</th>
                    <th className="px-6 py-3 font-medium">
                      Alasan DO (Data Dapodik)
                    </th>
                    <th className="px-6 py-3 font-medium">
                      Rujukan DO Terakhir
                    </th>
                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const latestReferral = r.referrals?.[0];
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-slate-50 hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-3.5 font-mono text-xs text-slate-500">
                          {r.nisn}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-800">
                          {r.nama}
                        </td>
                        <td className="px-6 py-3.5">
                          {r.school?.nama || (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {r.alasanDoRiskFactor ? (
                            <div>
                              <p className="text-xs font-medium text-slate-700">
                                {r.alasanDoRiskFactor.nama}
                              </p>
                              {r.alasanDoKeterangan && (
                                <p className="text-xs text-slate-400">
                                  {r.alasanDoKeterangan}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {latestReferral ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-slate-600">
                                {latestReferral.opd?.nama}
                              </span>
                              <RiskBadge value={latestReferral.tingkatRisiko} />
                              <AssignmentStatusBadge
                                value={latestReferral.status}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Belum dirujuk
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => openReferral(r)}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition"
                          >
                            <Send size={14} />
                            Rujuk ke OPD
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              onChange={setPage}
            />
          )}
        </div>
      </div>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={`Rujuk ${target?.nama ?? "Siswa"} ke OPD`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            referralMutation.mutate();
          }}
          className="space-y-4"
        >
          <ErrorAlert message={formError} />
          <p className="text-xs text-slate-500 bg-slate-50 rounded-2xl px-4 py-3">
            Rujukan ini berlaku langsung untuk siswa berstatus Putus Sekolah
            (DO), tanpa melalui alur Kasus. OPD tujuan akan menerima notifikasi
            dan dapat melakukan verifikasi, intervensi, serta mencatat progres
            penanganan.
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              OPD Tujuan <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.opdId}
              onChange={(e) => setForm({ ...form, opdId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Pilih OPD</option>
              {opdOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Tingkat Risiko <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.tingkatRisiko}
              onChange={(e) =>
                setForm({
                  ...form,
                  tingkatRisiko: e.target.value as RiskCategory,
                })
              }
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Pilih Tingkat Risiko</option>
              {Object.entries(RISK_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Faktor Risiko
            </label>
            <select
              value={form.riskFactorId}
              onChange={(e) =>
                setForm({ ...form, riskFactorId: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">Pilih Faktor Risiko (opsional)</option>
              {riskFactorOptions.map((rf) => (
                <option key={rf.id} value={rf.id}>
                  {rf.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Catatan
            </label>
            <textarea
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              rows={3}
              placeholder="Catatan tambahan untuk OPD (opsional)"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <button
            type="submit"
            disabled={referralMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition disabled:opacity-60"
          >
            {referralMutation.isPending ? "Mengirim..." : "Kirim Rujukan"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
