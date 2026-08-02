import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Search, FilePlus2, Loader2, Info } from "lucide-react";

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
  // Keterangan skala kode pendidikan/penghasilan/sulingjar — disembunyikan
  // secara default (toggle) supaya form tidak terlalu panjang, tapi bisa dibuka
  // sewaktu-waktu tanpa perlu berpindah halaman/dokumen.
  const [showKodeLegend, setShowKodeLegend] = useState(false);
  const [showSulingjarLegend, setShowSulingjarLegend] = useState(false);

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
                          setSearch(`${s.nama.toUpperCase()} (${s.nisn})`);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm"
                      >
                        <p className="font-medium text-slate-700 uppercase">{s.nama}</p>
                        <p className="text-xs text-slate-400">
                          NISN {s.nisn} &middot;{" "}
                          {s.school?.nama ? s.school.nama.toUpperCase() : "Belum ada sekolah"}
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
  {/* Numerasi */}
  <div>
    <label className="text-xs font-medium text-slate-600 mb-1 block">
      Numerasi (0-100)
    </label>
    <input
      type="number"
      min={0}
      max={100}
      value={overrides.num ?? ""}
      onChange={(e) =>
        setOverrides({
          ...overrides,
          num: e.target.value === "" ? undefined : Number(e.target.value),
        })
      }
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
    />
  </div>

  {/* Pendidikan Ayah */}
  <div>
    <label className="text-xs font-medium text-slate-600 mb-1 block">
      Kode Pendidikan Ayah (0-8)
    </label>
    <input
      type="number"
      min={0}
      max={8}
      value={overrides.kodePendidikanAyah ?? ""}
      onChange={(e) =>
        setOverrides({
          ...overrides,
          kodePendidikanAyah:
            e.target.value === "" ? undefined : Number(e.target.value),
        })
      }
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
    />
  </div>

  {/* Pendidikan Ibu */}
  <div>
    <label className="text-xs font-medium text-slate-600 mb-1 block">
      Kode Pendidikan Ibu (0-8)
    </label>
    <input
      type="number"
      min={0}
      max={8}
      value={overrides.kodePendidikanIbu ?? ""}
      onChange={(e) =>
        setOverrides({
          ...overrides,
          kodePendidikanIbu:
            e.target.value === "" ? undefined : Number(e.target.value),
        })
      }
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
    />
  </div>

  {/* Penghasilan Ayah */}
  <div>
    <label className="text-xs font-medium text-slate-600 mb-1 block">
      Kode Penghasilan Ayah (0-6)
    </label>
    <input
      type="number"
      min={0}
      max={6}
      value={overrides.kodePenghasilanAyah ?? ""}
      onChange={(e) =>
        setOverrides({
          ...overrides,
          kodePenghasilanAyah:
            e.target.value === "" ? undefined : Number(e.target.value),
        })
      }
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
    />
  </div>

  {/* Penghasilan Ibu */}
  <div>
    <label className="text-xs font-medium text-slate-600 mb-1 block">
      Kode Penghasilan Ibu (0-6)
    </label>
    <input
      type="number"
      min={0}
      max={6}
      value={overrides.kodePenghasilanIbu ?? ""}
      onChange={(e) =>
        setOverrides({
          ...overrides,
          kodePenghasilanIbu:
            e.target.value === "" ? undefined : Number(e.target.value),
        })
      }
      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
    />
  </div>
