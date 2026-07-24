import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // "Modul Laporan" - Rekap: ringkasan jumlah kasus per status/sumber/kapanewon/OPD.
  async rekap(params: { from?: string; to?: string }) {
    const where: any = {};
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }

    const [byStatus, bySource, total] = await Promise.all([
      this.prisma.case.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.case.groupBy({ by: ['source'], where, _count: true }),
      this.prisma.case.count({ where }),
    ]);

    return { total, byStatus, bySource };
  }

  // Statistik: risk map data — count of cases per school for the Risk Map page.
  async statistikSekolah() {
    const rows = await this.prisma.case.findMany({
      include: { student: { include: { school: true } } },
    });
    const bySchool = new Map<string, { schoolId: number; nama: string; total: number; aktif: number }>();
    for (const c of rows) {
      const school = c.student.school;
      if (!school) continue;
      const key = String(school.id);
      const entry = bySchool.get(key) ?? { schoolId: school.id, nama: school.nama, total: 0, aktif: 0 };
      entry.total += 1;
      if (!['SELESAI_PENCEGAHAN', 'CLOSED_CASE'].includes(c.status)) entry.aktif += 1;
      bySchool.set(key, entry);
    }
    return Array.from(bySchool.values());
  }

  // Export: flat rows suitable for CSV/XLSX export by the frontend (or a future export-to-file endpoint).
  async exportRows(params: { from?: string; to?: string }) {
    const where: any = {};
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }
    return this.prisma.case.findMany({
      where,
      include: { student: { include: { school: true } }, referrals: { include: { opd: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
