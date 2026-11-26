import { useState, useEffect } from "react";
import { Eye, EyeOff, KeyRound, Check, X as XIcon, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import { ErrorAlert } from "../ui/Alert";
import { resetUserPassword } from "../../services/users.service";
import { apiErrorMessage } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import type { AppUser } from "../../types/api";
import { ROLE_LABEL } from "../../types/api";

interface Props {
  open: boolean;
  onClose: () => void;
  user: AppUser | null;
  onSuccess?: () => void;
}

export default function ResetPasswordModal({ open, onClose, user, onSuccess }: Props) {
  const toast = useToast();
  const [newPassword, setNewPassword] = useState("Puskesmas123!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      if (user.role === "OPD") {
        setNewPassword("Puskesmas123!");
      } else if (user.role === "SEKOLAH") {
        setNewPassword("Sekolah123!");
      } else if (user.role === "KAPANEWON") {
        setNewPassword("Kapanewon123!");
      } else {
        setNewPassword("Gandheng2026!");
      }
      setError("");
    }
  }, [user, open]);

  const hasMinLength = newPassword.length >= 10;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isPolicyValid = hasMinLength && hasUpper && hasLower && hasNumber;

  const handleClose = () => {
    setError("");
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    if (!isPolicyValid) {
      setError("Password baru belum memenuhi kriteria keamanan (minimal 10 karakter, ada huruf besar, kecil, dan angka).");
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(user.id, newPassword);
      toast.success(`Password untuk akun ${user.name} berhasil di-reset menjadi "${newPassword}"!`);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Reset Password Akun" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Target Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Akun</span>
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {ROLE_LABEL[user.role]}
            </span>
          </div>
          <p className="font-bold text-slate-800 text-sm">{user.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
        </div>

        <ErrorAlert message={error} />

        {/* Input Password Baru */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">
              Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setNewPassword("Puskesmas123!")}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition"
              >
                Puskesmas123!
              </button>
              <button
                type="button"
                onClick={() => setNewPassword("Gandheng2026!")}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition"
              >
                Gandheng2026!
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 10 karakter"
              className="w-full px-4 py-2.5 pr-11 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Ketentuan Policy */}
          <div className="mt-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
            <p className="font-semibold text-slate-600 mb-1">Ketentuan password:</p>
            <div className="flex items-center gap-2">
              {hasMinLength ? (
                <Check size={14} className="text-green-600 shrink-0" />
              ) : (
                <XIcon size={14} className="text-slate-400 shrink-0" />
              )}
              <span className={hasMinLength ? "text-green-700" : "text-slate-500"}>
                Minimal 10 karakter ({newPassword.length}/10)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasUpper ? (
                <Check size={14} className="text-green-600 shrink-0" />
              ) : (
                <XIcon size={14} className="text-slate-400 shrink-0" />
              )}
              <span className={hasUpper ? "text-green-700" : "text-slate-500"}>
                Mengandung huruf besar (A-Z)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasLower ? (
                <Check size={14} className="text-green-600 shrink-0" />
              ) : (
                <XIcon size={14} className="text-slate-400 shrink-0" />
              )}
              <span className={hasLower ? "text-green-700" : "text-slate-500"}>
                Mengandung huruf kecil (a-z)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasNumber ? (
                <Check size={14} className="text-green-600 shrink-0" />
              ) : (
                <XIcon size={14} className="text-slate-400 shrink-0" />
              )}
              <span className={hasNumber ? "text-green-700" : "text-slate-500"}>
                Mengandung angka (0-9)
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/60 p-2.5 rounded-xl">
          ℹ️ Melakukan reset password juga otomatis membuka kunci akun jika sebelumnya terkunci akibat salah password berulang.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !isPolicyValid}
            className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-600/20"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <KeyRound size={16} />
            <span>Reset Password</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
