import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export function ErrorAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function SuccessAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function InfoAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl px-4 py-3 text-sm">
      <Info size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
