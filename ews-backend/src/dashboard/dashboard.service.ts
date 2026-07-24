import { ForbiddenException, Injectable } from '@nestjs/common';
import { CaseSource, CaseStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../auth/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(user: CurrentUserPayload) {
    switch (user.role) {
      case UserRole.SEKOLAH:
        return this.sekolahDashboard(user.schoolId);
      case UserRole.KAPANEWON:
        return this.kapanewonDashboard(user.wilayahId);
      case UserRole.OPD:
        return this.opdDashboard(user.opdId);
      case UserRole.DINAS_PENDIDIKAN:
      case UserRole.ADMIN:
      default:
        return this.dinasDashboard();
    }
  }

  // Dipakai komponen "ReportTable" di keempat dashboard — daftar kasus terbaru,
  // scoped otomatis sesuai role (sama seperti getDashboard).
  async getRecentCases(user: CurrentUserPayload, take = 6) {
    const caseWhere = await this.caseWhereForUser(user);
    const cases = await this.prisma.case.findMany({
      where: caseWhere,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        student: {
          select: {
            nama: true,
            nik: true,
            desaKelurahan: true,
            kecamatan: true,
            school: { select: { nama: true, kapanewon: true } },
          },
        },
      },
    });

    const statusLabel: Record<string, string> = {
      DRAFT: 'Draft',
      CASE_CREATED: 'Kasus Dibuat',
      VERIFIKASI_NIK: 'Verifikasi NIK',
      HOME_VISIT: 'Kunjungan Rumah',
      SELESAI_PENCEGAHAN: 'Selesai (Kembali Sekolah)',
      MENUNGGU_RUJUKAN: 'Menunggu Rujukan',
      DIRUJUK_OPD: 'Dirujuk ke OPD',
      INTERVENSI_BERJALAN: 'Intervensi Berjalan',
      VERIFIKASI_PENYELESAIAN: 'Verifikasi Penyelesaian',
      MONITORING: 'Monitoring',
      CLOSED_CASE: 'Tuntas',
    };
    const statusColor: Record<string, 'red' | 'yellow' | 'blue' | 'green' | 'slate'> = {
      DRAFT: 'slate',
      CASE_CREATED: 'yellow',
      VERIFIKASI_NIK: 'yellow',
      HOME_VISIT: 'blue',
      SELESAI_PENCEGAHAN: 'green',
      MENUNGGU_RUJUKAN: 'yellow',
      DIRUJUK_OPD: 'blue',
      INTERVENSI_BERJALAN: 'blue',
      VERIFIKASI_PENYELESAIAN: 'blue',
      MONITORING: 'blue',
      CLOSED_CASE: 'green',
    };
    const categoryLabel: Record<string, string> = {
      PELAPORAN_SEKOLAH: 'Pelaporan Sekolah',
      PENGADUAN_MASYARAKAT: 'Pengaduan Masyarakat',
    };

    return cases.map((c) => {
      const nik = c.student.nik ?? '';
      const nikMasked = nik.length > 6 ? nik.slice(0, 6) + 'X'.repeat(nik.length - 6) : nik;
      const wilayah =
        c.student.desaKelurahan ??
        c.student.school?.kapanewon ??
        c.student.kecamatan ??
        c.student.school?.nama ??
        '-';
      return {
        id: c.id,
        nomorKasus: c.nomorKasus,
        studentName: c.student.nama,
        nikMasked,
        wilayah,
        category: categoryLabel[c.source] ?? c.source,
        status: statusLabel[c.status] ?? c.status,
        statusColor: statusColor[c.status] ?? 'slate',
      };
    });
  }

  // Dipakai komponen "DashboardChart" di keempat dashboard — jumlah kasus baru per
  // bulan (6 bulan terakhir), scoped otomatis sesuai role.
  async getMonthlyTrend(user: CurrentUserPayload, months = 6) {
    const caseWhere = await this.caseWhereForUser(user);
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const cases = await this.prisma.case.findMany({
      where: { ...caseWhere, createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    const bulanLabel = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    const buckets: { key: string; label: string; kasusBaru: number; kasusSelesai: number }[] = [];
    const cursor = new Date(since);
    for (let i = 0; i < months; i++) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
      buckets.push({ key, label: bulanLabel[cursor.getMonth()], kasusBaru: 0, kasusSelesai: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

    for (const c of cases) {
      const key = `${c.createdAt.getFullYear()}-${c.createdAt.getMonth()}`;
      const bucket = bucketByKey.get(key);
      if (!bucket) continue;
      bucket.kasusBaru++;
      if (c.status === CaseStatus.CLOSED_CASE || c.status === CaseStatus.SELESAI_PENCEGAHAN) {
        bucket.kasusSelesai++;
      }
    }
    return buckets.map(({ label, kasusBaru, kasusSelesai }) => ({ label, kasusBaru, kasusSelesai }));
  }

  // Dipakai komponen "DashboardChart" (varian sekolah) — tren risiko per
  // minggu/bulan/tahun, dihitung dari waktu prediksi ML dibuat.
  async getSchoolRiskTrend(schoolId: number | null | undefined, period: 'week' | 'month' | 'year') {
    const studentWhere = schoolId ? { schoolId } : {};
    const now = new Date();
    let since: Date;
    let bucketCount: number;
    let bucketOf: (d: Date) => string;
    let labelOf: (bucketKey: string) => string;

    if (period === 'week') {
      bucketCount = 7;
      since = new Date(now);
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);
      const hariLabel = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      bucketOf = (d) => d.toISOString().slice(0, 10);
      labelOf = (key) => hariLabel[new Date(key).getDay()];
    } else if (period === 'year') {
      bucketCount = 5;
      since = new Date(now.getFullYear() - 4, 0, 1);
      bucketOf = (d) => String(d.getFullYear());
      labelOf = (key) => key;
    } else {
      bucketCount = 6;
      since = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const bulanLabel = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      bucketOf = (d) => `${d.getFullYear()}-${d.getMonth()}`;
      labelOf = (key) => bulanLabel[Number(key.split('-')[1])];
    }

    const predictions = await this.prisma.prediction.findMany({
      where: { student: studentWhere, createdAt: { gte: since } },
      select: { createdAt: true, riskCategory: true },
    });

    // Susun daftar bucket kosong dulu (urut kronologis), lalu isi dari data asli.
    const buckets: { key: string; tinggi: number; sedang: number }[] = [];
    const cursor = new Date(since);
    for (let i = 0; i < bucketCount; i++) {
      buckets.push({ key: bucketOf(cursor), tinggi: 0, sedang: 0 });
      if (period === 'week') cursor.setDate(cursor.getDate() + 1);
      else if (period === 'year') cursor.setFullYear(cursor.getFullYear() + 1);
      else cursor.setMonth(cursor.getMonth() + 1);
    }
    const bucketByKey = new Map(buckets.map((b) => [b.key, b]));

    for (const p of predictions) {
      const key = bucketOf(p.createdAt);
      const bucket = bucketByKey.get(key);
      if (!bucket) continue;
      if (p.riskCategory === 'TINGGI') bucket.tinggi++;
      else if (p.riskCategory === 'SEDANG') bucket.sedang++;
    }

    return buckets.map((b) => ({ name: labelOf(b.key), tinggi: b.tinggi, sedang: b.sedang }));
  }

  // Dipakai komponen "VillageHeatmap" (peta risiko per kapanewon), dipakai di
  // Dashboard Kapanewon, OPD, dan Dinas/Admin — cakupan seluruh Kabupaten Sleman.
  async getKapanewonHeatmap() {
    const kapanewonList = await this.prisma.wilayah.findMany({
      distinct: ['kapanewon'],
      select: { kapanewon: true },
      orderBy: { kapanewon: 'asc' },
    });

    return Promise.all(
      kapanewonList.map(async ({ kapanewon }) => {
        const schools = await this.prisma.school.findMany({
          where: { kapanewon },
          select: { id: true },
        });
        const schoolIds = schools.map((s) => s.id);
        const studentWhere = { schoolId: { in: schoolIds }, status: 'AKTIF' as const };
        const [totalStudents, riskStats] = await Promise.all([
          this.prisma.student.count({ where: studentWhere }),
          this.latestRiskCounts(studentWhere),
        ]);
        return { name: kapanewon, totalStudents, highRisk: riskStats.tinggi };
      }),
    );
  }

  // Dipakai komponen "ReportTable" di Dashboard Sekolah — siswa dengan risiko
  // tertinggi (dari prediksi ML terbaru), beserta faktor dominan & status kasusnya.
  async getTopRiskStudents(schoolId?: number | null, take = 6) {
    const studentWhere = schoolId ? { schoolId, status: 'AKTIF' as const } : { status: 'AKTIF' as const };
    const latestPredictions = await this.prisma.prediction.findMany({
      where: { student: studentWhere },
      orderBy: { createdAt: 'desc' },
      distinct: ['studentId'],
      select: {
        studentId: true,
        probabilitas: true,
        riskCategory: true,
        alasanRisiko: true,
        student: { select: { nama: true, nisn: true, kelas: true } },
      },
    });

    const top = latestPredictions.sort((a, b) => b.probabilitas - a.probabilitas).slice(0, take);
    const studentIds = top.map((p) => p.studentId);
    const openCases = await this.prisma.case.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['studentId'],
      select: { studentId: true, status: true },
    });
    const caseByStudent = new Map(openCases.map((c) => [c.studentId, c.status]));

    const statusLabel: Record<string, string> = {
      CLOSED_CASE: 'Selesai',
      SELESAI_PENCEGAHAN: 'Selesai',
      MONITORING: 'Dalam Pendampingan',
      INTERVENSI_BERJALAN: 'Dalam Pendampingan',
      HOME_VISIT: 'Dalam Pendampingan',
    };

    return top.map((p) => {
      const caseStatus = caseByStudent.get(p.studentId);
      const status = caseStatus ? statusLabel[caseStatus] ?? 'Dalam Pendampingan' : 'Belum Ditindak';
      return {
        studentId: p.studentId,
        name: p.student.nama,
        nisn: p.student.nisn,
        kelas: p.student.kelas ?? '-',
        risiko: Math.round(p.probabilitas),
        riskCategory: p.riskCategory,
        factor: p.alasanRisiko?.[0] ?? '-',
        status,
      };
    });
  }

  // Helper: resolusi where-clause Case sesuai scoping role, dipakai getRecentCases &
  // getMonthlyTrend supaya konsisten dengan getDashboard.
  private async caseWhereForUser(user: CurrentUserPayload): Promise<Prisma.CaseWhereInput> {
    switch (user.role) {
      case UserRole.SEKOLAH:
        return user.schoolId ? { student: { schoolId: user.schoolId } } : {};
      case UserRole.KAPANEWON: {
        if (!user.wilayahId) return { id: -1 };
        const wilayah = await this.prisma.wilayah.findUnique({ where: { id: user.wilayahId } });
        if (!wilayah) return { id: -1 };
        const schools = await this.prisma.school.findMany({
          where: { kapanewon: wilayah.kapanewon },
          select: { id: true },
        });
        return { student: { schoolId: { in: schools.map((s) => s.id) } } };
      }
      case UserRole.OPD:
        return user.opdId ? { referrals: { some: { opdId: user.opdId } } } : { id: -1 };
      case UserRole.DINAS_PENDIDIKAN:
      case UserRole.ADMIN:
      default:
        return {};
    }
  }

  // SRS Package 7 — Sekolah: Jumlah Prediksi, Pelaporan, Home Visit, Selesai
  // + metrik lengkap untuk kartu Dashboard Sekolah (banner, SummaryCard, ProgressCard).
  private async sekolahDashboard(schoolId?: number | null) {
    const studentWhere = schoolId ? { schoolId, status: 'AKTIF' as const } : { status: 'AKTIF' as const };
    const caseWhere = { student: schoolId ? { schoolId } : {} };

    const [
      jumlahPrediksi,
      jumlahPelaporan,
      jumlahHomeVisit,
      jumlahSelesai,
      totalSiswa,
      sedangDipantau,
      intervensiBerjalan,
      totalCaseSekolah,
      caseTerverifikasi,
      caseDenganHomeVisit,
      riskStats,
    ] = await Promise.all([
      this.prisma.prediction.count({ where: { student: schoolId ? { schoolId } : {} } }),
      this.prisma.case.count({ where: { source: CaseSource.PELAPORAN_SEKOLAH, ...caseWhere } }),
      this.prisma.homeVisit.count({ where: { case: caseWhere } }),
      this.prisma.case.count({ where: { status: CaseStatus.SELESAI_PENCEGAHAN, ...caseWhere } }),
      this.prisma.student.count({ where: studentWhere }),
      this.prisma.case.count({ where: { status: CaseStatus.MONITORING, ...caseWhere } }),
      this.prisma.case.count({ where: { status: CaseStatus.INTERVENSI_BERJALAN, ...caseWhere } }),
      this.prisma.case.count({ where: { source: CaseSource.PELAPORAN_SEKOLAH, ...caseWhere } }),
      this.prisma.case.count({
        where: { source: CaseSource.PELAPORAN_SEKOLAH, ...caseWhere, report: { nikVerified: true } },
      }),
      this.prisma.case.count({ where: { ...caseWhere, homeVisits: { some: {} } } }),
      this.latestRiskCounts(studentWhere),
    ]);

    const intervensiSelesai = jumlahSelesai; // Case status SELESAI_PENCEGAHAN (S04) untuk sekolah ini
    const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      role: 'SEKOLAH',
      // dipertahankan (kompatibilitas lama)
      jumlahPrediksi,
      jumlahPelaporan,
      jumlahHomeVisit,
      jumlahSelesai,
      // metrik kartu (baru)
      totalSiswa,
      risikoTinggi: riskStats.tinggi,
      sedangDipantau,
      intervensiSelesai,
      intervensiBerjalan,
      progress: [
        { label: 'Verifikasi Kasus', value: pct(caseTerverifikasi, totalCaseSekolah) },
        { label: 'Home Visit', value: pct(caseDenganHomeVisit, totalCaseSekolah) },
        { label: 'Intervensi Berjalan', value: pct(intervensiBerjalan, totalCaseSekolah) },
        { label: 'Kasus Selesai', value: pct(intervensiSelesai, totalCaseSekolah) },
      ],
    };
  }

  // Helper: hitung sebaran risiko (dari prediksi ML terbaru tiap siswa) untuk suatu
  // kumpulan siswa. Dipakai ulang oleh sekolah/kapanewon/opd/dinas dashboard.
  private async latestRiskCounts(studentWhere: any) {
    const latest = await this.prisma.prediction.findMany({
      where: { student: studentWhere },
      orderBy: { createdAt: 'desc' },
      distinct: ['studentId'],
      select: { riskCategory: true },
    });
    const counts = { RENDAH: 0, SEDANG: 0, TINGGI: 0 };
    for (const p of latest) counts[p.riskCategory as keyof typeof counts]++;
    return { rendah: counts.RENDAH, sedang: counts.SEDANG, tinggi: counts.TINGGI, total: latest.length };
  }

  // Kapanewon: metrik lengkap untuk kartu Dashboard Kapanewon (banner, SummaryCard,
  // ProgressCard, StatusCard) — cakupan seluruh sekolah dalam kapanewon akun ini.
  private async kapanewonDashboard(wilayahId?: number | null) {
    const wilayah = wilayahId ? await this.prisma.wilayah.findUnique({ where: { id: wilayahId } }) : null;
    const kapanewon = wilayah?.kapanewon;
    const schools = kapanewon
      ? await this.prisma.school.findMany({ where: { kapanewon }, select: { id: true } })
      : [];
    const schoolIds = schools.map((s) => s.id);
    const studentWhere = kapanewon ? { schoolId: { in: schoolIds }, status: 'AKTIF' as const } : {};
    const caseWhere = kapanewon ? { student: { schoolId: { in: schoolIds } } } : {};

    const [
      pengaduanBaru,
      menungguVerifikasi,
      menungguRujukan,
      riwayat,
      totalSiswaAps,
      kunjunganRumahAktif,
      totalCase,
      caseTerverifikasi,
      caseDenganRujukan,
      caseSelesai,
      caseMenunggu,
      riskStats,
    ] = await Promise.all([
      this.prisma.case.count({ where: { source: CaseSource.PENGADUAN_MASYARAKAT, status: CaseStatus.CASE_CREATED, ...caseWhere } }),
      this.prisma.case.count({ where: { status: CaseStatus.VERIFIKASI_NIK, ...caseWhere } }),
      this.prisma.case.count({ where: { status: CaseStatus.MENUNGGU_RUJUKAN, ...caseWhere } }),
      this.prisma.referral.count({ where: kapanewon ? { case: { student: { schoolId: { in: schoolIds } } } } : {} }),
      this.prisma.case.count({ where: caseWhere }), // "APS" tercatat = seluruh Case di kapanewon ini
      this.prisma.case.count({ where: { status: CaseStatus.HOME_VISIT, ...caseWhere } }),
      this.prisma.case.count({ where: caseWhere }),
      this.prisma.case.count({ where: { ...caseWhere, report: { nikVerified: true } } }),
      this.prisma.case.count({ where: { ...caseWhere, referrals: { some: {} } } }),
      this.prisma.case.count({ where: { status: CaseStatus.CLOSED_CASE, ...caseWhere } }),
      this.prisma.case.count({
        where: { status: { in: [CaseStatus.CASE_CREATED, CaseStatus.VERIFIKASI_NIK] }, ...caseWhere },
      }),
      this.latestRiskCounts(studentWhere),
    ]);

    const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      role: 'KAPANEWON',
      kapanewon: kapanewon ?? null,
      // dipertahankan (kompatibilitas lama)
      pengaduanBaru,
      menungguVerifikasi,
      menungguRujukan,
      riwayat,
      // metrik kartu (baru)
      totalSiswaAps,
      kasusBerisikoTinggi: riskStats.tinggi,
      kunjunganRumahAktif,
      progress: [
        { label: 'Verifikasi Kasus', value: pct(caseTerverifikasi, totalCase) },
        { label: 'Dirujuk ke OPD', value: pct(caseDenganRujukan, totalCase) },
      ],
      status: {
        completed: caseSelesai,
        completedLocation: kapanewon ? `Kapanewon ${kapanewon}` : '-',
        pending: caseMenunggu,
        pendingText: 'Perlu verifikasi segera',
      },
    };
  }

  // OPD: metrik lengkap untuk kartu Dashboard OPD (banner, SummaryCard, ProgressCard, StatusCard)
  // — cakupan seluruh rujukan (Referral) yang ditugaskan ke OPD akun ini.
  private async opdDashboard(opdId?: number | null) {
    if (!opdId) {
      return {
        role: 'OPD',
        kasusBaru: 0,
        intervensiAktif: 0,
        intervensiSelesai: 0,
        totalSiswaAps: 0,
        kasusBerisikoTinggi: 0,
        intervensiBerjalan: 0,
        progress: [
          { label: 'Rujukan Diterima', value: 0 },
          { label: 'Intervensi Selesai', value: 0 },
        ],
        status: { completed: 0, completedLocation: '-', pending: 0, pendingText: 'Perlu verifikasi segera' },
      };
    }

    const [
      kasusBaru,
      intervensiAktif,
      intervensiSelesai,
      totalRujukan,
      rujukanDiterima,
      referralStudentIds,
    ] = await Promise.all([
      this.prisma.referral.count({ where: { opdId, status: 'MENUNGGU' } }),
      this.prisma.referral.count({ where: { opdId, status: 'INTERVENSI_BERJALAN' } }),
      this.prisma.referral.count({ where: { opdId, status: 'SELESAI_DISETUJUI' } }),
      this.prisma.referral.count({ where: { opdId } }),
      this.prisma.referral.count({ where: { opdId, status: { in: ['DITERIMA', 'INTERVENSI_BERJALAN', 'SELESAI_DIAJUKAN', 'SELESAI_DISETUJUI'] } } }),
      this.prisma.referral.findMany({
        where: { opdId },
        select: { studentId: true, case: { select: { studentId: true } } },
      }),
    ]);

    const studentIds = Array.from(
      new Set(referralStudentIds.map((r) => r.studentId ?? r.case?.studentId).filter((x): x is number => !!x)),
    );
    const riskStats = await this.latestRiskCounts(studentIds.length ? { id: { in: studentIds } } : { id: -1 });
    const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      role: 'OPD',
      // dipertahankan (kompatibilitas lama)
      kasusBaru,
      intervensiAktif,
      intervensiSelesai,
      // metrik kartu (baru)
      totalSiswaAps: totalRujukan,
      kasusBerisikoTinggi: riskStats.tinggi,
      intervensiBerjalan: intervensiAktif,
      progress: [
        { label: 'Rujukan Diterima', value: pct(rujukanDiterima, totalRujukan) },
        { label: 'Intervensi Selesai', value: pct(intervensiSelesai, totalRujukan) },
      ],
      status: {
        completed: intervensiSelesai,
        completedLocation: 'Seluruh wilayah tugas',
        pending: kasusBaru,
        pendingText: 'Rujukan baru menunggu diterima',
      },
    };
  }

  // Dinas: Semua Case, Kasus Pencegahan, Kasus Penanganan, Closed, Monitoring
  // + metrik lengkap untuk kartu Dashboard Dinas/Admin (cakupan seluruh kabupaten).
  private async dinasDashboard() {
    const [
      semuaCase,
      kasusPencegahan,
      kasusPenanganan,
      closed,
      monitoring,
      totalSiswaAps,
      kunjunganRumahAktif,
      caseTerverifikasi,
      caseDenganRujukan,
      caseMenunggu,
      riskStats,
    ] = await Promise.all([
      this.prisma.case.count(),
      this.prisma.case.count({ where: { source: CaseSource.PELAPORAN_SEKOLAH } }),
      this.prisma.case.count({ where: { source: CaseSource.PENGADUAN_MASYARAKAT } }),
      this.prisma.case.count({ where: { status: CaseStatus.CLOSED_CASE } }),
      this.prisma.case.count({ where: { status: CaseStatus.MONITORING } }),
      this.prisma.case.count(),
      this.prisma.case.count({ where: { status: CaseStatus.HOME_VISIT } }),
      this.prisma.case.count({ where: { report: { nikVerified: true } } }),
      this.prisma.case.count({ where: { referrals: { some: {} } } }),
      this.prisma.case.count({ where: { status: { in: [CaseStatus.CASE_CREATED, CaseStatus.VERIFIKASI_NIK] } } }),
      this.latestRiskCounts({ status: 'AKTIF' }),
    ]);
    const byStatus = await this.prisma.case.groupBy({ by: ['status'], _count: true });
    const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      role: 'DINAS_PENDIDIKAN',
      // dipertahankan (kompatibilitas lama)
      semuaCase,
      kasusPencegahan,
      kasusPenanganan,
      closed,
      monitoring,
      byStatus,
      // metrik kartu (baru)
      totalSiswaAps,
      kasusBerisikoTinggi: riskStats.tinggi,
      kunjunganRumahAktif,
      progress: [
        { label: 'Verifikasi Kasus', value: pct(caseTerverifikasi, semuaCase) },
        { label: 'Dirujuk ke OPD', value: pct(caseDenganRujukan, semuaCase) },
      ],
      status: {
        completed: closed,
        completedLocation: 'Kabupaten Sleman',
        pending: caseMenunggu,
        pendingText: 'Perlu verifikasi segera',
      },
    };
  }

  // -----------------------------------------------------------------
  // ANALISIS OTOMATIS (mastering data) — dipakai Dashboard Sekolah & Kapanewon.
  // Mengagregasi profil siswa aktif (agama, kondisi ekonomi/pendidikan ortu,
  // kebutuhan khusus, jenis tinggal, alat transportasi, KIP/KPS/PIP, & sebaran
  // risiko dari prediksi ML terakhir) untuk satu sekolah atau satu kapanewon.
  // -----------------------------------------------------------------
  private async studentAnalytics(studentWhere: any) {
    const [
      totalSiswa,
      byGender,
      byAgama,
      byJenisTinggal,
      byAlatTransportasi,
      byKebutuhanKhusus,
      byPekerjaanAyah,
      byPekerjaanIbu,
      byPenghasilanAyah,
      byPenghasilanIbu,
      byPendidikanAyah,
      byPendidikanIbu,
      penerimaKps,
      penerimaKip,
      layakPip,
      latestPredictions,
    ] = await Promise.all([
      this.prisma.student.count({ where: studentWhere }),
      this.prisma.student.groupBy({ by: ['jenisKelamin'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['agamaId'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['jenisTinggalId'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['alatTransportasiId'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['kebutuhanKhususId'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['pekerjaanAyahId'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['pekerjaanIbuId'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['penghasilanAyahId'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['penghasilanIbuId'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['pendidikanAyahId'], where: studentWhere, _count: true }),
      this.prisma.student.groupBy({ by: ['pendidikanIbuId'], where: studentWhere, _count: true }),
      this.prisma.student.count({ where: { ...studentWhere, penerimaKps: true } }),
      this.prisma.student.count({ where: { ...studentWhere, penerimaKip: true } }),
      this.prisma.student.count({ where: { ...studentWhere, layakPip: true } }),
      // riskCategory dari prediksi ML terbaru tiap siswa (bila sudah pernah diprediksi)
      this.prisma.prediction.findMany({
        where: { student: studentWhere },
        orderBy: { createdAt: 'desc' },
        distinct: ['studentId'],
        select: { studentId: true, riskCategory: true },
      }),
    ]);

    // Resolve nama master untuk hasil groupBy (id -> label) dalam beberapa query paralel.
    const [agamaList, jenisTinggalList, alatList, kebutuhanList, pekerjaanList, penghasilanList, pendidikanList] =
      await Promise.all([
        this.prisma.agama.findMany(),
        this.prisma.jenisTinggal.findMany(),
        this.prisma.alatTransportasi.findMany(),
        this.prisma.kebutuhanKhusus.findMany(),
        this.prisma.pekerjaanOrtu.findMany(),
        this.prisma.penghasilanOrtu.findMany(),
        this.prisma.pendidikanOrtu.findMany(),
      ]);
    const nameOf = (list: { id: number; nama: string }[], id: number | null) =>
      id === null ? 'Tidak diketahui' : list.find((x) => x.id === id)?.nama ?? 'Tidak diketahui';

    const labelize = (rows: { _count: number; [k: string]: any }[], key: string, list: any[]) =>
      rows
        .map((r) => ({ label: nameOf(list, r[key]), jumlah: r._count }))
        .sort((a, b) => b.jumlah - a.jumlah);

    const riskCounts = { RENDAH: 0, SEDANG: 0, TINGGI: 0 };
    for (const p of latestPredictions) {
      riskCounts[p.riskCategory as keyof typeof riskCounts]++;
    }

    return {
      totalSiswa,
      sebaranJenisKelamin: byGender.map((r) => ({ label: r.jenisKelamin ?? 'Tidak diketahui', jumlah: r._count })),
      sebaranRisiko: {
        rendah: riskCounts.RENDAH,
        sedang: riskCounts.SEDANG,
        tinggi: riskCounts.TINGGI,
        belumDiprediksi: totalSiswa - latestPredictions.length,
      },
      sebaranAgama: labelize(byAgama, 'agamaId', agamaList),
      sebaranJenisTinggal: labelize(byJenisTinggal, 'jenisTinggalId', jenisTinggalList),
      sebaranAlatTransportasi: labelize(byAlatTransportasi, 'alatTransportasiId', alatList),
      sebaranKebutuhanKhusus: labelize(byKebutuhanKhusus, 'kebutuhanKhususId', kebutuhanList).filter(
        (x) => x.label !== 'Tidak ada',
      ),
      sebaranPekerjaanAyah: labelize(byPekerjaanAyah, 'pekerjaanAyahId', pekerjaanList),
      sebaranPekerjaanIbu: labelize(byPekerjaanIbu, 'pekerjaanIbuId', pekerjaanList),
      sebaranPenghasilanAyah: labelize(byPenghasilanAyah, 'penghasilanAyahId', penghasilanList),
      sebaranPenghasilanIbu: labelize(byPenghasilanIbu, 'penghasilanIbuId', penghasilanList),
      sebaranPendidikanAyah: labelize(byPendidikanAyah, 'pendidikanAyahId', pendidikanList),
      sebaranPendidikanIbu: labelize(byPendidikanIbu, 'pendidikanIbuId', pendidikanList),
      bantuanSosial: { penerimaKps, penerimaKip, layakPip },
    };
  }

  // Dipakai DashboardController: pastikan user KAPANEWON hanya mengakses kapanewon miliknya
  // sendiri (wilayahId -> Wilayah.kapanewon).
  async assertKapanewonAccess(wilayahId: number | null | undefined, kapanewon: string) {
    if (!wilayahId) throw new ForbiddenException('Akun kapanewon tidak terhubung ke wilayah manapun');
    const wilayah = await this.prisma.wilayah.findUnique({ where: { id: wilayahId } });
    if (!wilayah || wilayah.kapanewon !== kapanewon) {
      throw new ForbiddenException('Tidak berwenang mengakses dashboard kapanewon lain');
    }
  }

  // Analisis untuk satu sekolah (Dashboard Sekolah)
  async schoolAnalytics(schoolId: number) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return null;
    const analytics = await this.studentAnalytics({ schoolId, status: 'AKTIF' });
    return { school: { id: school.id, nama: school.nama, npsn: school.npsn, kapanewon: school.kapanewon }, ...analytics };
  }

  // Analisis gabungan seluruh sekolah dalam satu kapanewon (Dashboard Kapanewon)
  async kapanewonAnalytics(kapanewon: string) {
    const schools = await this.prisma.school.findMany({ where: { kapanewon }, select: { id: true, nama: true } });
    const analytics = await this.studentAnalytics({ schoolId: { in: schools.map((s) => s.id) }, status: 'AKTIF' });
    const perSekolah = await Promise.all(
      schools.map(async (s) => ({
        schoolId: s.id,
        nama: s.nama,
        jumlahSiswa: await this.prisma.student.count({ where: { schoolId: s.id, status: 'AKTIF' } }),
      })),
    );
    return { kapanewon, jumlahSekolah: schools.length, perSekolah, ...analytics };
  }
}
