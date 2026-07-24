import type { CaseStatus, RiskCategory, AssignmentStatus, CaseSource } from "../../types/api";
import {
  CASE_STATUS_LABEL,
  RISK_LABEL,
  ASSIGNMENT_STATUS_LABEL,
  CASE_SOURCE_LABEL,
} from "../../types/api";

const base =
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap";

export function RiskBadge({ value }: { value: RiskCategory }) {
  const styles: Record<RiskCategory, string> = {
    RENDAH: "bg-green-100 text-green-700",
    SEDANG: "bg-yellow-100 text-yellow-700",
    TINGGI: "bg-red-100 text-red-700",
  };
  return <span className={`${base} ${styles[value]}`}>{RISK_LABEL[value]}</span>;
}

export function CaseStatusBadge({ value }: { value: CaseStatus }) {
  const styles: Record<CaseStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    CASE_CREATED: "bg-blue-100 text-blue-700",
    VERIFIKASI_NIK: "bg-indigo-100 text-indigo-700",
    HOME_VISIT: "bg-purple-100 text-purple-700",
    SELESAI_PENCEGAHAN: "bg-emerald-100 text-emerald-700",
    MENUNGGU_RUJUKAN: "bg-amber-100 text-amber-700",
    DIRUJUK_OPD: "bg-orange-100 text-orange-700",
    INTERVENSI_BERJALAN: "bg-sky-100 text-sky-700",
    VERIFIKASI_PENYELESAIAN: "bg-fuchsia-100 text-fuchsia-700",
    MONITORING: "bg-teal-100 text-teal-700",
    CLOSED_CASE: "bg-slate-200 text-slate-700",
  };
  return <span className={`${base} ${styles[value]}`}>{CASE_STATUS_LABEL[value]}</span>;
}

export function AssignmentStatusBadge({ value }: { value: AssignmentStatus }) {
  const styles: Record<AssignmentStatus, string> = {
    MENUNGGU: "bg-amber-100 text-amber-700",
    DITERIMA: "bg-blue-100 text-blue-700",
    INTERVENSI_BERJALAN: "bg-sky-100 text-sky-700",
    SELESAI_DIAJUKAN: "bg-fuchsia-100 text-fuchsia-700",
    SELESAI_DISETUJUI: "bg-emerald-100 text-emerald-700",
    PERLU_PERBAIKAN: "bg-red-100 text-red-700",
  };
  return <span className={`${base} ${styles[value]}`}>{ASSIGNMENT_STATUS_LABEL[value]}</span>;
}

export function CaseSourceBadge({ value }: { value: CaseSource }) {
  const styles: Record<CaseSource, string> = {
    PELAPORAN_SEKOLAH: "bg-green-50 text-green-700 border border-green-200",
    PENGADUAN_MASYARAKAT: "bg-orange-50 text-orange-700 border border-orange-200",
  };
  return <span className={`${base} ${styles[value]}`}>{CASE_SOURCE_LABEL[value]}</span>;
}
