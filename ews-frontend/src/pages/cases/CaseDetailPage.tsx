import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Home,
  Building2,
  ClipboardList,
  ShieldCheck,
  Eye as EyeIcon,
  Users2,
  Lock,
  RotateCcw,
  Loader2,
  Plus,
  CheckCircle2,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getCase,
  getCaseTimeline,
  verifikasiNik,
  verifikasiPengaduan,
} from "../../services/cases.service";
import { createHomeVisit } from "../../services/home-visit.service";
import { createReferral } from "../../services/referral.service";
import {
  createMonitoring,
  closeCase,
  reopenCase,
} from "../../services/monitoring.service";
import { opdApi, riskFactorsApi } from "../../services/master.service";
import { useAuth } from "../../hooks/useAuth";
import { apiErrorMessage } from "../../lib/api";
import {
  CaseStatusBadge,
  CaseSourceBadge,
  RiskBadge,
  AssignmentStatusBadge,
} from "../../components/ui/Badge";
import { ErrorAlert, SuccessAlert } from "../../components/ui/Alert";
import Modal from "../../components/ui/Modal";
import CaseTimeline from "../../components/cases/CaseTimeline";
import FileUploadField from "../../components/cases/FileUploadField";
import {
  VerifyReferralButton,
  InterventionCreatePanel,
  InterventionResultForm,
  SubmitCompletionButton,
  ReviewPanel,
} from "../../components/cases/ReferralActionPanels";
import { HOME_VISIT_RESULT_LABEL, RISK_LABEL } from "../../types/api";
import type {
  HomeVisitResult,
  RiskCategory,
  Referral,
  Case,
  UserRole,
} from "../../types/api";

