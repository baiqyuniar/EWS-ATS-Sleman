import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Clock,
  School,
  Building2,
  Activity,
  Users,
  Search,
  Printer,
  FileText,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  HeartHandshake,
  HeartPulse,
  Banknote,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getRekap,
  getStatistikSekolah,
  getExportRows,
} from "../../services/reports.service";
import type { Case, CaseStatus, CaseSource } from "../../types/api";
import { exportRekapKasusExcel } from "../../utils/reportExcel";
import { useToast } from "../../context/ToastContext";
import CasePdfReportModal from "../../components/cases/CasePdfReportModal";

const STATUS_URUTAN: {
  status: CaseStatus;
  label: string;
  deskripsi: string;
  badgeBg: string;
  badgeText: string;
  progressColor: string;
}[] = [
  {
    status: "DRAFT",
    label: "Draf (Belum Dikirim)",
    deskripsi: "Laporan baru diketik dan tersimpan sebagai draf internal sekolah/warga.",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-600",
    progressColor: "bg-slate-400",
  },
  {
    status: "CASE_CREATED",
    label: "Kasus Baru Dibuat",
    deskripsi: "Laporan telah resmi masuk ke sistem dan tercatat sebagai nomor kasus baru.",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    progressColor: "bg-blue-500",
  },
  {
    status: "VERIFIKASI_NIK",
    label: "Verifikasi Data Anak (NIK)",
    deskripsi: "Sekolah sedang mengecek kebenaran identitas data kependudukan anak.",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    progressColor: "bg-indigo-500",
  },
  {
    status: "HOME_VISIT",
    label: "Kunjungan ke Rumah (Home Visit)",
    deskripsi: "Pihak sekolah berkunjung langsung ke rumah anak untuk mengidentifikasi kendala.",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    progressColor: "bg-amber-500",
  },
  {
    status: "SELESAI_PENCEGAHAN",
    label: "Selesai — Anak Kembali Bersekolah",
    deskripsi: "Anak berhasil diyakinkan kembali bersekolah, penanganan tuntas di level sekolah.",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    progressColor: "bg-emerald-500",
  },
  {
    status: "MENUNGGU_RUJUKAN",
    label: "Menunggu Dirujuk ke OPD",
    deskripsi: "Upaya sekolah belum membuahkan hasil, kasus siap diteruskan ke dinas teknis.",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    progressColor: "bg-orange-500",
  },
  {
    status: "DIRUJUK_OPD",
    label: "Sudah Dirujuk ke OPD",
    deskripsi: "Kasus telah diteruskan ke OPD/Puskesmas terkait yang berwenang menangani.",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    progressColor: "bg-purple-500",
  },
  {
    status: "INTERVENSI_BERJALAN",
    label: "Sedang Ditangani OPD",
    deskripsi: "OPD/Puskesmas sedang memberikan intervensi bantuan sosial/kesehatan/pelatihan.",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    progressColor: "bg-sky-500",
  },
  {
    status: "VERIFIKASI_PENYELESAIAN",
    label: "Verifikasi Hasil Penanganan",
    deskripsi: "Dinas Pendidikan memverifikasi apakah penanganan OPD telah selesai dan efektif.",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    progressColor: "bg-teal-500",
  },
  {
    status: "MONITORING",
    label: "Dipantau Berkala (Monitoring)",
    deskripsi: "Anak dipantau berkala setelah kembali sekolah agar tidak putus sekolah lagi.",
    badgeBg: "bg-cyan-50",
    badgeText: "text-cyan-700",
    progressColor: "bg-cyan-500",
  },
  {
    status: "CLOSED_CASE",
    label: "Kasus Selesai / Ditutup",
    deskripsi: "Seluruh siklus penanganan telah selesai dan kasus resmi ditutup permanen.",
    badgeBg: "bg-green-100",
    badgeText: "text-green-800",
    progressColor: "bg-green-600",
  },
];

