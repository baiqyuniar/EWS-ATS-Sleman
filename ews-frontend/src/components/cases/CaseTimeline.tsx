import { History } from "lucide-react";
import type { CaseTimelineEntry } from "../../types/api";
import { ROLE_LABEL } from "../../types/api";

export default function CaseTimeline({ entries }: { entries: CaseTimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">Belum ada riwayat.</p>;
  }
  return (
    <div className="space-y-0">
      {entries.map((e, i) => (
        <div key={e.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <History size={14} />
            </div>
            {i < entries.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
          </div>
          <div className={`pb-5 ${i === entries.length - 1 ? "" : ""}`}>
            <p className="text-sm font-semibold text-slate-800">{e.title}</p>
            {e.description && <p className="text-sm text-slate-500 mt-0.5">{e.description}</p>}
            <p className="text-xs text-slate-400 mt-1">
              {e.actor?.name ?? "Sistem"} &middot; {ROLE_LABEL[e.actorRole]} &middot;{" "}
              {new Date(e.createdAt).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
