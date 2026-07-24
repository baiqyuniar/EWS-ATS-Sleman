import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Search, FilePlus2, Loader2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getStudents } from "../../services/students.service";
import {
  simulatePrediction,
  getActionablePredictions,
} from "../../services/prediction.service";
import type { Prediction, SimulatePredictionPayload } from "../../types/api";
import { RISK_LABEL } from "../../types/api";
import { RiskBadge } from "../../components/ui/Badge";
import { ErrorAlert } from "../../components/ui/Alert";
import { apiErrorMessage } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

export default function SimulasiPredictionPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<
    Partial<SimulatePredictionPayload>
  >({});
  const [result, setResult] = useState<Prediction | null>(null);

  const { data: studentData, isFetching } = useQuery({
    queryKey: ["students-search", search],
    queryFn: () => getStudents({ search, limit: 8 }),
    enabled: search.length > 1,
  });

  const { data: actionable } = useQuery({
    queryKey: ["predictions-actionable"],
    queryFn: getActionablePredictions,
  });

  const simulateMutation = useMutation({
    mutationFn: (payload: SimulatePredictionPayload) =>
      simulatePrediction(payload),
    onSuccess: (data) => setResult(data),
  });

  const handleSubmit = () => {
    if (!studentId) return;
    setResult(null);
    simulateMutation.mutate({ studentId, ...overrides });
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FORM */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">
                  Simulasi Prediksi Risiko
                </h2>
                <p className="text-sm text-slate-500">
                  Hasil prediksi hanya rekomendasi.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Cari Siswa
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setStudentId(null);
                      setResult(null);
                    }}
                    placeholder="Ketik nama atau NISN siswa..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                {search.length > 1 && !studentId && (
                  <div className="mt-2 border border-slate-100 rounded-2xl divide-y divide-slate-50 max-h-56 overflow-y-auto">
                    {isFetching && (
                      <p className="text-xs text-slate-400 px-4 py-3">
                        Mencari...
                      </p>
                    )}
                    {studentData?.data.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setStudentId(s.id);
                          setSearch(`${s.nama} (${s.nisn})`);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm"
                      >
                        <p className="font-medium text-slate-700">{s.nama}</p>
                        <p className="text-xs text-slate-400">
                          NISN {s.nisn} &middot;{" "}
                          {s.school?.nama ?? "Belum ada sekolah"}
                        </p>
                      </button>
                    ))}
                    {studentData &&
                      studentData.data.length === 0 &&
                      !isFetching && (
                        <p className="text-xs text-slate-400 px-4 py-3">
                          Siswa tidak ditemukan.
                        </p>
                      )}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Fitur numerasi & kode pendidikan/penghasilan orang tua otomatis
                diambil dari data siswa. Isi kolom di bawah hanya jika ingin
                meng-override nilai tersebut untuk simulasi ini saja.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Numerasi (0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    onChange={(e) =>
                      setOverrides({
                        ...overrides,
                        num:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Kode Pendidikan Ayah (0-8)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    onChange={(e) =>
                      setOverrides({
                        ...overrides,
                        kodePendidikanAyah:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Kode Pendidikan Ibu (0-8)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    onChange={(e) =>
                      setOverrides({
                        ...overrides,
                        kodePendidikanIbu:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Kode Penghasilan Ayah (0-6)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    onChange={(e) =>
                      setOverrides({
                        ...overrides,
                        kodePenghasilanAyah:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <ErrorAlert
                message={
                  simulateMutation.isError
                    ? apiErrorMessage(simulateMutation.error)
                    : null
                }
              />

              <button
                onClick={handleSubmit}
                disabled={!studentId || simulateMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition disabled:opacity-50"
              >
                {simulateMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <BrainCircuit size={18} />
                )}
                Jalankan Prediksi
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Hasil Prediksi</h3>
                <RiskBadge value={result.riskCategory} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-500">Probabilitas Risiko</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {result.probabilitas.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-500">Model Dipakai</p>
                  <p className="text-sm font-semibold text-slate-700 mt-2">
                    {result.modelDipakai ?? "-"}
                  </p>
                </div>
              </div>
              {result.alasanRisiko?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Faktor Pendorong Utama
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.alasanRisiko.map((r, i) => (
                      <span
                        key={i}
                        className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(role === "SEKOLAH" || role === "ADMIN") &&
                result.riskCategory !== "RENDAH" && (
                  <button
                    onClick={() =>
                      navigate(
                        `/cases/new/pelaporan?studentId=${result.studentId}&predictionId=${result.id}`,
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl transition"
                  >
                    <FilePlus2 size={18} />
                    Buat Pelaporan Sekolah dari Hasil Ini
                  </button>
                )}
            </div>
          )}
        </div>

        {/* SIDEBAR: actionable list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-1">
              Siswa Perlu Ditindaklanjuti
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Risiko Sedang/Tinggi &amp; belum memiliki Case aktif.
            </p>
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {(actionable ?? []).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {p.student?.nama}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.student?.school?.nama ?? "-"}
                    </p>
                  </div>
                  <RiskBadge value={p.riskCategory} />
                </div>
              ))}
              {actionable && actionable.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">
                  Tidak ada siswa risiko {RISK_LABEL.SEDANG}/{RISK_LABEL.TINGGI}{" "}
                  yang belum ditindaklanjuti.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
