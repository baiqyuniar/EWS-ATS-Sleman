import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, UserX, Building2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getReferral } from "../../services/referral.service";
import { useAuth } from "../../hooks/useAuth";
import { AssignmentStatusBadge, RiskBadge } from "../../components/ui/Badge";
import {
  VerifyReferralButton,
  InterventionCreatePanel,
  InterventionResultForm,
  SubmitCompletionButton,
  ReviewPanel,
} from "../../components/cases/ReferralActionPanels";

export default function ReferralDetailPage() {
  const { id } = useParams();
  const referralId = Number(id);
  const navigate = useNavigate();
  const { role } = useAuth();
  const qc = useQueryClient();

  const { data: referral, isLoading } = useQuery({
    queryKey: ["referral", referralId],
    queryFn: () => getReferral(referralId),
    enabled: !!referralId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["referral", referralId] });

  if (isLoading || !referral) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Loader2 className="animate-spin" size={20} /> Memuat detail rujukan...
        </div>
      </DashboardLayout>
    );
  }

  // Rujukan berbasis Kasus dikelola lengkap di halaman Detail Kasus.
  if (referral.origin === "CASE" && referral.caseId) {
    navigate(`/cases/${referral.caseId}`, { replace: true });
    return null;
  }

  const student = referral.student;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <UserX size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                  Rujukan Siswa Putus Sekolah (DO)
                </p>
                <h1 className="text-xl font-bold text-slate-800 uppercase">{student?.nama}</h1>
                <p className="text-sm text-slate-500">
                  NISN {student?.nisn} &middot; {student?.school?.nama ? student.school.nama.toUpperCase() : "-"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <AssignmentStatusBadge value={referral.status} />
              <RiskBadge value={referral.tingkatRisiko} />
            </div>
          </div>
          {referral.catatan && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-2xl px-4 py-3 mt-4">{referral.catatan}</p>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Rujukan & Intervensi OPD</h2>
              <p className="text-sm text-slate-500 uppercase">{referral.opd?.nama}</p>
            </div>
          </div>

          <div className="space-y-3">
            {(referral.interventions ?? []).map((iv) => (
              <div key={iv.id} className="border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">{iv.interventionType?.nama ?? "Intervensi"}</p>
                  <span className="text-xs text-slate-400">
                    {new Date(iv.tanggal).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{iv.deskripsi}</p>
                {iv.hasil ? (
                  <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 mt-2">Hasil: {iv.hasil}</p>
                ) : role === "OPD" ? (
                  <InterventionResultForm interventionId={iv.id} onDone={invalidate} />
                ) : (
                  <p className="text-xs text-amber-600 mt-2">Hasil belum diisi (BR-16)</p>
                )}
              </div>
            ))}
            {(referral.interventions?.length ?? 0) === 0 && (
              <p className="text-sm text-slate-400">Belum ada intervensi.</p>
            )}
          </div>

          {referral.status === "MENUNGGU" && role === "OPD" && (
            <VerifyReferralButton referralId={referral.id} onDone={invalidate} />
          )}

          {["MENUNGGU", "DITERIMA", "INTERVENSI_BERJALAN"].includes(referral.status) && role === "OPD" && (
            <InterventionCreatePanel referralId={referral.id} onDone={invalidate} />
          )}

          {referral.status === "INTERVENSI_BERJALAN" && role === "OPD" && (
            <SubmitCompletionButton referralId={referral.id} onDone={invalidate} />
          )}

          {referral.reviews && referral.reviews.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500">Riwayat Review Dinas Pendidikan</p>
              {referral.reviews.map((r) => (
                <div key={r.id} className="text-sm bg-slate-50 rounded-xl px-4 py-2.5">
                  <span className={`font-semibold ${r.decision === "APPROVE" ? "text-emerald-600" : "text-red-600"}`}>
                    {r.decision === "APPROVE" ? "Disetujui" : "Perlu Perbaikan"}
                  </span>
                  {r.catatan && <span className="text-slate-500"> — {r.catatan}</span>}
                </div>
              ))}
            </div>
          )}

          {referral.status === "SELESAI_DIAJUKAN" && role === "DINAS_PENDIDIKAN" && (
            <ReviewPanel referralId={referral.id} onDone={invalidate} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
