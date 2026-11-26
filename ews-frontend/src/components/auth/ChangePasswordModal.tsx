import { useState } from "react";
import { Eye, EyeOff, KeyRound, Check, X as XIcon, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import { ErrorAlert } from "../ui/Alert";
import { changePassword } from "../../services/auth.service";
import { apiErrorMessage } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const toast = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMinLength = newPassword.length >= 10;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPolicyValid = hasMinLength && hasUpper && hasLower && hasNumber;

  const handleClose = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPolicyValid) {
      setError("Password baru belum memenuhi semua kriteria keamanan.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    if (oldPassword === newPassword) {
      setError("Password baru tidak boleh sama dengan password lama.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success("Password berhasil diubah. Silakan gunakan password baru ini pada login berikutnya.");
      handleClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Ubah Password Akun" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed">
            Ganti password default Anda dengan password yang aman dan mudah Anda ingat.
          </div>
        </div>

        <ErrorAlert message={error} />

        {/* Password Lama */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Password Lama <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan password saat ini"
              className="w-full px-4 py-2.5 pr-11 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Password Baru */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Password Baru <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 10 karakter"
              className="w-full px-4 py-2.5 pr-11 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Indikator Kebijakan Keamanan */}
          <div className="mt-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
            <p className="font-semibold text-slate-600 mb-1">Ketentuan password baru:</p>
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

        {/* Konfirmasi Password Baru */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Konfirmasi Password Baru <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full px-4 py-2.5 pr-11 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword && (
            <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${isMatch ? "text-green-600" : "text-red-500"}`}>
              {isMatch ? <Check size={14} /> : <XIcon size={14} />}
              {isMatch ? "Password cocok" : "Konfirmasi password belum cocok"}
            </p>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
            disabled={loading || !isPolicyValid || !isMatch || !oldPassword}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>Simpan Password Baru</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
