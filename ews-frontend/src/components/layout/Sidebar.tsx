import {
  LayoutDashboard,
  Users,
  School,
  LogOut,
  Map,
  Upload,
  Building2,
  BrainCircuit,
  FolderKanban,
  MapPin,
  AlertTriangle,
  ClipboardList,
  BookOpen,
  FileBarChart,
  UserX,
  Bell,
  BookHeart,
  HeartHandshake,
  Home,
  Bus,
  Briefcase,
  GraduationCap,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../store/auth.store";
import type { UserRole } from "../../types/api";

interface MenuItem {
  name: string;
  icon: LucideIcon;
  path: string;
  roles?: UserRole[];
}

interface MenuGroup {
  title: string;
  menus: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "MONITORING",
    menus: [
      {
        name: "Dashboard Dinas",
        icon: LayoutDashboard,
        path: "/dashboard",
        roles: ["ADMIN", "DINAS_PENDIDIKAN"],
      },
      {
        name: "Dashboard Sekolah",
        icon: LayoutDashboard,
        path: "/dashboard/school",
        roles: ["SEKOLAH"],
      },
      {
        name: "Dashboard OPD",
        icon: LayoutDashboard,
        path: "/dashboard/dinas",
        roles: ["OPD"],
      },
      {
        name: "Dashboard Kapanewon",
        icon: LayoutDashboard,
        path: "/dashboard/kapanewon",
        roles: ["KAPANEWON"],
      },
      { name: "Peta Risiko", icon: Map, path: "/risk-map" },
    ],
  },

  {
    title: "SISWA & PREDIKSI",
    menus: [
      { name: "Daftar Siswa", icon: Users, path: "/students" },
      { name: "Daftar Siswa", icon: Users, path: "/students1" },
      {
        name: "Siswa Putus Sekolah (DO)",
        icon: UserX,
        path: "/students/do",
        roles: ["ADMIN"],
      },
      {
        name: "Simulasi Prediksi",
        icon: BrainCircuit,
        path: "/predictions",
        roles: ["SEKOLAH"],
      },
      {
        name: "Upload & Prediksi Batch",
        icon: Upload,
        path: "/predictions/upload",
        roles: ["SEKOLAH"],
      },
    ],
  },
  {
    title: "PENCEGAHAN & PENANGANAN",
    menus: [
      { name: "Daftar Kasus", icon: FolderKanban, path: "/cases" },
      { name: "Rujukan Masuk", icon: Bell, path: "/referrals", roles: ["OPD"] },
    ],
  },
  {
    title: "MASTER DATA",
    menus: [
      { name: "User", icon: Users, path: "/master/users", roles: ["ADMIN"] },
      {
        name: "Sekolah",
        icon: School,
        path: "/master/schools",
        roles: ["ADMIN"],
      },
      { name: "OPD", icon: Building2, path: "/master/opd", roles: ["ADMIN"] },
      {
        name: "Wilayah",
        icon: MapPin,
        path: "/master/wilayah",
        roles: ["ADMIN"],
      },
      {
        name: "Faktor Risiko",
        icon: AlertTriangle,
        path: "/master/risk-factors",
        roles: ["ADMIN"],
      },
      {
        name: "Jenis Intervensi",
        icon: ClipboardList,
        path: "/master/intervention-types",
        roles: ["ADMIN"],
      },
      {
        name: "Regulasi",
        icon: BookOpen,
        path: "/master/regulations",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "MASTERING DATA SISWA",
    menus: [
      { name: "Agama", icon: BookHeart, path: "/master/agama", roles: ["ADMIN"] },
      {
        name: "Kebutuhan Khusus",
        icon: HeartHandshake,
        path: "/master/kebutuhan-khusus",
        roles: ["ADMIN"],
      },
      { name: "Jenis Tinggal", icon: Home, path: "/master/jenis-tinggal", roles: ["ADMIN"] },
      {
        name: "Alat Transportasi",
        icon: Bus,
        path: "/master/alat-transportasi",
        roles: ["ADMIN"],
      },
      {
        name: "Pekerjaan Orang Tua",
        icon: Briefcase,
        path: "/master/pekerjaan-ortu",
        roles: ["ADMIN"],
      },
      {
        name: "Pendidikan Orang Tua",
        icon: GraduationCap,
        path: "/master/pendidikan-ortu",
        roles: ["ADMIN"],
      },
      {
        name: "Penghasilan Orang Tua",
        icon: Wallet,
        path: "/master/penghasilan-ortu",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "LAPORAN",
    menus: [
      {
        name: "Laporan & Rekap",
        icon: FileBarChart,
        path: "/reports",
        roles: ["ADMIN", "DINAS_PENDIDIKAN"],
      },
    ],
  },
];

export default function Sidebar() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      menus: group.menus.filter(
        (m) => !m.roles || (role && m.roles.includes(role)),
      ),
    }))
    .filter((group) => group.menus.length > 0);

  // Semua path menu, dipakai untuk menentukan mana yang butuh exact-match ("end").
  // NavLink default melakukan partial match (mis. "/students" dianggap aktif juga di
  // "/students/do"), jadi item yang menjadi "awalan" dari path menu lain perlu di-exact-kan
  // supaya tidak ikut menyala saat sebenarnya sedang di menu lain.
  const allPaths = menuGroups.flatMap((g) => g.menus.map((m) => m.path));
  const needsExactMatch = (path: string) =>
    allPaths.some((p) => p !== path && p.startsWith(`${path}/`));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-72 bg-[#172339] text-white min-h-screen p-5 hidden md:flex flex-col">
      {/* LOGO */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-lg shadow-lg">
          EWS
        </div>
        <div>
          <h1 className="font-bold text-lg">EWS-APS</h1>
          <p className="text-sm text-slate-400">Kabupaten Sleman</p>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.title} className="mb-8">
            <p className="text-xs font-bold tracking-[0.2em] text-slate-500 mb-4 px-3">
              {group.title}
            </p>
            <div className="space-y-2">
              {group.menus.map((menu) => {
                const Icon = menu.icon;
                return (
                  <NavLink
                    key={menu.path}
                    to={menu.path}
                    end={needsExactMatch(menu.path)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={20} />
                    <span className="font-medium">{menu.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="pt-5 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