</div>

              {/* Keterangan skala kode pendidikan & penghasilan — nilai persis sama
                  dengan kodeOrdinal di menu Master Data > Pendidikan/Penghasilan
                  Orang Tua, supaya tidak ada dua sumber kebenaran yang beda. */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowKodeLegend((v) => !v)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600"
                >
                  <Info size={14} className="text-blue-500" />
                  {showKodeLegend ? "Sembunyikan" : "Lihat"} keterangan kode pendidikan &amp; penghasilan
                </button>
                {showKodeLegend && (
                  <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-700 mb-1.5">Kode Pendidikan (0-8)</p>
                      <ul className="space-y-0.5">
                        <li>0 = PAUD / Tidak sekolah</li>
                        <li>1 = Putus SD</li>
                        <li>2 = SD / sederajat</li>
                        <li>3 = SMP / sederajat</li>
                        <li>4 = SMA / sederajat / Lainnya</li>
                        <li>5 = D1 / D2 / D3</li>
                        <li>6 = D4 / S1</li>
                        <li>7 = S2 / Sp-1</li>
                        <li>8 = S3</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 mb-1.5">Kode Penghasilan (0-6)</p>
                      <ul className="space-y-0.5">
                        <li>0 = Tidak berpenghasilan</li>
                        <li>1 = &lt; Rp500.000</li>
                        <li>2 = Rp500.000 – Rp999.999</li>
                        <li>3 = Rp1.000.000 – Rp1.999.999</li>
                        <li>4 = Rp2.000.000 – Rp4.999.999</li>
                        <li>5 = Rp5.000.000 – Rp20.000.000</li>
                        <li>6 = &gt; Rp20.000.000</li>
                      </ul>
                    </div>
                    <p className="sm:col-span-2 text-slate-400">
                      Sumber: menu Master Data &rarr; Pendidikan Orang Tua / Penghasilan Orang Tua.
                      Kalau daftar di sana pernah diubah, angka di atas mengikuti data terbaru —
                      cek menu Master Data untuk kepastian.
                    </p>
                  </div>
                )}
              </div>
              {/* ===================================================== */}
{/* ===================================================== */}
{/* MUTU SEKOLAH (SULINGJAR) */}
{/* ===================================================== */}

<div className="mt-6">
  <h3 className="text-sm font-semibold text-slate-700 mb-4">
    Mutu Sekolah (Sulingjar)
  </h3>

  <div className="grid grid-cols-2 gap-4">

    <div>
      <label className="text-xs font-medium text-slate-600 mb-1 block">
        Kesiapsiagaan Bencana (0–3)
      </label>

      <input
        type="number"
        min={0}
        max={3}
        onChange={(e) =>
          setOverrides({
            ...overrides,
            sulingjarD18:
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
            Kualitas Pembelajaran (0–3)
          </label>

          <input
            type="number"
            min={0}
            max={3}
            onChange={(e) =>
              setOverrides({
                ...overrides,
                sulingjarD1:
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
            Refleksi Guru (0–3)
          </label>

          <input
            type="number"
            min={0}
            max={3}
            onChange={(e) =>
              setOverrides({
                ...overrides,
                sulingjarD2:
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
            Iklim Kesetaraan Gender (0–3)
          </label>

          <input
            type="number"
            min={0}
            max={3}
            onChange={(e) =>
              setOverrides({
                ...overrides,
                sulingjarD6:
                  e.target.value === ""
                    ? undefined
                    : Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </div>
      </div>

      {/* Keterangan skala sulingjar — mengikuti kategori umum Asesmen Nasional/
          Rapor Pendidikan Kemendikbud (skor resmi 1,00–3,00: Kurang/Sedang/Baik). */}
      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => setShowSulingjarLegend((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600"
        >
          <Info size={14} className="text-blue-500" />
          {showSulingjarLegend ? "Sembunyikan" : "Lihat"} keterangan skala 0–3
        </button>
        {showSulingjarLegend && (
          <div className="px-4 pb-4 text-xs text-slate-600 space-y-1">
            <p>
              Mengikuti kategori Rapor Pendidikan Kemendikbud (Asesmen Nasional),
              semakin tinggi angka semakin baik:
            </p>
            <ul className="space-y-0.5 pl-1">
              <li><span className="font-semibold">1</span> = Kurang</li>
              <li><span className="font-semibold">2</span> = Sedang</li>
              <li><span className="font-semibold">3</span> = Baik</li>
            </ul>
            <p className="text-slate-400">
              Skor resmi Rapor Pendidikan berbentuk desimal 1,00–3,00; di sistem ini
              disederhanakan menjadi bilangan bulat 0–3 untuk kebutuhan model ML.
              Kalau data sekolah untuk indikator ini belum ada, kolom akan kosong
              (bukan otomatis terisi 0).
            </p>
          </div>
        )}
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
                    <p className="text-sm font-medium text-slate-700 truncate uppercase">
                      {p.student?.nama}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.student?.school?.nama ? p.student.school.nama.toUpperCase() : "-"}
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
