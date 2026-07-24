import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssignmentStatus, CaseStatus, ReviewDecision, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CaseStateMachineService } from '../cases/case-state-machine.service';
import { CreateReviewDto } from './dto/review.dto';
import { CurrentUserPayload } from '../auth/current-user.decorator';

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: CaseStateMachineService,
  ) {}

  // SRS Package 6 "Monitoring" (Dinas): Approve Intervensi -> S08 -> S09, or Perlu Perbaikan -> S08 -> S07.
  // Only Dinas Pendidikan may perform this (Authorization Matrix: Review = Dinas CRUD).
  // Rujukan DO-Student (tanpa Case) diverifikasi dari Referral.status, bukan Case.status.
  async create(referralId: number, dto: CreateReviewDto, user: CurrentUserPayload) {
    const referral = await this.prisma.referral.findUnique({ where: { id: referralId }, include: { case: true } });
    if (!referral) throw new NotFoundException('Rujukan tidak ditemukan');

    if (referral.case) {
      if (referral.case.status !== CaseStatus.VERIFIKASI_PENYELESAIAN) {
        throw new BadRequestException(
          `Review hanya dapat dilakukan saat status Verifikasi Penyelesaian. Status saat ini: ${referral.case.status}`,
        );
      }
    } else if (referral.status !== AssignmentStatus.SELESAI_DIAJUKAN) {
      throw new BadRequestException(
        `Review hanya dapat dilakukan setelah OPD mengajukan status Intervensi Selesai. Status rujukan saat ini: ${referral.status}`,
      );
    }

    const review = await this.prisma.review.create({
      data: {
        referralId,
        decision: dto.decision,
        catatan: dto.catatan,
        reviewedById: user.userId,
      },
    });

    if (dto.decision === ReviewDecision.APPROVE) {
      await this.prisma.referral.update({ where: { id: referralId }, data: { status: AssignmentStatus.SELESAI_DISETUJUI } });
      if (referral.caseId) {
        await this.stateMachine.transition(
          referral.caseId,
          CaseStatus.MONITORING,
          { userId: user.userId, role: user.role as UserRole },
          'Dinas Pendidikan menyetujui penyelesaian intervensi',
          dto.catatan,
        );
      }
    } else {
      await this.prisma.referral.update({ where: { id: referralId }, data: { status: AssignmentStatus.PERLU_PERBAIKAN } });
      if (referral.caseId) {
        await this.stateMachine.transition(
          referral.caseId,
          CaseStatus.INTERVENSI_BERJALAN,
          { userId: user.userId, role: user.role as UserRole },
          'Dinas Pendidikan meminta perbaikan intervensi',
          dto.catatan,
        );
      }
    }

    return review;
  }

  async findAllByReferral(referralId: number) {
    return this.prisma.review.findMany({
      where: { referralId },
      include: { reviewedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
