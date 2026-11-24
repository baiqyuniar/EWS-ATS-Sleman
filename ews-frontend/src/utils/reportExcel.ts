import * as XLSX from "xlsx";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draf (belum dikirim)",
  CASE_CREATED: "Kasus Baru Dibuat",
  VERIFIKASI_NIK: "Verifikasi Data Siswa (NIK)",
  HOME_VISIT: "Kunjungan ke Rumah (Home Visit)",
  SELESAI_PENCEGAHAN: "Selesai - Kembali Bersekolah",
  MENUNGGU_RUJUKAN: "Menunggu Dirujuk ke OPD",
  DIRUJUK_OPD: "Sudah Dirujuk ke OPD",
  INTERVENSI_BERJALAN: "Sedang Ditangani (Intervensi Berjalan)",
  VERIFIKASI_PENYELESAIAN: "Verifikasi Hasil Penanganan",
  MONITORING: "Dipantau Berkala (Monitoring)",
  CLOSED_CASE: "Kasus Selesai / Ditutup",
};

const SOURCE_LABELS: Record<string, string> = {
  PELAPORAN_SEKOLAH: "Pelaporan Sekolah",
  PENGADUAN_MASYARAKAT: "Pengaduan Masyarakat",
};

export function exportRekapKasusExcel({
  data,
  from,
  to,
}: {
  data: any[];
  from?: string;
  to?: string;
}) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);
  const periodeStr = from || to ? `${from || "Awal"} s/d ${to || "Sekarang"}` : "Semua Periode";

  // Hitung metrik
  const totalKasus = data.length;
  const resolvedList = data.filter(
    (c) => c.status === "SELESAI_PENCEGAHAN" || c.status === "CLOSED_CASE"
  );
  const unresolvedList = data.filter(
    (c) => c.status !== "SELESAI_PENCEGAHAN" && c.status !== "CLOSED_CASE"
  );

  const sekolahList = data.filter((c) => c.source === "PELAPORAN_SEKOLAH");
  const masyarakatList = data.filter((c) => c.source === "PENGADUAN_MASYARAKAT");

  // ==========================================
  // SHEET 1: RINGKASAN REKAP
  // ==========================================
  const summaryRows: any[][] = [
    ["PEMERINTAH KABUPATEN SLEMAN - DINAS PENDIDIKAN"],
    ["LAPORAN REKAPITULASI PENANGANAN ANAK PUTUS SEKOLAH (EWS-APS)"],
    [`Periode Laporan: ${periodeStr}`],
    [`Tanggal Unduh: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`],
    [],
    ["1. RINGKASAN STATUS PENYELESAIAN KASUS"],
    ["Kategori Penyelesaian", "Jumlah Kasus", "Persentase (%)", "Keterangan"],
    [
      "Kasus Sudah Terselesaikan",
      resolvedList.length,
      totalKasus > 0 ? Number(((resolvedList.length / totalKasus) * 100).toFixed(1)) : 0,
      "Kasus dengan status Selesai Pencegahan (kembali bersekolah) atau Closed Case",
    ],
    [
      "Kasus Belum Terselesaikan (Dalam Penanganan)",
      unresolvedList.length,
      totalKasus > 0 ? Number(((unresolvedList.length / totalKasus) * 100).toFixed(1)) : 0,
      "Kasus yang masih dalam tahap verifikasi, kunjungan rumah, rujukan, atau intervensi OPD",
    ],
    ["TOTAL KASUS", totalKasus, 100, "Seluruh kasus yang tercatat dalam periode ini"],
    [],
    ["2. REKAPITULASI BERDASARKAN JENIS / SUMBER KASUS"],
    ["Jenis / Sumber Kasus", "Sudah Selesai", "Belum Selesai", "Total Kasus", "Persentase (%)"],
    [
      "Pelaporan oleh Pihak Sekolah",
      sekolahList.filter((c) => c.status === "SELESAI_PENCEGAHAN" || c.status === "CLOSED_CASE").length,
      sekolahList.filter((c) => c.status !== "SELESAI_PENCEGAHAN" && c.status !== "CLOSED_CASE").length,
      sekolahList.length,
      totalKasus > 0 ? Number(((sekolahList.length / totalKasus) * 100).toFixed(1)) : 0,
    ],
    [
      "Pengaduan oleh Masyarakat",
      masyarakatList.filter((c) => c.status === "SELESAI_PENCEGAHAN" || c.status === "CLOSED_CASE").length,
      masyarakatList.filter((c) => c.status !== "SELESAI_PENCEGAHAN" && c.status !== "CLOSED_CASE").length,
      masyarakatList.length,
      totalKasus > 0 ? Number(((masyarakatList.length / totalKasus) * 100).toFixed(1)) : 0,
    ],
    [
      "TOTAL",
      resolvedList.length,
      unresolvedList.length,
      totalKasus,
      100,
    ],
    [],
    ["3. RINCIAN KASUS PER TAHAPAN ALUR PENANGANAN"],
    ["Kode Status", "Nama Tahapan Alur", "Jumlah Kasus", "Kategori Penyelesaian"],
  ];

  Object.entries(STATUS_LABELS).forEach(([code, label]) => {
    const count = data.filter((c) => c.status === code).length;
    const isDone = code === "SELESAI_PENCEGAHAN" || code === "CLOSED_CASE";
    summaryRows.push([
      code,
      label,
      count,
      isDone ? "Sudah Terselesaikan" : "Belum Terselesaikan (Aktif)",
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  // Set lebar kolom sheet 1
  wsSummary["!cols"] = [{ wch: 45 }, { wch: 25 }, { wch: 18 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Rekap");

  // ==========================================
  // SHEET 2: KASUS BELUM SELESAI
  // ==========================================
  const unresolvedData = unresolvedList.map((c, i) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(c.createdAt).getTime()) / (1000 * 3600 * 24)
    );
    const opdNames = (c.referrals || [])
      .map((r: any) => r.opd?.nama)
      .filter(Boolean)
      .join(", ");

    return {
      No: i + 1,
      "No. Kasus": c.nomorKasus,
      "Nama Siswa": (c.student?.nama || "-").toUpperCase(),
      NISN: c.student?.nisn || "-",
      NIK: c.student?.nik || "-",
      Sekolah: c.student?.school?.nama ? c.student.school.nama.toUpperCase() : "-",
      Kelas: c.student?.kelas || "-",
      "Jenis Kasus": SOURCE_LABELS[c.source] || c.source,
      "Status Penanganan Saat Ini": STATUS_LABELS[c.status] || c.status,
      "OPD Rujukan": opdNames || "Belum Dirujuk",
      "Jml Visit": c.homeVisits?.length ?? 0,
      "Tanggal Masuk": new Date(c.createdAt).toLocaleDateString("id-ID"),
      "Lama Kasus (Hari)": days,
      "Isi / Catatan Kasus": c.report?.isiLaporan || c.catatan || "-",
    };
  });

  const wsUnresolved = XLSX.utils.json_to_sheet(
    unresolvedData.length > 0
      ? unresolvedData
      : [{ Keterangan: "Tidak ada kasus belum selesai pada periode ini" }]
  );
  wsUnresolved["!cols"] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 32 },
    { wch: 8 },
    { wch: 22 },
    { wch: 35 },
    { wch: 25 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsUnresolved, "Kasus Belum Selesai");

  // ==========================================
  // SHEET 3: KASUS SUDAH SELESAI
  // ==========================================
  const resolvedData = resolvedList.map((c, i) => {
    const dateStart = new Date(c.createdAt);
    const dateEnd = c.closedAt ? new Date(c.closedAt) : new Date(c.updatedAt);
    const days = Math.max(1, Math.floor((dateEnd.getTime() - dateStart.getTime()) / (1000 * 3600 * 24)));

    const opdNames = (c.referrals || [])
      .map((r: any) => r.opd?.nama)
      .filter(Boolean)
      .join(", ");

    const totalIntervensi = (c.referrals || []).reduce(
      (acc: number, r: any) => acc + (r.interventions?.length ?? 0),
      0
    );

    return {
      No: i + 1,
      "No. Kasus": c.nomorKasus,
      "Nama Siswa": (c.student?.nama || "-").toUpperCase(),
      NISN: c.student?.nisn || "-",
      Sekolah: c.student?.school?.nama ? c.student.school.nama.toUpperCase() : "-",
      Kelas: c.student?.kelas || "-",
      "Jenis Kasus": SOURCE_LABELS[c.source] || c.source,
      "Hasil Akhir":
        c.status === "SELESAI_PENCEGAHAN"
          ? "Selesai (Kembali Sekolah pada Tahap Pencegahan)"
          : "Selesai (Penanganan Tuntas / Closed Case)",
      "OPD Terlibat": opdNames || "-",
      "Total Intervensi Diberikan": totalIntervensi,
      "Tanggal Masuk": dateStart.toLocaleDateString("id-ID"),
      "Tanggal Selesai": dateEnd.toLocaleDateString("id-ID"),
      "Lama Penanganan (Hari)": days,
      "Catatan Akhir": c.catatan || "-",
    };
  });

  const wsResolved = XLSX.utils.json_to_sheet(
    resolvedData.length > 0
      ? resolvedData
      : [{ Keterangan: "Tidak ada kasus yang sudah selesai pada periode ini" }]
  );
  wsResolved["!cols"] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 32 },
    { wch: 8 },
    { wch: 22 },
    { wch: 42 },
    { wch: 25 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsResolved, "Kasus Sudah Selesai");

  // ==========================================
  // SHEET 4: SEMUA KASUS LENGKAP
  // ==========================================
  const allCasesData = data.map((c, i) => {
    const isDone = c.status === "SELESAI_PENCEGAHAN" || c.status === "CLOSED_CASE";
    const opdNames = (c.referrals || [])
      .map((r: any) => r.opd?.nama)
      .filter(Boolean)
      .join(", ");

    return {
      No: i + 1,
      "No. Kasus": c.nomorKasus,
      "Kategori Penyelesaian": isDone ? "SUDAH SELESAI" : "BELUM SELESAI",
      "Status Kasus": STATUS_LABELS[c.status] || c.status,
      "Jenis Kasus": SOURCE_LABELS[c.source] || c.source,
      "Nama Siswa": (c.student?.nama || "-").toUpperCase(),
      NISN: c.student?.nisn || "-",
      NIK: c.student?.nik || "-",
      "Jenis Kelamin": c.student?.jenisKelamin === "L" ? "Laki-laki" : c.student?.jenisKelamin === "P" ? "Perempuan" : "-",
      Sekolah: c.student?.school?.nama ? c.student.school.nama.toUpperCase() : "-",
      Kelas: c.student?.kelas || "-",
      "Nama Ortu": c.student?.namaOrtu || "-",
      "Kontak Ortu": c.student?.kontakOrtu || "-",
      Alamat: c.student?.alamatJalan || c.student?.alamat || "-",
      "Kapanewon/Kecamatan": c.student?.kecamatan || "-",
      "OPD Rujukan": opdNames || "-",
      "Jml Visit": c.homeVisits?.length ?? 0,
      "Tanggal Dibuat": new Date(c.createdAt).toLocaleDateString("id-ID"),
      "Tanggal Selesai/Tutup": c.closedAt ? new Date(c.closedAt).toLocaleDateString("id-ID") : "-",
    };
  });

  const wsAll = XLSX.utils.json_to_sheet(allCasesData);
  wsAll["!cols"] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 22 },
    { wch: 35 },
    { wch: 22 },
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 32 },
    { wch: 8 },
    { wch: 25 },
    { wch: 18 },
    { wch: 35 },
    { wch: 20 },
    { wch: 25 },
    { wch: 10 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAll, "Semua Data Kasus");

  // Unduh File Excel
  XLSX.writeFile(wb, `Laporan_Rekap_Kasus_EWS_ATS_Sleman_${dateStr}.xlsx`);
}
