import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldCheck, Smartphone, Trash2, Loader2, Plus, AlertTriangle } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import {
  registerPasskey,
  listPasskeys,
  deletePasskey,
  browserSupportsWebAuthn,
} from "../../services/webauthn.service";

export default function PasskeySettingsPage() {
  const queryClient = useQueryClient();
  const [deviceLabel, setDeviceLabel] = useState("");
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const supported = browserSupportsWebAuthn();

  const { data: passkeys, isLoading } = useQuery({
    queryKey: ["webauthn-credentials"],
    queryFn: listPasskeys,
  });

  const handleRegister = async () => {
    setError("");
    setRegistering(true);
    try {
      await registerPasskey(deviceLabel.trim() || undefined);
      setDeviceLabel("");
      await queryClient.invalidateQueries({ queryKey: ["webauthn-credentials"] });
    } catch (err) {
      // Pesan error WebAuthn dari browser (mis. dibatalkan pengguna, timeout,
      // authenticator tidak cocok) biasanya sudah cukup jelas untuk ditampilkan
      // langsung, tapi tetap diberi fallback generik.
      const message =
        err instanceof Error ? err.message : "Gagal mendaftarkan passkey. Coba lagi.";
      setError(
        message.toLowerCase().includes("notallowed")
          ? "Dibatalkan atau waktu habis saat verifikasi passkey."
          : message,
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deletePasskey(id);
      await queryClient.invalidateQueries({ queryKey: ["webauthn-credentials"] });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <KeyRound className="text-blue-600" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Passkey Akun Admin</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Passkey memakai sidik jari, wajah, atau PIN perangkat Anda untuk login —
                lebih aman dari password karena kunci privatnya tidak pernah meninggalkan
                perangkat Anda dan tidak bisa dicuri lewat phishing. Fitur ini khusus untuk
                akun Admin karena berisiko tinggi bila diretas.
              </p>
            </div>
          </div>
        </div>

        {!supported && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-amber-800">
              Browser ini tidak mendukung passkey/WebAuthn. Gunakan browser modern
              (Chrome, Edge, Safari, Firefox versi terbaru) untuk mendaftarkan passkey.
            </p>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h4 className="font-semibold text-slate-800 mb-3">Tambah Passkey Baru</h4>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-3">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={deviceLabel}
              onChange={(e) => setDeviceLabel(e.target.value)}
              placeholder="Nama perangkat (opsional), mis. Laptop Kerja"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              onClick={handleRegister}
              disabled={!supported || registering}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {registering ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {registering ? "Menunggu verifikasi..." : "Daftarkan Passkey"}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Setelah klik, browser akan meminta verifikasi sidik jari/wajah/PIN perangkat Anda.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h4 className="font-semibold text-slate-800 mb-4">Passkey Terdaftar</h4>

          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
              <Loader2 className="animate-spin" size={16} /> Memuat...
            </div>
          ) : !passkeys || passkeys.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              Belum ada passkey terdaftar untuk akun ini.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {passkeys.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                      <Smartphone size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {p.deviceLabel || "Passkey"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Didaftarkan {new Date(p.createdAt).toLocaleDateString("id-ID")}
                        {p.lastUsedAt &&
                          ` · Terakhir dipakai ${new Date(p.lastUsedAt).toLocaleDateString("id-ID")}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    title="Hapus passkey ini"
                    className="text-slate-400 hover:text-red-500 disabled:opacity-50 p-2"
                  >
                    {deletingId === p.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 text-xs text-slate-400 px-1">
          <ShieldCheck size={14} className="shrink-0 mt-0.5" />
          <p>
            Password akun Anda tetap aktif dan bisa dipakai kapan saja — passkey adalah
            opsi tambahan, bukan pengganti wajib.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
