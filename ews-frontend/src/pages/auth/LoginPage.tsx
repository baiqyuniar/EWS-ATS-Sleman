import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";

import { login } from "../../services/auth.service";
import { saveSession } from "../../store/auth.store";
import { apiErrorMessage } from "../../lib/api";
import { ErrorAlert } from "../../components/ui/Alert";
import { defaultRouteForRole } from "../../routes/roleRoutes";
//import logoSleman from "../../assets/logo-sleman.png";
//import backgroundLogin from "../../assets/bg_login.png";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@sleman.go.id", password: "admin123" },
  {
    role: "Sekolah",
    email: "sekolah.20401408@sleman.go.id",
    password: "sekolah123",
  },
  {
    role: "Kapanewon",
    email: "kapanewon.godean@sleman.go.id",
    password: "kapanewon123",
  },
  { role: "OPD", email: "opd@sleman.go.id", password: "opd123" },
  {
    role: "Dinas Pendidikan",
    email: "dinas@sleman.go.id",
    password: "dinas123",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      const session = await login({ email, password });
      saveSession(session);
      navigate(defaultRouteForRole(session.user.role));
    } catch (err) {
      setError(apiErrorMessage(err, "Email atau password salah"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* ================= LEFT ================= */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden">
        <img
          src="/images/login-bg.jpg"
          alt="Login"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-blue-900/70 to-blue-700/40" />

        {/* content */}
        <div className="relative z-10 flex flex-col justify-between h-full w-full p-16 text-white">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
              <ShieldCheck size={30} />
            </div>

            <div>
              <h1 className="text-2xl font-white">Gandheng-ATS</h1>

              <p className="text-blue-100">Kabupaten Sleman</p>
            </div>
          </div>

          {/* Hero */}
          <div className="max-w-2xl">
            <p className="uppercase tracking-[0.35em] text-sm text-blue-200 mb-1">
              EARLY WARNING SYSTEM
            </p>

            <h1 className="text-5xl font-black leading-tight">
              Monitoring Risiko
              <br />
              Anak Putus Sekolah
            </h1>

            <p className="mt-3 text-lg leading-7 text-white/90">
              Platform kolaborasi antara Sekolah, Kapanewon, OPD, dan Dinas
              Pendidikan dalam mendeteksi siswa berisiko putus sekolah secara
              real-time.
            </p>
          </div>

          {/* Statistik */}

          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6">
              <h3 className="text-4xl font-bold">17</h3>

              <p className="mt-2 text-blue-100">Kapanewon</p>
            </div>

            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6">
              <h3 className="text-4xl font-bold">600+</h3>

              <p className="mt-2 text-blue-100">Sekolah</p>
            </div>

            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6">
              <h3 className="text-4xl font-bold">12K+</h3>

              <p className="mt-2 text-blue-100">Data Siswa</p>
            </div>

            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6">
              <h3 className="text-3xl font-bold">24/7</h3>

              <p className="mt-2 text-blue-100">Monitoring</p>
            </div>
          </div>

          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} Pemerintah Kabupaten Sleman
          </p>
        </div>
      </div>

      {/* ================= RIGHT ================= */}

      <div className="flex-1 lg:w-[42%] flex items-center justify-center p-10 bg-gradient-to-br from-slate-50 via-blue-50 to-white">
        <div className="w-full max-w-md">
          {/* Header */}

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-blue-700 font-semibold text-sm">
              <ShieldCheck size={16} />
              Sistem Aman
            </div>

            <h4 className="mt-5 text-4xl font-black text-slate-800">
              Masuk ke Akun Anda
            </h4>

            <p className="mt-3 text-slate-500 leading-7">
              Silakan login menggunakan akun sesuai hak akses Anda untuk
              mengelola data Early Warning System Anak Putus Sekolah.
            </p>
          </div>

          {/* Login Card */}

          <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <ErrorAlert message={error} />

              {/* Email */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Email
                </label>

                <div className="relative mt-2">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@sleman.go.id"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Password */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative mt-2">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember */}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="rounded" />
                  Ingat saya
                </label>

                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Lupa Password?
                </button>
              </div>

              {/* Button */}

              <button
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex justify-center items-center gap-3 transition shadow-lg"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}

                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            {/* Divider */}

            <div className="flex items-center my-7">
              <div className="flex-1 h-px bg-slate-200" />

              <span className="px-4 text-xs uppercase text-slate-400">
                Demo
              </span>

              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Demo */}

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                  }}
                  className="w-full rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition p-4 flex justify-between items-center group"
                >
                  <div className="text-left">
                    <p className="font-semibold text-slate-700">{acc.role}</p>

                    <p className="text-xs text-slate-400">{acc.email}</p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition">
                    <LogIn
                      size={18}
                      className="text-blue-600 group-hover:text-white"
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Security */}

            <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex gap-3">
                <ShieldCheck size={22} className="text-green-600 mt-1" />

                <div>
                  <p className="font-semibold text-slate-700">
                    Keamanan Sistem
                  </p>

                  <p className="text-sm text-slate-500 mt-1 leading-6">
                    Seluruh aktivitas login dicatat untuk menjaga keamanan dan
                    akuntabilitas akses pengguna.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}

          <div className="text-center mt-8">
            <p className="text-sm text-slate-500 font-medium">
              © {new Date().getFullYear()} Gandheng-ATS
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Early Warning System Anak Putus Sekolah Kabupaten Sleman
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
