import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Inbox, Loader2 } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import EmptyState from "../../components/ui/EmptyState";
import { AssignmentStatusBadge, RiskBadge } from "../../components/ui/Badge";
import { getReferrals } from "../../services/referral.service";

export default function ReferralsInboxPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["referrals-inbox"],
    queryFn: getReferrals,
    refetchInterval: 30000,
  });

  const referrals = data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={20} /> Memuat data...
            </div>
          ) : referrals.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Belum ada rujukan"
              description="Rujukan baru akan muncul di sini."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="px-6 py-3 font-medium">Siswa</th>
                    <th className="px-6 py-3 font-medium">Asal</th>
                    <th className="px-6 py-3 font-medium">Risiko</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Tanggal</th>
                    <th className="px-6 py-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => {
                    const student = r.student ?? r.case?.student;
                    const isNew = r.status === "MENUNGGU";
                    return (
                      <tr
                        key={r.id}
                        onClick={() =>
                          r.origin === "CASE" && r.caseId
                            ? navigate(`/cases/${r.caseId}`)
                            : navigate(`/referrals/${r.id}`)
                        }
                        className={`border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer ${isNew ? "bg-amber-50/40" : ""}`}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            {isNew && (
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium text-slate-800 uppercase">
                                {student?.nama ?? "-"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {student?.school?.nama ? student.school.nama.toUpperCase() : "-"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-500">
                          {r.origin === "DO_STUDENT"
                            ? "Rujukan Siswa DO (Admin)"
                            : "Kasus"}
                        </td>
                        <td className="px-6 py-3.5">
                          <RiskBadge value={r.tingkatRisiko} />
                        </td>
                        <td className="px-6 py-3.5">
                          <AssignmentStatusBadge value={r.status} />
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3.5 text-right text-xs font-semibold text-blue-600">
                          Lihat
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
