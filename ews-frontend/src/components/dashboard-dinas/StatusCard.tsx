import { CheckCircle2, Clock3 } from "lucide-react";

interface StatusCardProps {
  completed: number;
  completedLocation: string;
  pending: number;
  pendingText: string;
  heading?: string;
  completedLabel?: string;
  pendingLabel?: string;
}

export default function StatusCard({
  completed,
  completedLocation,
  pending,
  pendingText,
  heading = "Ringkasan Kasus",
  completedLabel = "Kasus Selesai",
  pendingLabel = "Kasus Baru",
}: StatusCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <p className="text-xs uppercase tracking-widest text-slate-400 mb-5">{heading}</p>

      <div className="space-y-5">
        {/* Selesai */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-green-600" />
          </div>

          <div>
            <p className="font-semibold text-slate-800">
              {completed} {completedLabel}
            </p>
            <p className="text-sm text-slate-500">{completedLocation}</p>
          </div>
        </div>

        {/* Pending */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock3 size={18} className="text-yellow-600" />
          </div>

          <div>
            <p className="font-semibold text-slate-800">
              {pending} {pendingLabel}
            </p>
            <p className="text-sm text-slate-500">{pendingText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
