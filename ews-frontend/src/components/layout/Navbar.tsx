import { Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../hooks/useAuth";
import { ROLE_LABEL } from "../../types/api";
import { getReferrals } from "../../services/referral.service";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // Notifikasi OPD: jumlah rujukan baru (status Menunggu) yang masuk ke OPD-nya.
  const { data: referrals } = useQuery({
    queryKey: ["referrals-notification"],
    queryFn: getReferrals,
    enabled: role === "OPD",
    refetchInterval: 30000,
  });
  const pendingCount = role === "OPD" ? (referrals ?? []).filter((r) => r.status === "MENUNGGU").length : 0;

  const pageConfig: Record<string, { title: string; description: string }> = {
    "/dashboard": {
      title: "Dashboard EWS ATS",
      description: "Monitoring risiko anak tidak sekolah Kabupaten Sleman",
    },
    "/risk-map": {
      title: "Peta Risiko Kabupaten Sleman",
      description: "Visualisasi persebaran risiko anak tidak sekolah",
    },
    "/login": {
      title: "Login",
      description: "Masuk ke sistem",
    },
    "/students": {
      title: "Daftar Siswa Aktif",
      description: "Data induk siswa aktif lintas sekolah Kabupaten Sleman",
    },
    "/students/do": {
      title: "Siswa Putus Sekolah (DO)",
      description: "Daftar siswa DO & rujukan langsung ke OPD",
    },
    "/referrals": {
      title: "Rujukan Masuk",
      description: "Rujukan Kasus maupun rujukan langsung siswa DO ke OPD Anda",
    },
    "/predictions": {
      title: "Simulasi Prediksi Risiko",
      description: "Simulasi probabilitas risiko anak putus sekolah per siswa",
    },
    "/predictions/upload": {
      title: "Upload & Prediksi Batch",
      description: "Upload file CSV dan lakukan prediksi risiko siswa secara massal",
    },
    "/cases": {
      title: "Daftar Kasus",
      description: "Alur pencegahan & penanganan anak putus sekolah",
    },
    "/cases/new/pelaporan": {
      title: "Pelaporan oleh Sekolah",
      description: "Buat pelaporan siswa berpotensi putus sekolah",
    },
    "/cases/new/pengaduan": {
      title: "Pengaduan Masyarakat",
      description: "Catat pengaduan masyarakat oleh Kapanewon",
    },
    "/master/users": {
      title: "Master User",
      description: "Kelola akun pengguna sistem",
    },
    "/master/schools": {
      title: "Master Sekolah",
      description: "Kelola data satuan pendidikan Kabupaten Sleman",
    },
    "/master/opd": {
      title: "Master OPD",
      description: "Kelola daftar OPD tujuan rujukan",
    },
    "/master/wilayah": {
      title: "Master Wilayah",
      description: "Kelola data kapanewon & kalurahan",
    },
    "/master/risk-factors": {
      title: "Master Faktor Risiko",
      description: "Kelola kategori & faktor risiko",
    },
    "/master/intervention-types": {
      title: "Master Jenis Intervensi",
      description: "Kelola jenis intervensi OPD",
    },
    "/master/regulations": {
      title: "Master Regulasi",
      description: "Kelola daftar regulasi rujukan sistem",
    },
    "/reports": {
      title: "Laporan & Rekapitulasi",
      description: "Rekap kasus, statistik sekolah, dan ekspor data",
    },
  };

  let currentPage = pageConfig[location.pathname];

  if (!currentPage && location.pathname.startsWith("/cases/")) {
    currentPage = {
      title: "Detail Kasus",
      description: "Satu Kasus = Satu Siklus Penanganan",
    };
  }

  if (!currentPage && location.pathname.startsWith("/referrals/")) {
    currentPage = {
      title: "Detail Rujukan",
      description: "Rujukan siswa Putus Sekolah (DO) ke OPD",
    };
  }

  if (!currentPage) {
    currentPage = { title: "EWS-APS", description: "Kabupaten Sleman" };
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      {/* Left */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{currentPage.title}</h1>
        <p className="text-sm text-slate-500">{currentPage.description}</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => role === "OPD" && navigate("/referrals")}
          className="relative w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
        >
          <Bell size={20} />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
            {initial}
          </div>
          <div className="hidden md:block">
            <p className="font-semibold text-slate-800">{user?.name ?? "Pengguna"}</p>
            <p className="text-sm text-slate-500">{role ? ROLE_LABEL[role] : "-"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
