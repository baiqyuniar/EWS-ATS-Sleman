import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileText } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import StudentPicker from "../../components/cases/StudentPicker";
import ActiveCaseConflictCard from "../../components/cases/ActiveCaseConflictCard";
import { createPelaporanSekolah } from "../../services/cases.service";
import type { Student, ActiveCaseConflict } from "../../types/api";
import { ErrorAlert } from "../../components/ui/Alert";
import { apiErrorMessage } from "../../lib/api";

export default function CaseCreatePelaporanPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const predictionId = params.get("predictionId");

  const [student, setStudent] = useState<Student | null>(null);
  const [catatan, setCatatan] = useState("");
  const [isiLaporan, setIsiLaporan] = useState("");
  const [conflict, setConflict] = useState<ActiveCaseConflict | null>(null);

  const mutation = useMutation({
    mutationFn: (forceNewCase: boolean) =>
      createPelaporanSekolah({
        studentId: student!.id,
        predictionId: predictionId ? Number(predictionId) : undefined,
        catatan: catatan || undefined,
        isiLaporan: isiLaporan || undefined,
        forceNewCase,
      }),
    onSuccess: (created) => navigate(`/cases/${created.id}`),
    onError: (err: any) => {
      if (err?.response?.status === 409) {
        setConflict(err.response.data);
      }
    },
  });

  const nonConflictError =
    mutation.isError &&
    mutation.error &&
    (mutation.error as any)?.response?.status !== 409
      ? apiErrorMessage(mutation.error)
      : null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">
                Pelaporan oleh Sekolah
              </h2>
              <p className="text-sm text-slate-500">
                Pencegahan Siswa Putus Sekolah
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConflict(null);
              mutation.mutate(false);
            }}
            className="space-y-4"
          >
            <StudentPicker value={student} onChange={setStudent} />

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Isi Laporan
              </label>
              <textarea
                value={isiLaporan}
                onChange={(e) => setIsiLaporan(e.target.value)}
                rows={4}
                placeholder="Uraikan kondisi/indikasi siswa berpotensi putus sekolah..."
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Catatan Tambahan
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <ErrorAlert message={nonConflictError} />
            {conflict && (
              <ActiveCaseConflictCard
                conflict={conflict}
                onForceNew={() => mutation.mutate(true)}
              />
            )}

            <button
              type="submit"
              disabled={!student || mutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-2xl transition disabled:opacity-50"
            >
              {mutation.isPending ? "Menyimpan..." : "Buat Pelaporan"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