export default function CaseDetailPage() {
  const { id } = useParams();
  const caseId = Number(id);
  const navigate = useNavigate();
  const { role } = useAuth();
  const qc = useQueryClient();

  const { data: kase, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => getCase(caseId),
    enabled: !!caseId,
  });
  const { data: timeline } = useQuery({
    queryKey: ["case-timeline", caseId],
    queryFn: () => getCaseTimeline(caseId),
    enabled: !!caseId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["case", caseId] });
    qc.invalidateQueries({ queryKey: ["case-timeline", caseId] });
  };

  if (isLoading || !kase) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Loader2 className="animate-spin" size={20} /> Memuat detail kasus...
        </div>
      </DashboardLayout>
    );
  }

  // Admin bersifat read-only untuk Kasus (hanya mastering & monitoring data) — semua panel
  // aksi (verifikasi, home visit, rujukan, intervensi, review, monitoring) tidak ditampilkan.
  const isAdmin = false;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/cases")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Kasus
        </button>

        {/* HEADER */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-semibold text-blue-700">
                {kase.nomorKasus}
              </p>
              <h1 className="text-xl font-bold text-slate-800 mt-1">
                {kase.student?.nama}
              </h1>
              <p className="text-sm text-slate-500">
                NISN {kase.student?.nisn} &middot;{" "}
                {kase.student?.school?.nama ?? "-"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <CaseStatusBadge value={kase.status} />
              <CaseSourceBadge value={kase.source} />
            </div>
          </div>
          {kase.catatan && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-2xl px-4 py-3 mt-4">
              {kase.catatan}
            </p>
          )}
        </div>

        {kase.status === "SELESAI_PENCEGAHAN" && (
          <SuccessAlert message="Siswa kembali ke sekolah — kasus pencegahan selesai (BR-08). Tidak dilanjutkan ke tahap penanganan." />
        )}
        {kase.status === "CLOSED_CASE" && (
          <div className="bg-slate-800 text-white rounded-3xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock size={20} />
              <div>
                <p className="font-semibold">Kasus Ditutup (Closed Case)</p>
                <p className="text-sm text-slate-300">
                  {kase.closedAt &&
                    new Date(kase.closedAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                </p>
              </div>
            </div>
            {(role === "DINAS_PENDIDIKAN" || isAdmin) && (
              <ReopenButton caseId={caseId} onDone={invalidate} />
            )}
          </div>
        )}

        {/* REPORT INFO */}
        {kase.report && (
          <Section icon={ClipboardList} title="Informasi Pelaporan / Pengaduan">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {kase.source === "PELAPORAN_SEKOLAH" ? (
                <>
                  <Field label="Isi Laporan" value={kase.report.isiLaporan} />
                  <Field
                    label="Status Verifikasi NIK"
                    value={
                      kase.report.nikVerified
                        ? "Terverifikasi"
                        : "Belum diverifikasi"
                    }
                  />
                </>
              ) : (
                <>
                  <Field label="Nama Pelapor" value={kase.report.namaPelapor} />
                  <Field
                    label="Kontak Pelapor"
                    value={kase.report.kontakPelapor}
                  />
                  <Field
                    label="Cara Pengaduan"
                    value={kase.report.caraPengaduan}
                  />
                  <Field label="Kondisi Awal" value={kase.report.kondisiAwal} />
                  <Field label="Isi Pengaduan" value={kase.report.isiLaporan} />
                  <Field
                    label="Validasi Identitas"
                    value={
                      kase.report.validasiIdentitas
                        ? "Valid"
                        : "Belum divalidasi"
                    }
                  />
                </>
              )}
            </dl>
          </Section>
        )}

        {/* VERIFIKASI NIK (Pelaporan Sekolah) */}
        {kase.status === "CASE_CREATED" &&
          kase.source === "PELAPORAN_SEKOLAH" &&
          (role === "SEKOLAH" || isAdmin) && (
            <VerifikasiNikPanel caseId={caseId} onDone={invalidate} />
          )}

        {/* VERIFIKASI PENGADUAN (Kapanewon) */}
        {kase.status === "CASE_CREATED" &&
          kase.source === "PENGADUAN_MASYARAKAT" &&
          (role === "KAPANEWON" || isAdmin) && (
            <VerifikasiPengaduanPanel caseId={caseId} onDone={invalidate} />
          )}

        {/* HOME VISIT */}
        {(kase.homeVisits?.length ?? 0) > 0 ||
        ["VERIFIKASI_NIK", "HOME_VISIT"].includes(kase.status) ? (
          <Section icon={Home} title="Home Visit oleh Sekolah">
            <div className="space-y-3 mb-4">
              {(kase.homeVisits ?? []).map((hv) => (
                <div
                  key={hv.id}
                  className="border border-slate-100 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">
                      Kunjungan ke-{hv.visitNumber} &middot;{" "}
                      {new Date(hv.tanggal).toLocaleDateString("id-ID")}
                    </p>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {HOME_VISIT_RESULT_LABEL[hv.hasil]}
                    </span>
                  </div>
                  {hv.catatan && (
                    <p className="text-sm text-slate-500 mt-1">{hv.catatan}</p>
                  )}
                  {hv.fotos && hv.fotos.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {hv.fotos.map((f) => (
                        <a
                          key={f.id}
                          href={
                            f.fileUrl.startsWith("http") ? f.fileUrl : f.fileUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 underline"
                        >
                          Lihat Foto
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(kase.homeVisits?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-400">Belum ada kunjungan.</p>
              )}
            </div>
            {["VERIFIKASI_NIK", "HOME_VISIT"].includes(kase.status) &&
              (role === "SEKOLAH" || isAdmin) && (
                <HomeVisitPanel caseId={caseId} onDone={invalidate} />
              )}
          </Section>
        ) : null}

        {/* REFERRAL */}
        {kase.status === "MENUNGGU_RUJUKAN" &&
          (role === "KAPANEWON" || isAdmin) &&
          !kase.referrals?.length && (
            <ReferralPanel caseId={caseId} onDone={invalidate} />
          )}

        {(kase.referrals ?? []).map((referral) => (
          <ReferralCard
            key={referral.id}
            referral={referral}
            kase={kase}
            role={role}
            isAdmin={isAdmin}
            invalidate={invalidate}
          />
        ))}

        {/* MONITORING */}
        {(kase.status === "MONITORING" ||
          (kase.monitorings?.length ?? 0) > 0) && (
          <Section icon={Users2} title="Monitoring Dinas Pendidikan">
            <div className="space-y-2 mb-4">
              {(kase.monitorings ?? []).map((m) => (
                <div
                  key={m.id}
                  className="text-sm bg-slate-50 rounded-xl px-4 py-2.5"
                >
                  <p className="text-slate-700">{m.catatan}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {m.petugas?.name} &middot;{" "}
                    {new Date(m.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              ))}
              {(kase.monitorings?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-400">
                  Belum ada catatan monitoring.
                </p>
              )}
            </div>
            {kase.status === "MONITORING" &&
              (role === "DINAS_PENDIDIKAN" || isAdmin) && (
                <MonitoringPanel caseId={caseId} onDone={invalidate} />
              )}
          </Section>
        )}

        {/* TIMELINE */}
        <Section icon={EyeIcon} title="Riwayat Kasus (Timeline)">
          <CaseTimeline entries={timeline ?? []} />
        </Section>
      </div>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon size={18} className="text-blue-600" />
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value || "-"}</dd>
    </div>
  );
}

// ---------------- Verifikasi NIK ----------------
function VerifikasiNikPanel({
  caseId,
  onDone,
}: {
  caseId: number;
  onDone: () => void;
}) {
  const [catatan, setCatatan] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      verifikasiNik(caseId, {
        nikVerified: true,
        catatan: catatan || undefined,
      }),
    onSuccess: onDone,
  });
  return (
    <Section icon={ShieldCheck} title="Verifikasi NIK ke Pusdatin">
      <p className="text-sm text-slate-500 mb-3">
        Sistem mencocokkan NIK siswa dengan data Pusdatin. Jika NIK belum
        terdaftar, lengkapi dahulu data siswa di menu{" "}
        <span className="font-medium">Daftar Siswa</span> sebelum memverifikasi.
      </p>
      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan (opsional)"
        rows={2}
        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm mb-3"
      />
      <ErrorAlert
        message={mutation.isError ? apiErrorMessage(mutation.error) : null}
      />
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm disabled:opacity-50"
      >
        <CheckCircle2 size={16} /> Konfirmasi NIK Terverifikasi
      </button>
    </Section>
  );
}

// ---------------- Verifikasi Pengaduan ----------------
function VerifikasiPengaduanPanel({
  caseId,
  onDone,
}: {
  caseId: number;
  onDone: () => void;
}) {
  const [koordinasiSekolah, setKoordinasiSekolah] = useState("");
  const [catatan, setCatatan] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      verifikasiPengaduan(caseId, {
        validasiIdentitas: true,
        koordinasiSekolah: koordinasiSekolah || undefined,
        catatan: catatan || undefined,
      }),
    onSuccess: onDone,
  });
  return (
    <Section icon={ShieldCheck} title="Verifikasi Awal oleh Kapanewon">
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Koordinasi dengan Sekolah (opsional)
          </label>
          <textarea
            value={koordinasiSekolah}
            onChange={(e) => setKoordinasiSekolah(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
          />
        </div>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan (opsional)"
          rows={2}
          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
        />
        <ErrorAlert
          message={mutation.isError ? apiErrorMessage(mutation.error) : null}
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm disabled:opacity-50"
        >
          <CheckCircle2 size={16} /> Validasi Identitas & Lanjutkan ke Rujukan
        </button>
      </div>
    </Section>
  );
}

// ---------------- Home Visit ----------------
function HomeVisitPanel({
  caseId,
  onDone,
}: {
  caseId: number;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [hasil, setHasil] = useState<HomeVisitResult>("BELUM_SELESAI");
  const [catatan, setCatatan] = useState("");
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      createHomeVisit(caseId, {
        tanggal,
        hasil,
        catatan: catatan || undefined,
        fotoUrls,
      }),
    onSuccess: () => {
      onDone();
      setOpen(false);
      setCatatan("");
      setFotoUrls([]);
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-2xl px-4 py-2.5 hover:bg-blue-50"
      >
        <Plus size={16} /> Catat Home Visit
      </button>
    );
  }

  return (
    <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Tanggal Kunjungan
          </label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Hasil / Progres Terakhir
          </label>
          <select
            value={hasil}
            onChange={(e) => setHasil(e.target.value as HomeVisitResult)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
          >
            {Object.entries(HOME_VISIT_RESULT_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>
      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan hasil kunjungan..."
        rows={2}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
      />
      <FileUploadField
        label="Bukti Foto Home Visit (wajib)"
        urls={fotoUrls}
        onChange={setFotoUrls}
        accept="image/*"
        required
      />
      <ErrorAlert
        message={mutation.isError ? apiErrorMessage(mutation.error) : null}
      />
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600"
        >
          Batal
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={fotoUrls.length === 0 || mutation.isPending}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? "Menyimpan..." : "Simpan Home Visit"}
        </button>
      </div>
    </div>
  );
}

// Satu kartu per OPD tujuan rujukan (mendukung multi-OPD — beberapa kartu bisa
// tampil sekaligus untuk satu Case).
function ReferralCard({
  referral,
  kase,
  role,
  isAdmin,
  invalidate,
}: {
  referral: Referral;
  kase: Case;
  role: UserRole | null;
  isAdmin: boolean;
  invalidate: () => void;
}) {
  return (
    <Section
      icon={Building2}
      title={`Rujukan & Intervensi — ${referral.opd.nama}`}
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-sm font-semibold text-slate-700">
          {referral.opd.nama}
        </span>
        <RiskBadge value={referral.tingkatRisiko} />
        <AssignmentStatusBadge value={referral.status} />
      </div>
      {referral.catatan && (
        <p className="text-sm text-slate-500 mb-4">{referral.catatan}</p>
      )}

      <div className="space-y-3">
        {(referral.interventions ?? []).map((iv) => (
          <div key={iv.id} className="border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                {iv.interventionType?.nama ?? "Intervensi"}
              </p>
              <span className="text-xs text-slate-400">
                {new Date(iv.tanggal).toLocaleDateString("id-ID")}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{iv.deskripsi}</p>
            {iv.hasil ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 mt-2">
                Hasil: {iv.hasil}
              </p>
            ) : role === "OPD" || isAdmin ? (
              <InterventionResultForm
                interventionId={iv.id}
                onDone={invalidate}
              />
            ) : (
              <p className="text-xs text-amber-600 mt-2">
                Hasil belum diisi (BR-16)
              </p>
            )}
          </div>
        ))}
      </div>

      {referral.status === "MENUNGGU" && role === "OPD" && (
        <VerifyReferralButton referralId={referral.id} onDone={invalidate} />
      )}

      {["DIRUJUK_OPD", "INTERVENSI_BERJALAN"].includes(kase.status) &&
        role === "OPD" && (
          <InterventionCreatePanel
            referralId={referral.id}
            onDone={invalidate}
          />
        )}

      {kase.status === "INTERVENSI_BERJALAN" && role === "OPD" && (
        <SubmitCompletionButton referralId={referral.id} onDone={invalidate} />
      )}

      {referral.reviews && referral.reviews.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500">
            Riwayat Review Dinas Pendidikan
          </p>
          {referral.reviews.map((r) => (
            <div
              key={r.id}
              className="text-sm bg-slate-50 rounded-xl px-4 py-2.5"
            >
              <span
                className={`font-semibold ${r.decision === "APPROVE" ? "text-emerald-600" : "text-red-600"}`}
              >
                {r.decision === "APPROVE" ? "Disetujui" : "Perlu Perbaikan"}
              </span>
              {r.catatan && (
                <span className="text-slate-500"> — {r.catatan}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {kase.status === "VERIFIKASI_PENYELESAIAN" &&
        (role === "DINAS_PENDIDIKAN" || isAdmin) && (
          <ReviewPanel referralId={referral.id} onDone={invalidate} />
        )}
    </Section>
  );
}

// ---------------- Referral ----------------
function ReferralPanel({
  caseId,
  onDone,
}: {
  caseId: number;
  onDone: () => void;
}) {
  const { data: opdData } = useQuery({
    queryKey: ["opd-options"],
    queryFn: () => opdApi.list({ limit: 100 }),
  });
  const { data: rfData } = useQuery({
    queryKey: ["riskfactor-options"],
    queryFn: () => riskFactorsApi.list({ limit: 100 }),
  });
  const [opdIds, setOpdIds] = useState<number[]>([]);
  const [riskFactorId, setRiskFactorId] = useState<number | "">("");
  const [tingkatRisiko, setTingkatRisiko] = useState<RiskCategory>("SEDANG");
  const [catatan, setCatatan] = useState("");

  const toggleOpd = (id: number) => {
    setOpdIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const mutation = useMutation({
    mutationFn: () =>
      createReferral(caseId, {
        opdIds,
        riskFactorId: riskFactorId ? Number(riskFactorId) : undefined,
        tingkatRisiko,
        catatan: catatan || undefined,
      }),
    onSuccess: onDone,
  });

  return (
    <Section icon={Building2} title="Rujukan oleh Kapanewon">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Faktor Risiko
            </label>
            <select
              value={riskFactorId}
              onChange={(e) =>
                setRiskFactorId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="">Pilih faktor risiko</option>
              {rfData?.data.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Tingkat Risiko
            </label>
            <select
              value={tingkatRisiko}
              onChange={(e) => setTingkatRisiko(e.target.value as RiskCategory)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            >
              {Object.entries(RISK_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            OPD Tujuan{" "}
            <span className="text-slate-400 font-normal">
              (bisa pilih lebih dari satu)
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3">
            {opdData?.data.map((o) => (
              <label
                key={o.id}
                className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={opdIds.includes(o.id)}
                  onChange={() => toggleOpd(o.id)}
                  className="rounded border-slate-300"
                />
                {o.nama}
              </label>
            ))}
            {!opdData?.data.length && (
              <p className="text-xs text-slate-400 col-span-2">
                Belum ada data OPD.
              </p>
            )}
          </div>
          {opdIds.length > 0 && (
            <p className="text-xs text-slate-500 mt-1.5">
              {opdIds.length} OPD dipilih untuk intervensi bersama.
            </p>
          )}
        </div>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan rujukan (opsional)"
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
        />
        <ErrorAlert
          message={mutation.isError ? apiErrorMessage(mutation.error) : null}
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={opdIds.length === 0 || mutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm disabled:opacity-50"
        >
          {mutation.isPending
            ? "Merujuk..."
            : opdIds.length > 1
              ? `Rujuk ke ${opdIds.length} OPD`
              : "Rujuk ke OPD"}
        </button>
      </div>
    </Section>
  );
}

// ---------------- Monitoring / Close / Reopen ----------------
function MonitoringPanel({
  caseId,
  onDone,
}: {
  caseId: number;
  onDone: () => void;
}) {
  const [catatan, setCatatan] = useState("");
  const noteMutation = useMutation({
    mutationFn: () => createMonitoring(caseId, { catatan }),
    onSuccess: () => {
      onDone();
      setCatatan("");
    },
  });
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeCatatan, setCloseCatatan] = useState("");
  const closeMutation = useMutation({
    mutationFn: () => closeCase(caseId, { catatan: closeCatatan || undefined }),
    onSuccess: () => {
      onDone();
      setCloseOpen(false);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Tambah catatan monitoring..."
          className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
        />
        <button
          onClick={() => noteMutation.mutate()}
          disabled={!catatan || noteMutation.isPending}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          Tambah
        </button>
      </div>
      <ErrorAlert
        message={
          noteMutation.isError ? apiErrorMessage(noteMutation.error) : null
        }
      />

      <button
        onClick={() => setCloseOpen(true)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm"
      >
        <Lock size={16} /> Tutup Kasus (Closed Case)
      </button>

      <Modal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Tutup Kasus"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-slate-500 mb-4">
          Setelah ditutup, kasus bersifat final (BR-18) dan hanya dapat dibuka
          kembali oleh Dinas Pendidikan melalui mekanisme Reopen.
        </p>
        <textarea
          value={closeCatatan}
          onChange={(e) => setCloseCatatan(e.target.value)}
          placeholder="Catatan penutupan (opsional)"
          rows={3}
          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm mb-3"
        />
        <ErrorAlert
          message={
            closeMutation.isError ? apiErrorMessage(closeMutation.error) : null
          }
        />
        <button
          onClick={() => closeMutation.mutate()}
          disabled={closeMutation.isPending}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-2xl disabled:opacity-50"
        >
          {closeMutation.isPending ? "Menutup..." : "Konfirmasi Tutup Kasus"}
        </button>
      </Modal>
    </div>
  );
}

function ReopenButton({
  caseId,
  onDone,
}: {
  caseId: number;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [alasan, setAlasan] = useState("");
  const mutation = useMutation({
    mutationFn: () => reopenCase(caseId, { alasan }),
    onSuccess: () => {
      onDone();
      setOpen(false);
    },
  });
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm"
      >
        <RotateCcw size={16} /> Reopen Case
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buka Kembali Kasus"
        maxWidth="max-w-md"
      >
        <textarea
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          placeholder="Alasan membuka kembali kasus ini (wajib)..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm mb-3"
        />
        <ErrorAlert
          message={mutation.isError ? apiErrorMessage(mutation.error) : null}
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!alasan || mutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl disabled:opacity-50"
        >
          {mutation.isPending ? "Memproses..." : "Reopen Case"}
        </button>
      </Modal>
    </>
  );
}