const SUMBER_LABEL: Record<CaseSource, string> = {
  PELAPORAN_SEKOLAH: "Dilaporkan oleh Sekolah",
  PENGADUAN_MASYARAKAT: "Pengaduan dari Masyarakat",
};

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeTab, setActiveTab] = useState<"alur" | "kategori" | "sekolah">("alur");
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolPage, setSchoolPage] = useState(1);
  const [caseSearch, setCaseSearch] = useState("");
  const [casePage, setCasePage] = useState(1);
  const [selectedCaseForPdf, setSelectedCaseForPdf] = useState<Case | null>(null);

  const toast = useToast();

  // 1. Data Rekap Ringkas
  const { data: rekap } = useQuery({
    queryKey: ["reports-rekap", from, to],
    queryFn: () => getRekap({ from: from || undefined, to: to || undefined }),
  });

  // 2. Data Statistik Sekolah
  const { data: statistikSekolah, isLoading: loadingSekolah } = useQuery({
    queryKey: ["reports-statistik-sekolah"],
    queryFn: getStatistikSekolah,
  });

  // 3. Data Lengkap Kasus untuk Analisis Mendalam
  const { data: casesData, isLoading: loadingCases } = useQuery({
    queryKey: ["reports-export-cases", from, to],
    queryFn: () => getExportRows({ from: from || undefined, to: to || undefined }),
  });

  const allCases: Case[] = useMemo(() => {
    if (!casesData) return [];
    return Array.isArray(casesData) ? casesData : ((casesData as any)?.data ?? []);
  }, [casesData]);

  // Ekspor Excel (.xlsx) Lengkap
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      if (!allCases.length) {
        toast.warning("Tidak ada data kasus pada periode yang dipilih untuk diekspor");
        return;
      }
      exportRekapKasusExcel({ data: allCases, from, to });
      toast.success("File Laporan Rekap Excel (.xlsx) berhasil diunduh!", "Unduh Berhasil");
    } catch {
      toast.error("Gagal mengunduh laporan rekap Excel.", "Gagal");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Metrik perhitungan
  const totalKasus = rekap?.total ?? 0;
  const jumlahPerStatus = (status: CaseStatus) =>
    rekap?.byStatus.find((s) => s.status === status)?._count ?? 0;
  const jumlahPerSumber = (source: CaseSource) =>
    rekap?.bySource.find((s) => s.source === source)?._count ?? 0;

  const jumlahSelesai =
    jumlahPerStatus("SELESAI_PENCEGAHAN") + jumlahPerStatus("CLOSED_CASE");
  const jumlahBelumSelesai = totalKasus - jumlahSelesai;
  const persenSelesai = totalKasus > 0 ? Math.round((jumlahSelesai / totalKasus) * 100) : 0;
  const persenBelumSelesai = totalKasus > 0 ? Math.round((jumlahBelumSelesai / totalKasus) * 100) : 0;

  const sekolahCount = jumlahPerSumber("PELAPORAN_SEKOLAH");
  const masyarakatCount = jumlahPerSumber("PENGADUAN_MASYARAKAT");

  // Rujukan OPD & Puskesmas
  const { opdStats, totalReferrals } = useMemo(() => {
    const statsMap = new Map<string, { nama: string; total: number; menunggu: number; berjalan: number; selesai: number }>();
    let totalRef = 0;

    allCases.forEach((c) => {
      (c.referrals || []).forEach((r) => {
        totalRef++;
        const opdName = r.opd?.nama || "OPD Terkait";
        const entry = statsMap.get(opdName) || {
          nama: opdName,
          total: 0,
          menunggu: 0,
          berjalan: 0,
          selesai: 0,
        };
        entry.total++;
        if (r.status === "MENUNGGU") entry.menunggu++;
        else if (r.status === "SELESAI_DISETUJUI") entry.selesai++;
        else entry.berjalan++;
        statsMap.set(opdName, entry);
      });
    });

    return {
      opdStats: Array.from(statsMap.values()).sort((a, b) => b.total - a.total),
      totalReferrals: totalRef,
    };
  }, [allCases]);

  // Sebaran per Kapanewon
  const kapanewonStats = useMemo(() => {
    const map = new Map<string, number>();
    allCases.forEach((c) => {
      const kap = c.student?.school?.kapanewon || "Wilayah Belum Tercatat";
      map.set(kap, (map.get(kap) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([kapanewon, count]) => ({ kapanewon, count }))
      .sort((a, b) => b.count - a.count);
  }, [allCases]);

  // Preset Periode
  const handlePreset = (type: "all" | "this-month" | "this-year") => {
    const now = new Date();
    if (type === "all") {
      setFrom("");
      setTo("");
    } else if (type === "this-month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const today = now.toISOString().slice(0, 10);
      setFrom(firstDay);
      setTo(today);
    } else if (type === "this-year") {
      setFrom(`${now.getFullYear()}-01-01`);
      setTo(`${now.getFullYear()}-12-31`);
    }
  };

  // Filter Tabel Sekolah
  const filteredSchools = useMemo(() => {
    if (!statistikSekolah) return [];
    return statistikSekolah
      .filter((s) => {
        const q = schoolSearch.toLowerCase();
        return s.nama.toLowerCase().includes(q) || s.npsn.includes(q);
      })
      .sort((a, b) => b.total - a.total);
  }, [statistikSekolah, schoolSearch]);

  const schoolPageSize = 8;
  const paginatedSchools = useMemo(() => {
    const start = (schoolPage - 1) * schoolPageSize;
    return filteredSchools.slice(start, start + schoolPageSize);
  }, [filteredSchools, schoolPage]);
  const totalSchoolPages = Math.ceil(filteredSchools.length / schoolPageSize) || 1;

  // Filter Tabel Kasus (untuk cetak PDF)
  const filteredCases = useMemo(() => {
    return allCases.filter((c) => {
      const q = caseSearch.toLowerCase();
      const nama = c.student?.nama?.toLowerCase() || "";
      const nomor = c.nomorKasus.toLowerCase();
      const sekolah = c.student?.school?.nama?.toLowerCase() || "";
      return nama.includes(q) || nomor.includes(q) || sekolah.includes(q);
    });
  }, [allCases, caseSearch]);

  const casePageSize = 6;
  const paginatedCases = useMemo(() => {
    const start = (casePage - 1) * casePageSize;
    return filteredCases.slice(start, start + casePageSize);
  }, [filteredCases, casePage]);
  const totalCasePages = Math.ceil(filteredCases.length / casePageSize) || 1;

  // 4 Fase Pipeline Penanganan
  const fase1Laporan = jumlahPerStatus("DRAFT") + jumlahPerStatus("CASE_CREATED") + jumlahPerStatus("VERIFIKASI_NIK");
  const fase2Sekolah = jumlahPerStatus("HOME_VISIT");
  const fase3Opd = jumlahPerStatus("MENUNGGU_RUJUKAN") + jumlahPerStatus("DIRUJUK_OPD") + jumlahPerStatus("INTERVENSI_BERJALAN");
  const fase4Selesai = jumlahPerStatus("VERIFIKASI_PENYELESAIAN") + jumlahPerStatus("MONITORING") + jumlahPerStatus("SELESAI_PENCEGAHAN") + jumlahPerStatus("CLOSED_CASE");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ========================================================= */}
        {/* COMPACT TOOLBAR: PERIODE FILTER & EKSPOR EXCEL            */}
        {/* ========================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs px-5 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Sisi Kiri: Filter Periode & Presets */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-slate-500">
              <Calendar size={15} className="text-blue-600" />
              <span>Periode:</span>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handlePreset("all")}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  !from && !to
                    ? "bg-white text-blue-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua Waktu
              </button>
              <button
                type="button"
                onClick={() => handlePreset("this-month")}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handlePreset("this-year")}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
              >
                Tahun 2026
              </button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-slate-400 font-medium">s/d</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Sisi Kanan: Tombol Unduh Rekap Excel (.xlsx) */}
          <div className="flex items-center shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel || !allCases.length}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50 shadow-xs cursor-pointer"
              title="Unduh Laporan Rekapitulasi Lengkap Format Excel (.xlsx)"
            >
              {isExportingExcel ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={15} />
              )}
              <span>Unduh Rekap Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4 KARTU METRIK EKSEKUTIF                                 */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Kasus */}
          <div className="bg-gradient-to-br from-blue-50/70 to-white rounded-3xl border border-blue-100/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Total Kasus Tercatat
              </span>
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Layers size={16} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">{totalKasus}</span>
              <span className="text-xs text-slate-500 font-medium">kasus ATS</span>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-100/60 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <School size={13} className="text-blue-500" /> {sekolahCount} Sekolah
              </span>
              <span className="flex items-center gap-1">
                <Users size={13} className="text-indigo-500" /> {masyarakatCount} Warga
              </span>
            </div>
          </div>

          {/* Card 2: Tingkat Keberhasilan Selesai */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-white rounded-3xl border border-emerald-100/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Kasus Selesai
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-900">{jumlahSelesai}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {persenSelesai}% Sukses
              </span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${persenSelesai}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" /> Anak kembali bersekolah
              </p>
            </div>
          </div>

          {/* Card 3: Kasus Aktif Sedang Ditangani */}
          <div className="bg-gradient-to-br from-amber-50/70 to-white rounded-3xl border border-amber-100/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Kasus Dalam Penanganan
              </span>
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock size={16} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-900">{jumlahBelumSelesai}</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {persenBelumSelesai}% Aktif
              </span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${persenBelumSelesai}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={13} className="text-amber-600" /> Dalam verifikasi/visit/intervensi
              </p>
            </div>
          </div>

          {/* Card 4: Kolaborasi Lintas OPD */}
          <div className="bg-gradient-to-br from-purple-50/70 to-white rounded-3xl border border-purple-100/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                Rujukan Multi-OPD
              </span>
              <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Building2 size={16} />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-purple-900">{totalReferrals}</span>
              <span className="text-xs text-slate-500 font-medium">total rujukan</span>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-100/60 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <HeartHandshake size={13} className="text-purple-500" /> {opdStats.length} Instansi / Puskesmas
              </span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                Lintas Sektor
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB NAVIGASI                                             */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("alur")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "alur"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity size={16} className={activeTab === "alur" ? "text-blue-600" : "text-slate-400"} />
            <span>Alur & Status Penanganan</span>
          </button>

          <button
            onClick={() => setActiveTab("kategori")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "kategori"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 size={16} className={activeTab === "kategori" ? "text-purple-600" : "text-slate-400"} />
            <span>Kategori Masalah & Aksi OPD</span>
          </button>

          <button
            onClick={() => setActiveTab("sekolah")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "sekolah"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <School size={16} className={activeTab === "sekolah" ? "text-emerald-600" : "text-slate-400"} />
            <span>Statistik Sekolah & Cetak PDF</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ALUR & STATUS PENANGANAN KASUS                    */}
        {/* ========================================================= */}
        {activeTab === "alur" && (
          <div className="space-y-6">
            {/* Visual Pipeline 4 Fase */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                Pipeline 4 Fase Penanganan Kasus
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Progres seluruh kasus anak tidak sekolah mengalir dari pelaporan awal hingga berhasil kembali bersekolah.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                {/* Fase 1 */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Fase 1: Penerimaan
                    </span>
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-800">{fase1Laporan}</p>
                  <p className="text-xs text-slate-500 mt-1">Draf, Kasus Baru, & Verifikasi NIK</p>
                </div>

                {/* Fase 2 */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      Fase 2: Intervensi Sekolah
                    </span>
                    <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <p className="text-2xl font-black text-amber-900">{fase2Sekolah}</p>
                  <p className="text-xs text-amber-700 mt-1">Kunjungan Rumah (Home Visit)</p>
                </div>

                {/* Fase 3 */}
                <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                      Fase 3: Rujukan OPD
                    </span>
                    <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-800 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <p className="text-2xl font-black text-purple-900">{fase3Opd}</p>
                  <p className="text-xs text-purple-700 mt-1">Dirujuk ke Dinas / 25 Puskesmas</p>
                </div>

                {/* Fase 4 */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Fase 4: Tuntas & Kembali
                    </span>
                    <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                  </div>
                  <p className="text-2xl font-black text-emerald-900">{fase4Selesai}</p>
                  <p className="text-xs text-emerald-700 mt-1">Kembali Sekolah & Kasus Ditutup</p>
                </div>
              </div>
            </div>

            {/* Grid 2 Kolom: Detail 11 Status vs Top Kapanewon */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Kolom Kiri: 11 Rincian Status */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 text-sm mb-1">
                  Rincian 11 Tahapan Status Penanganan
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Distribusi riil kasus pada setiap langkah alur Standar Operasional Prosedur (SOP).
                </p>

                <div className="space-y-2.5">
                  {STATUS_URUTAN.map(({ status, label, deskripsi, progressColor, badgeBg, badgeText }) => {
                    const jumlah = jumlahPerStatus(status);
                    const persen = totalKasus > 0 ? Math.round((jumlah / totalKasus) * 100) : 0;
                    return (
                      <div
                        key={status}
                        className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 transition flex items-center gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeBg} ${badgeText}`}>
                              {status}
                            </span>
                            <p className="text-xs font-bold text-slate-800 truncate">{label}</p>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{deskripsi}</p>
                        </div>

                        <div className="w-24 shrink-0">
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${persen}%` }} />
                          </div>
                        </div>

                        <div className="w-14 text-right shrink-0">
                          <span className="text-xs font-extrabold text-slate-800">{jumlah}</span>
                          <span className="text-[11px] text-slate-400"> ({persen}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kolom Kanan: Top Kapanewon & Sumber Laporan */}
              <div className="lg:col-span-5 space-y-6">
                {/* Sebaran Wilayah Kapanewon */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                    <MapPin size={16} className="text-red-500" />
                    Konsentrasi Kasus per Kapanewon
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Kapanewon dengan jumlah kasus tertinggi di Kabupaten Sleman.
                  </p>

                  <div className="space-y-3">
                    {kapanewonStats.slice(0, 6).map((item, idx) => {
                      const persen = totalKasus > 0 ? Math.round((item.count / totalKasus) * 100) : 0;
                      return (
                        <div key={item.kapanewon}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                              <span className="w-4 text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                              Kapanewon {item.kapanewon}
                            </span>
                            <span className="font-bold text-slate-800">{item.count} kasus ({persen}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${persen}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Komposisi Sumber Pengaduan */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    Sumber Pengaduan & Asal Kasus
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Perbandingan kasus yang berasal dari pelaporan aktif guru vs aduan masyarakat.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
                      <School size={18} className="text-blue-600 mb-1" />
                      <p className="text-xs text-slate-500">Dari Sekolah</p>
                      <p className="text-xl font-bold text-blue-900 mt-0.5">{sekolahCount}</p>
                      <span className="text-[10px] text-blue-700 font-semibold">
                        {totalKasus > 0 ? Math.round((sekolahCount / totalKasus) * 100) : 0}% Laporan Guru
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <Users size={18} className="text-indigo-600 mb-1" />
                      <p className="text-xs text-slate-500">Dari Warga</p>
                      <p className="text-xl font-bold text-indigo-900 mt-0.5">{masyarakatCount}</p>
                      <span className="text-[10px] text-indigo-700 font-semibold">
                        {totalKasus > 0 ? Math.round((masyarakatCount / totalKasus) * 100) : 0}% Aduan Warga
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: KATEGORI KASUS & AKSI OPD                         */}
        {/* ========================================================= */}
        {activeTab === "kategori" && (
          <div className="space-y-6">
            {/* Bagian 1: 4 Kategori Permasalahan Anak */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                Klasifikasi Kategori Masalah Anak Putus Sekolah
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Pemetaan faktor pemicu anak tidak bersekolah untuk menentukan intervensi OPD yang presisi.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Ekonomi */}
                <div className="p-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <Banknote size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Faktor Ekonomi</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Ketidakmampuan biaya perlengkapan/seragam, siswa bekerja membantu orang tua, atau kemiskinan ekstrem.
                  </p>
                  <div className="mt-3 pt-3 border-t border-emerald-100/60 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <Building2 size={13} /> Mitra: Dinas Sosial, Baznas
                  </div>
                </div>

                {/* 2. Kesehatan */}
                <div className="p-4 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/50 to-white">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
                    <HeartPulse size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Faktor Kesehatan</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Sakit fisik berkepanjangan, disabilitas, kebutuhan khusus yang belum terfasilitasi, atau masalah psikologis.
                  </p>
                  <div className="mt-3 pt-3 border-t border-rose-100/60 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
                    <Building2 size={13} /> Mitra: Dinkes & 25 Puskesmas
                  </div>
                </div>

                {/* 3. Keluarga & Sosial */}
                <div className="p-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                    <Users size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Faktor Keluarga</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Keluarga broken home, anak yatim/piatu tanpa wali, penelantaran anak, atau pernikahan dini.
                  </p>
                  <div className="mt-3 pt-3 border-t border-blue-100/60 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                    <Building2 size={13} /> Mitra: DP3AP2KB
                  </div>
                </div>

                {/* 4. Akademik & Perilaku */}
                <div className="p-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                    <GraduationCap size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Faktor Akademik</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Korban perundungan (bullying), sering membolos, merasa tertinggal materi, atau rendahnya motivasi belajar.
                  </p>
                  <div className="mt-3 pt-3 border-t border-purple-100/60 flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
                    <Building2 size={13} /> Mitra: Dinas Pendidikan & Guru BK
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 2: Tabel Rekapitulasi Rujukan per OPD / Instansi */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Building2 size={18} className="text-purple-600" />
                  Rekapitulasi Keterlibatan OPD & Puskesmas
                </h3>
                <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  {opdStats.length} Instansi Terlibat
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Jumlah kasus yang dirujuk ke masing-masing OPD beserta progres intervensi tindak lanjut.
              </p>

              {opdStats.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada rujukan kasus ke OPD pada periode terpilih.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-100">
                        <th className="px-4 py-2.5 font-semibold">Nama OPD / Puskesmas</th>
                        <th className="px-4 py-2.5 font-semibold text-center">Menunggu Penanganan</th>
                        <th className="px-4 py-2.5 font-semibold text-center">Intervensi Berjalan</th>
                        <th className="px-4 py-2.5 font-semibold text-center">Selesai Ditangani</th>
                        <th className="px-4 py-2.5 font-semibold text-right">Total Rujukan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opdStats.map((row) => (
                        <tr key={row.nama} className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-bold text-slate-800 uppercase flex items-center gap-2">
                            <Building2 size={14} className="text-slate-400 shrink-0" />
                            {row.nama}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                              {row.menunggu}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                              {row.berjalan}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                              {row.selesai}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-800">
                            {row.total} kasus
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STATISTIK SEKOLAH & CETAK PDF KASUS                */}
        {/* ========================================================= */}
        {activeTab === "sekolah" && (
          <div className="space-y-6">
            {/* Bagian A: Tabel Statistik Kasus per Sekolah */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <School size={18} className="text-emerald-600" />
                    Statistik Kasus Berdasarkan Sekolah Asal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data agregasi kasus sepanjang waktu berdasarkan NPSN resmi Kemendikbud.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      setSchoolPage(1);
                    }}
                    placeholder="Cari nama sekolah / NPSN..."
                    className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {loadingSekolah ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                  <Loader2 size={16} className="animate-spin" /> Memuat data sekolah...
                </div>
              ) : paginatedSchools.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ditemukan data sekolah yang sesuai pencarian.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-100">
                        <th className="px-4 py-2.5 font-semibold">NPSN</th>
                        <th className="px-4 py-2.5 font-semibold">Nama Sekolah</th>
                        <th className="px-4 py-2.5 font-semibold">Total Kasus</th>
                        <th className="px-4 py-2.5 font-semibold">Kasus Aktif</th>
                        <th className="px-4 py-2.5 font-semibold text-right">Status Penanganan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSchools.map((row) => (
                        <tr key={row.npsn} className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-mono text-slate-500">{row.npsn}</td>
                          <td className="px-4 py-3 font-bold text-slate-800 uppercase">{row.nama}</td>
                          <td className="px-4 py-3 text-slate-700 font-semibold">{row.total} kasus</td>
                          <td className="px-4 py-3 text-slate-700 font-semibold">{row.aktif} kasus</td>
                          <td className="px-4 py-3 text-right">
                            {row.aktif > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1">
                                <Clock size={12} /> {row.aktif} Masih Ditangani
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1">
                                <CheckCircle2 size={12} /> Selesai Semua
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Sekolah */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Halaman {schoolPage} dari {totalSchoolPages} (Total {filteredSchools.length} sekolah)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSchoolPage((p) => Math.max(1, p - 1))}
                        disabled={schoolPage <= 1}
                        className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        Sebelumnya
                      </button>
                      <button
                        onClick={() => setSchoolPage((p) => Math.min(totalSchoolPages, p + 1))}
                        disabled={schoolPage >= totalSchoolPages}
                        className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bagian B: Direktori Kasus dengan Tombol Cetak PDF Sekali Klik */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    Direktori Kasus & Cetak Berkas Riwayat PDF
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cetak langsung dokumen resmi laporan riwayat tindakan dan intervensi per siswa tanpa harus membuka detail kasus.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={caseSearch}
                    onChange={(e) => {
                      setCaseSearch(e.target.value);
                      setCasePage(1);
                    }}
                    placeholder="Cari siswa / no kasus..."
                    className="w-full pl-9 pr-4 py-2 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {loadingCases ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                  <Loader2 size={16} className="animate-spin" /> Memuat data kasus...
                </div>
              ) : paginatedCases.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ditemukan kasus yang cocok dengan pencarian.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-100">
                        <th className="px-4 py-2.5 font-semibold">Nomor Kasus</th>
                        <th className="px-4 py-2.5 font-semibold">Nama Siswa</th>
                        <th className="px-4 py-2.5 font-semibold">Sekolah Asal</th>
                        <th className="px-4 py-2.5 font-semibold">Sumber</th>
                        <th className="px-4 py-2.5 font-semibold">Status Saat Ini</th>
                        <th className="px-4 py-2.5 font-semibold text-right">Aksi Cetak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCases.map((c) => {
                        const isResolved =
                          c.status === "SELESAI_PENCEGAHAN" || c.status === "CLOSED_CASE";
                        return (
                          <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-mono font-bold text-blue-700">{c.nomorKasus}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800 uppercase">{c.student?.nama || "-"}</p>
                              <p className="text-[10px] text-slate-400 font-mono">NISN: {c.student?.nisn || "-"}</p>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-600 uppercase">
                              {c.student?.school?.nama || "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {SUMBER_LABEL[c.source] || c.source}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isResolved
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setSelectedCaseForPdf(c)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition font-medium cursor-pointer"
                                title="Buka dan Cetak Laporan PDF Kasus"
                              >
                                <Printer size={14} />
                                <span>Cetak PDF</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination Kasus */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Halaman {casePage} dari {totalCasePages} (Total {filteredCases.length} kasus)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCasePage((p) => Math.max(1, p - 1))}
                        disabled={casePage <= 1}
                        className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        Sebelumnya
                      </button>
                      <button
                        onClick={() => setCasePage((p) => Math.min(totalCasePages, p + 1))}
                        disabled={casePage >= totalCasePages}
                        className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Cetak PDF Kasus Resmi */}
      {selectedCaseForPdf && (
        <CasePdfReportModal
          kase={selectedCaseForPdf}
          onClose={() => setSelectedCaseForPdf(null)}
        />
      )}
    </DashboardLayout>
  );
}
