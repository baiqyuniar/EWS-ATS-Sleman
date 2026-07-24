import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CaseStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CaseStateMachineService } from '../cases/case-state-machine.service';
import { CloseCaseDto, CreateMonitoringDto, ReopenCaseDto } from './dto/monitoring.dto';
import { CurrentUserPayload } from '../auth/current-user.decorator';

@Injectable()
export class MonitoringService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: CaseStateMachineService,
  ) {}

  // SRS "9. Monitoring oleh Dinas Pendidikan". BR-17: hanya membaca & mencatat progres,
  // tidak mengubah data intervensi yang sudah dicatat OPD.
  async create(caseId: number, dto: CreateMonitoringDto, user: CurrentUserPayload) {
    const kase = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!kase) throw new NotFoundException('Case tidak ditemukan');
    if (kase.status !== CaseStatus.MONITORING) {
      throw new BadRequestException(`Monitoring hanya dapat dicatat saat status Monitoring. Status: ${kase.status}`);
    }

    const monitoring = await this.prisma.monitoring.create({
      data: { caseId, catatan: dto.catatan, petugasId: user.userId },
    });

    await this.stateMachine.logTimeline(
      caseId,
      { userId: user.userId, role: user.role as UserRole },
      'MONITORING_NOTE',
      'Catatan monitoring ditambahkan',
      dto.catatan,
    );

    return monitoring;
  }

  // SRS "10. Closed Case oleh Dinas Pendidikan". BR-13: hanya Dinas Pendidikan yang dapat
  // menutup kasus. BR-18: setelah Closed, data final dan tidak dapat diedit.
  async closeCase(caseId: number, dto: CloseCaseDto, user: CurrentUserPayload) {
    return this.stateMachine.transition(
      caseId,
      CaseStatus.CLOSED_CASE,
      { userId: user.userId, role: user.role as UserRole },
      'Kasus ditutup (Closed Case) oleh Dinas Pendidikan',
      dto.catatan,
    );
  }

  // BR-18: Reopen hanya oleh Dinas Pendidikan, seluruh prosesnya tercatat di timeline.
  async reopenCase(caseId: number, dto: ReopenCaseDto, user: CurrentUserPayload) {
    const kase = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!kase) throw new NotFoundException('Case tidak ditemukan');
    if (kase.status !== CaseStatus.CLOSED_CASE) {
      throw new BadRequestException('Reopen hanya berlaku untuk Case berstatus Closed');
    }

    const updated = await this.prisma.case.update({
      where: { id: caseId },
      data: { status: CaseStatus.MONITORING, reopenedAt: new Date(), closedAt: null },
    });

    await this.stateMachine.logTimeline(
      caseId,
      { userId: user.userId, role: user.role as UserRole },
      'CASE_REOPENED',
      'Kasus dibuka kembali (Reopen Case) oleh Dinas Pendidikan',
      dto.alasan,
      CaseStatus.CLOSED_CASE,
      CaseStatus.MONITORING,
    );

    return updated;
  }

  async findAllByCase(caseId: number, user: CurrentUserPayload) {
    // BOLA fix: sebelumnya tidak ada scoping sama sekali — SEKOLAH/OPD mana pun bisa
    // membaca catatan monitoring Dinas Pendidikan untuk Case pihak lain.
    if (user.role === UserRole.SEKOLAH || user.role === UserRole.OPD) {
      const kase = await this.prisma.case.findUnique({
        where: { id: caseId },
        include: { student: { select: { schoolId: true } }, referrals: { select: { opdId: true } } },
      });
      if (!kase) throw new NotFoundException('Case tidak ditemukan');
      const authorized =
        (user.role === UserRole.SEKOLAH && kase.student.schoolId === user.schoolId) ||
        (user.role === UserRole.OPD && kase.referrals.some((r) => r.opdId === user.opdId));
      if (!authorized) throw new NotFoundException('Case tidak ditemukan');
    }
    return this.prisma.monitoring.findMany({
      where: { caseId },
      include: { petugas: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
