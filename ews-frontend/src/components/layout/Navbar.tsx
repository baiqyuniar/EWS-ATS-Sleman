import { Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../hooks/useAuth";
import { ROLE_LABEL } from "../../types/api";
import { getReferrals } from "../../services/referral.service";
import {
  LayoutDashboard,
  MapPinned,
  BrainCircuit,
  ChartNoAxesCombined,
  GraduationCap,
  Users,
  School,
  Building2,
  TriangleAlert,
  HandHelping,
  BookOpen,
  FileSpreadsheet,
  FolderKanban,
  ClipboardList,
  Megaphone,
  Send,
  LogIn,
  UserX,
  BookHeart,
  HeartHandshake,
  House,
  Bus,
  Briefcase,
  Wallet,
} from "lucide-react";

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

  const pageConfig: Record<
  string,
  {
    title: string;
    description: string;
    icon?: React.ReactNode;
    iconBg?: string;
  }
    > = {
        "/dashboard": {
      title: "Dashboard Gandheng-ATS",
      description: "Monitoring risiko anak tidak sekolah Kabupaten Sleman",
      icon: <LayoutDashboard size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
    },
    "/dashboard/school":{
      title: "Dashboard Sekolah",
      description: "Monitoring risiko anak tidak sekolah Kabupaten Sleman",
      icon: <LayoutDashboard size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
    },
    "/dashboard/dinas":{
      title: "Dashboard OPD",
      description: "Monitoring risiko anak tidak sekolah Kabupaten Sleman",
      icon: <LayoutDashboard size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
    },
    "/dashboard/dinas1":{
      title: "Dashboard OPD",
      description: "Monitoring risiko anak tidak sekolah Kabupaten Sleman",
      icon: <LayoutDashboard size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
    },
    "/risk-map": {
      title: "Peta Risiko Kabupaten Sleman",
      description: "Visualisasi persebaran risiko anak tidak sekolah",
      icon: <MapPinned size={20} />,
      iconBg: "bg-red-50 text-red-600",
    },

    "/students": {
      title: "Daftar Siswa Aktif",
      description: "Data induk siswa aktif lintas sekolah Kabupaten Sleman",
      icon: <Users size={20} />,
      iconBg: "bg-sky-50 text-sky-600",
    },

    "/students/do": {
      title: "Siswa Putus Sekolah",
      description: "Daftar siswa DO dan rujukan langsung ke OPD",
      icon: <UserX size={20} />,
      iconBg: "bg-rose-50 text-rose-600",
    },

    "/predictions": {
      title: "Simulasi Prediksi Risiko",
      description: "Hasil prediksi hanya rekomendasi",
      icon: <BrainCircuit size={20} />,
      iconBg: "bg-indigo-50 text-indigo-600",
    },

    "/predictions/upload": {
      title: "Prediksi Batch",
      description: "Upload CSV dan lakukan prediksi massal",
      icon: <FileSpreadsheet size={20} />,
      iconBg: "bg-cyan-50 text-cyan-600",
    },

    "/cases": {
      title: "Daftar Kasus",
      description: "Monitoring penanganan anak putus sekolah",
      icon: <FolderKanban size={20} />,
      iconBg: "bg-orange-50 text-orange-600",
    },

    "/cases/new/pelaporan": {
      title: "Pelaporan Sekolah",
      description: "Pelaporan siswa berisiko putus sekolah",
      icon: <ClipboardList size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
    },

    "/cases/new/pengaduan": {
      title: "Pengaduan Masyarakat",
      description: "Pelaporan masyarakat kepada Kapanewon",
      icon: <Megaphone size={20} />,
      iconBg: "bg-pink-50 text-pink-600",
    },

    "/referrals": {
      title: "Rujukan OPD",
      description: "Daftar rujukan siswa ke OPD",
      icon: <Send size={20} />,
      iconBg: "bg-violet-50 text-violet-600",
    },

    "/reports": {
      title: "Laporan & Rekapitulasi",
      description: "Rekap kasus, statistik sekolah, dan ekspor data",
      icon: <ChartNoAxesCombined size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
    },

    "/master/users": {
      title: "Master User",
      description: "Kelola akun pengguna sistem",
      icon: <Users size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
    },

    "/master/schools": {
      title: "Master Sekolah",
      description: "Kelola data satuan pendidikan",
      icon: <School size={20} />,
      iconBg: "bg-teal-50 text-teal-600",
    },

    "/master/opd": {
      title: "Master OPD",
      description: "Kelola daftar Organisasi Perangkat Daerah",
      icon: <Building2 size={20} />,
      iconBg: "bg-fuchsia-50 text-fuchsia-600",
    },

    "/master/wilayah": {
      title: "Master Wilayah",
      description: "Kelola kapanewon dan kalurahan",
      icon: <MapPinned size={20} />,
      iconBg: "bg-lime-50 text-lime-600",
    },

    "/master/risk-factors": {
      title: "Master Faktor Risiko",
      description: "Kelola faktor risiko anak tidak sekolah",
      icon: <TriangleAlert size={20} />,
      iconBg: "bg-red-50 text-red-600",
    },

    "/master/intervention-types": {
      title: "Master Intervensi",
      description: "Kelola jenis intervensi OPD",
      icon: <HandHelping size={20} />,
      iconBg: "bg-yellow-50 text-yellow-600",
    },

    "/master/regulations": {
      title: "Master Regulasi",
      description: "Kelola regulasi sistem",
      icon: <BookOpen size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
    },
    "/master/agama": {
    title: "Master Agama",
    description: "Kelola data referensi agama",
    icon: <BookHeart size={20} />,
    iconBg: "bg-purple-50 text-purple-600",
  },

  "/master/kebutuhan-khusus": {
    title: "Master Kebutuhan Khusus",
    description: "Kelola data kebutuhan khusus",
    icon: <HeartHandshake size={20} />,
    iconBg: "bg-pink-50 text-pink-600",
  },

  "/master/jenis-tinggal": {
    title: "Master Jenis Tinggal",
    description: "Kelola data jenis tempat tinggal",
    icon: <House size={20} />,
    iconBg: "bg-orange-50 text-orange-600",
  },

  "/master/alat-transportasi": {
    title: "Master Alat Transportasi",
    description: "Kelola data alat transportasi siswa",
    icon: <Bus size={20} />,
    iconBg: "bg-cyan-50 text-cyan-600",
  },

  "/master/pekerjaan-ortu": {
    title: "Master Pekerjaan Orang Tua",
    description: "Kelola data pekerjaan orang tua",
    icon: <Briefcase size={20} />,
    iconBg: "bg-amber-50 text-amber-600",
  },

  "/master/pendidikan-ortu": {
    title: "Master Pendidikan Orang Tua",
    description: "Kelola data pendidikan orang tua",
    icon: <GraduationCap size={20} />,
    iconBg: "bg-indigo-50 text-indigo-600",
  },

  "/master/penghasilan-ortu": {
    title: "Master Penghasilan Orang Tua",
    description: "Kelola data penghasilan orang tua",
    icon: <Wallet size={20} />,
    iconBg: "bg-emerald-50 text-emerald-600",
  },
    "/login": {
      title: "Login",
      description: "Masuk ke sistem EWS ATS",
      icon: <LogIn size={20} />,
      iconBg: "bg-gray-100 text-gray-700",
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
          <div className="flex items-center gap-4">
      {currentPage.icon && (
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${currentPage.iconBg}`}
        >
          {currentPage.icon}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">
          {currentPage.title}
        </h1>
        <p className="text-sm text-slate-500">
          {currentPage.description}
        </p>
      </div>
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
