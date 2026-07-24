import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Megaphone } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import StudentPicker from "../../components/cases/StudentPicker";
import ActiveCaseConflictCard from "../../components/cases/ActiveCaseConflictCard";
import { createPengaduanMasyarakat } from "../../services/cases.service";
import type { Student, ActiveCaseConflict } from "../../types/api";
import { ErrorAlert } from "../../components/ui/Alert";
import { apiErrorMessage } from "../../lib/api";

export default function CaseCreatePengaduanPage() {
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [namaPelapor, setNamaPelapor] = useState("");
  const [kontakPelapor, setKontakPelapor] = useState("");
  const [caraPengaduan, setCaraPengaduan] = useState("");
  const [kondisiAwal, setKondisiAwal] = useState("");
  const [isiLaporan, setIsiLaporan] = useState("");
  const [conflict, setConflict] = useState<ActiveCaseConflict | null>(null);

  const mutation = useMutation({
    mutationFn: (forceNewCase: boolean) =>
      createPengaduanMasyarakat({
        studentId: student!.id,
        namaPelapor,
        kontakPelapor: kontakPelapor || undefined,
        caraPengaduan: caraPengaduan || undefined,
        kondisiAwal: kondisiAwal || undefined,
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
            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Pengaduan Masyarakat</h2>
              <p className="text-sm text-slate-500">
                Data diterima &amp; dicatat oleh Kapanewon.
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Nama Pelapor <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={namaPelapor}
                  onChange={(e) => setNamaPelapor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Kontak Pelapor
                </label>
                <input
                  value={kontakPelapor}
                  onChange={(e) => setKontakPelapor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Cara Pengaduan
              </label>
              <select
                value={caraPengaduan}
                onChange={(e) => setCaraPengaduan(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm bg-white"
              >
                <option value="">Pilih cara pengaduan</option>
                <option value="Datang Langsung">Datang Langsung</option>
                <option value="Telepon">Telepon</option>
                <option value="Aplikasi">Aplikasi</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Kondisi Awal
              </label>
              <textarea
                value={kondisiAwal}
                onChange={(e) => setKondisiAwal(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Isi Pengaduan
              </label>
              <textarea
                value={isiLaporan}
                onChange={(e) => setIsiLaporan(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm"
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
              disabled={!student || !namaPelapor || mutation.isPending}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-2xl transition disabled:opacity-50"
            >
              {mutation.isPending ? "Menyimpan..." : "Catat Pengaduan"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
