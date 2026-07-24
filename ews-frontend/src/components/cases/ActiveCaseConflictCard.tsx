import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import type { ActiveCaseConflict } from "../../types/api";
import { CaseStatusBadge } from "../ui/Badge";

export default function ActiveCaseConflictCard({
  conflict,
  onForceNew,
}: {
  conflict: ActiveCaseConflict;
  onForceNew: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Siswa masih memiliki Case aktif</p>
          <p className="text-sm text-amber-700 mt-1">{conflict.message}</p>
        </div>
      </div>
      <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
        <div>
          <p className="font-mono text-xs font-semibold text-slate-700">
            {conflict.existingCase.nomorKasus}
          </p>
          <div className="mt-1">
            <CaseStatusBadge value={conflict.existingCase.status} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/cases/${conflict.existingCase.id}`)}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Lihat Kasus
        </button>
      </div>
      <button
        type="button"
        onClick={onForceNew}
        className="w-full text-sm font-medium text-amber-800 border border-amber-300 rounded-xl py-2.5 hover:bg-amber-100"
      >
        Ini permasalahan berbeda — buat Case baru (BR-20)
      </button>
    </div>
  );
}
