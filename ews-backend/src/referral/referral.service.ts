import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AssignmentStatus, CaseStatus, ReferralOrigin, StudentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CaseStateMachineService } from '../cases/case-state-machine.service';
import { CreateDoStudentReferralDto, CreateReferralDto } from './dto/referral.dto';
import { CurrentUserPayload } from '../auth/current-user.decorator';

@Injectable()
export class ReferralService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: CaseStateMachineService,
  ) {}

  // SRS "5. Rujukan oleh Kepanewon" (both Alur Pencegahan & Alur Penanganan converge here).
  // BR-10: hanya Kapanewon yang dapat melakukan rujukan.
  // Mendukung multi-OPD: Kapanewon dapat memilih beberapa OPD terkait sekaligus untuk
  // satu Case (mis. kasus butuh intervensi Dinas Sosial sekaligus Dinas Kesehatan) —
  // setiap OPD mendapat baris Referral tersendiri dan melacak status/intervensinya sendiri.
  async create(caseId: number, dto: CreateReferralDto, user: CurrentUserPayload) {
    const kase = await this.prisma.case.findUnique({ where: { id: caseId }, include: { referrals: true } });
    if (!kase) throw new NotFoundException('Case tidak ditemukan');

    if (kase.status !== CaseStatus.MENUNGGU_RUJUKAN) {
      throw new BadRequestException(
        `Rujukan hanya dapat dibuat saat status Menunggu Rujukan. Status saat ini: ${kase.status}`,
      );
    }
    if (kase.referrals.length > 0) {
      throw new ConflictException('Case ini sudah memiliki Rujukan');
    }

    const opdIds = Array.from(new Set(dto.opdIds));
    if (opdIds.length === 0) {
      throw new BadRequestException('Pilih minimal satu OPD tujuan rujukan');
    }

    const opds = await this.prisma.opd.findMany({ where: { id: { in: opdIds } } });
    if (opds.length !== opdIds.length) {
      throw new NotFoundException('Salah satu OPD tujuan tidak ditemukan');
    }

    const referrals = await this.prisma.$transaction(
      opdIds.map((opdId) =>
        this.prisma.referral.create({
          data: {
            origin: ReferralOrigin.CASE,
            caseId,
            riskFactorId: dto.riskFactorId,
            tingkatRisiko: dto.tingkatRisiko,
            opdId,
            catatan: dto.catatan,
            status: AssignmentStatus.MENUNGGU,
            referredById: user.userId,
          },
          include: { opd: true, riskFactor: true },
        }),
      ),
    );

    const namaOpd = opds.map((o) => o.nama).join(', ');
    await this.stateMachine.transition(
      caseId,
      CaseStatus.DIRUJUK_OPD,
      { userId: user.userId, role: user.role as UserRole },
      opds.length > 1 ? `Kasus dirujuk ke ${opds.length} OPD: ${namaOpd}` : `Kasus dirujuk ke OPD: ${namaOpd}`,
      dto.catatan,
    );

    return referrals;
  }

  // Jalur ringan (tanpa Case/state machine): Admin merujuk siswa berstatus PUTUS_SEKOLAH (DO)
  // langsung ke OPD terkait. Tidak melalui BR-10 (yang mengatur rujukan Case oleh Kapanewon).
  async createForDoStudent(studentId: number, dto: CreateDoStudentReferralDto, user: CurrentUserPayload) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Siswa tidak ditemukan');
    if (student.status !== StudentStatus.PUTUS_SEKOLAH) {
      throw new BadRequestException('Rujukan langsung ini hanya berlaku untuk siswa berstatus Putus Sekolah (DO)');
    }

    const existing = await this.prisma.referral.findFirst({
      where: { studentId, origin: ReferralOrigin.DO_STUDENT, status: { not: AssignmentStatus.SELESAI_DISETUJUI } },
    });
    if (existing) {
      throw new ConflictException('Siswa ini sudah memiliki rujukan DO yang masih berjalan');
    }

    const opd = await this.prisma.opd.findUnique({ where: { id: dto.opdId } });
    if (!opd) throw new NotFoundException('OPD tidak ditemukan');

    return this.prisma.referral.create({
      data: {
        origin: ReferralOrigin.DO_STUDENT,
        studentId,
        riskFactorId: dto.riskFactorId,
        tingkatRisiko: dto.tingkatRisiko,
        opdId: dto.opdId,
        catatan: dto.catatan,
        status: AssignmentStatus.MENUNGGU,
        referredById: user.userId,
      },
      include: { opd: true, riskFactor: true, student: true },
    });
  }

  // BOLA fix: sebelumnya findOne(id) tidak menerima `user` dan endpoint-nya tidak
  // punya @Roles() sama sekali — OPD mana pun bisa membuka rujukan OPD lain (BR-11
  // hanya ditegakkan di verify(), bukan di sini). Sekarang OPD hanya bisa melihat
  // rujukan miliknya sendiri; role lain (Admin/Dinas/Kapanewon) tetap bebas.
  async findOne(id: number, user: CurrentUserPayload) {
    const referral = await this.prisma.referral.findUnique({
      where: { id },
      include: {
        opd: true,
        riskFactor: true,
        case: { include: { student: true } },
        student: true,
        interventions: { include: { interventionType: true, petugas: { select: { id: true, name: true } } } },
        reviews: { include: { reviewedBy: { select: { id: true, name: true } } } },
      },
    });
    if (!referral) throw new NotFoundException('Rujukan tidak ditemukan');
    if (user.role === UserRole.OPD && referral.opdId !== user.opdId) {
      throw new NotFoundException('Rujukan tidak ditemukan');
    }
    return referral;
  }

  // BR-11: OPD hanya dapat melihat/menerima Case (atau rujukan DO) yang telah dirujuk kepadanya.
  // FE menandai referral berstatus MENUNGGU sebagai rujukan baru/belum dibaca (notifikasi OPD).
  async findAllForOpd(opdId: number) {
    return this.prisma.referral.findMany({
      where: { opdId },
      include: { case: { include: { student: true } }, student: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.referral.findMany({
      include: { case: { include: { student: true } }, student: true, opd: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // OPD memverifikasi/menerima rujukan yang masuk sebelum memulai intervensi.
  // Berlaku untuk rujukan Case maupun rujukan DO-Student.
  async verify(id: number, user: CurrentUserPayload) {
    const referral = await this.prisma.referral.findUnique({ where: { id } });
    if (!referral) throw new NotFoundException('Rujukan tidak ditemukan');
    if (referral.opdId !== user.opdId) {
      throw new BadRequestException('Rujukan ini bukan untuk OPD Anda');
    }
    if (referral.status !== AssignmentStatus.MENUNGGU) {
      throw new BadRequestException(
        `Verifikasi hanya dapat dilakukan saat status Menunggu. Status saat ini: ${referral.status}`,
      );
    }
    return this.prisma.referral.update({
      where: { id },
      data: { status: AssignmentStatus.DITERIMA },
      include: { opd: true, student: true, case: { include: { student: true } } },
    });
  }
}
