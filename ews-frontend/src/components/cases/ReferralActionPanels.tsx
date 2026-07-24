import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, CheckCircle2, ShieldCheck } from "lucide-react";

import { interventionTypesApi } from "../../services/master.service";
import { createIntervention, updateInterventionResult, submitCompletion } from "../../services/intervention.service";
import { createReview } from "../../services/review.service";
import { verifyReferral } from "../../services/referral.service";
import { apiErrorMessage } from "../../lib/api";
import { ErrorAlert } from "../ui/Alert";
import FileUploadField from "./FileUploadField";

// OPD memverifikasi/menerima rujukan (MENUNGGU -> DITERIMA) sebelum memulai intervensi.
// Berlaku untuk rujukan Case maupun rujukan DO-Student.
export function VerifyReferralButton({ referralId, onDone }: { referralId: number; onDone: () => void }) {
  const mutation = useMutation({
    mutationFn: () => verifyReferral(referralId),
    onSuccess: onDone,
  });
  return (
    <div className="mt-4 space-y-2">
      <ErrorAlert message={mutation.isError ? apiErrorMessage(mutation.error) : null} />
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm disabled:opacity-50"
      >
        <ShieldCheck size={16} /> {mutation.isPending ? "Memverifikasi..." : "Verifikasi & Terima Rujukan"}
      </button>
    </div>
  );
}

export function InterventionCreatePanel({ referralId, onDone }: { referralId: number; onDone: () => void }) {
  const { data: typeData } = useQuery({
    queryKey: ["intervention-type-options"],
    queryFn: () => interventionTypesApi.list({ limit: 100 }),
  });
  const [open, setOpen] = useState(false);
  const [interventionTypeId, setInterventionTypeId] = useState<number | "">("");
  const [deskripsi, setDeskripsi] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createIntervention(referralId, { interventionTypeId: Number(interventionTypeId), deskripsi }),
    onSuccess: () => {
      onDone();
      setOpen(false);
      setDeskripsi("");
      setInterventionTypeId("");
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-2xl px-4 py-2.5 hover:bg-blue-50"
      >
        <Plus size={16} /> Tambah Intervensi
      </button>
    );
  }

  return (
    <div className="mt-4 border border-slate-100 rounded-2xl p-4 space-y-3">
      <select
        value={interventionTypeId}
        onChange={(e) => setInterventionTypeId(e.target.value ? Number(e.target.value) : "")}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
      >
        <option value="">Pilih jenis intervensi</option>
        {typeData?.data.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nama}
          </option>
        ))}
      </select>
      <textarea
        value={deskripsi}
        onChange={(e) => setDeskripsi(e.target.value)}
        placeholder="Deskripsi intervensi yang dilakukan..."
        rows={2}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
      />
      <ErrorAlert message={mutation.isError ? apiErrorMessage(mutation.error) : null} />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
          Batal
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!interventionTypeId || !deskripsi || mutation.isPending}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? "Menyimpan..." : "Simpan Intervensi"}
        </button>
      </div>
    </div>
  );
}

export function InterventionResultForm({ interventionId, onDone }: { interventionId: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [hasil, setHasil] = useState("");
  const [lampiranUrls, setLampiranUrls] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () => updateInterventionResult(interventionId, { hasil, lampiranUrls }),
    onSuccess: () => {
      onDone();
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-blue-600 mt-2 hover:underline"
      >
        + Isi Hasil Intervensi (BR-16)
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 bg-slate-50 rounded-xl p-3">
      <textarea
        value={hasil}
        onChange={(e) => setHasil(e.target.value)}
        placeholder="Hasil intervensi..."
        rows={2}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
      />
      <FileUploadField label="Lampiran (opsional)" urls={lampiranUrls} onChange={setLampiranUrls} />
      <ErrorAlert message={mutation.isError ? apiErrorMessage(mutation.error) : null} />
      <button
        onClick={() => mutation.mutate()}
        disabled={!hasil || mutation.isPending}
        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
      >
        {mutation.isPending ? "Menyimpan..." : "Simpan Hasil"}
      </button>
    </div>
  );
}

export function SubmitCompletionButton({ referralId, onDone }: { referralId: number; onDone: () => void }) {
  const [catatan, setCatatan] = useState("");
  const mutation = useMutation({
    mutationFn: () => submitCompletion(referralId, { catatan: catatan || undefined }),
    onSuccess: onDone,
  });
  return (
    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan pengajuan penyelesaian (opsional)"
        rows={2}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
      />
      <ErrorAlert message={mutation.isError ? apiErrorMessage(mutation.error) : null} />
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm disabled:opacity-50"
      >
        <CheckCircle2 size={16} /> Ajukan Intervensi Selesai
      </button>
    </div>
  );
}

export function ReviewPanel({ referralId, onDone }: { referralId: number; onDone: () => void }) {
  const [catatan, setCatatan] = useState("");
  const mutation = useMutation({
    mutationFn: (decision: "APPROVE" | "PERLU_PERBAIKAN") =>
      createReview(referralId, { decision, catatan: catatan || undefined }),
    onSuccess: onDone,
  });
  return (
    <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
      <p className="text-sm font-semibold text-slate-700">Verifikasi Penyelesaian oleh Dinas Pendidikan</p>
      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan review (opsional)"
        rows={2}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
      />
      <ErrorAlert message={mutation.isError ? apiErrorMessage(mutation.error) : null} />
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate("PERLU_PERBAIKAN")}
          disabled={mutation.isPending}
          className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
        >
          Perlu Perbaikan
        </button>
        <button
          onClick={() => mutation.mutate("APPROVE")}
          disabled={mutation.isPending}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          Setujui
        </button>
      </div>
    </div>
  );
}
