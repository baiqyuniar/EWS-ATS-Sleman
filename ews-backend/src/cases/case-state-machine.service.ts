import { BadRequestException, Injectable } from '@nestjs/common';
import { CaseStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Implements the unified State Machine from the SRS ("STATE MACHINE" + "Transition Matrix"):
 *
 *   S01 Case Created            (PIC: Sekolah / Kapanewon)
 *   S02 Verifikasi NIK          (PIC: Sekolah)      [jalur Pelaporan Sekolah]
 *   S03 Home Visit              (PIC: Sekolah)      [jalur Pelaporan Sekolah]
 *   S04 Selesai Pencegahan      (PIC: Sekolah)      -- final, BR-08: tidak lanjut ke penanganan
 *   S05 Menunggu Rujukan        (PIC: Kapanewon)
 *   S06 Dirujuk ke OPD          (PIC: Kapanewon)
 *   S07 Intervensi Berjalan     (PIC: OPD)
 *   S08 Verifikasi Penyelesaian (PIC: Dinas Pendidikan)
 *   S09 Monitoring              (PIC: Dinas Pendidikan)
 *   S10 Closed Case             (PIC: Dinas Pendidikan) -- final, BR-18
 *
 * BR-03: a Case has exactly one active status at a time (enforced simply by
 *        updating the single `status` column).
 * BR-04/BR-05: every transition is appended to CaseTimeline; timeline rows are
 *        never edited or deleted.
 */
type Actor = { userId: number; role: UserRole };

const ALLOWED_TRANSITIONS: Record<CaseStatus, { to: CaseStatus; roles: UserRole[] }[]> = {
  DRAFT: [{ to: CaseStatus.CASE_CREATED, roles: [UserRole.SEKOLAH, UserRole.KAPANEWON, UserRole.ADMIN] }],
  CASE_CREATED: [
    { to: CaseStatus.VERIFIKASI_NIK, roles: [UserRole.SEKOLAH, UserRole.ADMIN] }, // Pelaporan Sekolah path
    { to: CaseStatus.MENUNGGU_RUJUKAN, roles: [UserRole.KAPANEWON, UserRole.ADMIN] }, // Pengaduan Masyarakat path
  ],
  VERIFIKASI_NIK: [{ to: CaseStatus.HOME_VISIT, roles: [UserRole.SEKOLAH, UserRole.ADMIN] }],
  HOME_VISIT: [
    { to: CaseStatus.HOME_VISIT, roles: [UserRole.SEKOLAH, UserRole.ADMIN] }, // additional visit, BR-06
    { to: CaseStatus.SELESAI_PENCEGAHAN, roles: [UserRole.SEKOLAH, UserRole.ADMIN] },
    { to: CaseStatus.MENUNGGU_RUJUKAN, roles: [UserRole.SEKOLAH, UserRole.ADMIN] },
  ],
  SELESAI_PENCEGAHAN: [], // final for the prevention track (BR-08)
  MENUNGGU_RUJUKAN: [{ to: CaseStatus.DIRUJUK_OPD, roles: [UserRole.KAPANEWON, UserRole.ADMIN] }],
  DIRUJUK_OPD: [{ to: CaseStatus.INTERVENSI_BERJALAN, roles: [UserRole.OPD, UserRole.ADMIN] }],
  INTERVENSI_BERJALAN: [{ to: CaseStatus.VERIFIKASI_PENYELESAIAN, roles: [UserRole.OPD, UserRole.ADMIN] }],
  VERIFIKASI_PENYELESAIAN: [
    { to: CaseStatus.MONITORING, roles: [UserRole.DINAS_PENDIDIKAN, UserRole.ADMIN] }, // Approve
    { to: CaseStatus.INTERVENSI_BERJALAN, roles: [UserRole.DINAS_PENDIDIKAN, UserRole.ADMIN] }, // Perlu Perbaikan
  ],
  MONITORING: [{ to: CaseStatus.CLOSED_CASE, roles: [UserRole.DINAS_PENDIDIKAN, UserRole.ADMIN] }],
  CLOSED_CASE: [], // final (BR-18); reopening is a separate, explicitly-audited mechanism, not a normal transition
};

@Injectable()
export class CaseStateMachineService {
  constructor(private prisma: PrismaService) {}

  assertTransitionAllowed(from: CaseStatus, to: CaseStatus, actor: Actor) {
    if (actor.role === UserRole.ADMIN) return; // Admin can override for data-fix purposes
    const options = ALLOWED_TRANSITIONS[from] ?? [];
    const match = options.find((o) => o.to === to && o.roles.includes(actor.role));
    if (!match) {
      throw new BadRequestException(
        `Transisi status dari ${from} ke ${to} tidak diperbolehkan untuk peran ${actor.role}`,
      );
    }
  }

  /**
   * Applies a status transition and writes an immutable CaseTimeline entry (BR-04, BR-05).
   * Must be called within the same logical operation as the domain change (home visit,
   * referral, intervention, review, monitoring) so the timeline stays accurate.
   */
  async transition(
    caseId: number,
    to: CaseStatus,
    actor: Actor,
    title: string,
    description?: string,
  ) {
    const kase = await this.prisma.case.findUniqueOrThrow({ where: { id: caseId } });

    if (kase.status === CaseStatus.CLOSED_CASE) {
      throw new BadRequestException('Case sudah Closed dan bersifat final (BR-18). Gunakan mekanisme Reopen.');
    }

    this.assertTransitionAllowed(kase.status, to, actor);

    const extra: any = {};
    if (to === CaseStatus.SELESAI_PENCEGAHAN || to === CaseStatus.CLOSED_CASE) {
      extra.closedAt = new Date();
    }

    const updated = await this.prisma.case.update({
      where: { id: caseId },
      data: { status: to, ...extra },
    });

    await this.logTimeline(caseId, actor, 'STATUS_CHANGE', title, description, kase.status, to);

    return updated;
  }

  async logTimeline(
    caseId: number,
    actor: Actor,
    eventType: string,
    title: string,
    description?: string,
    fromStatus?: CaseStatus,
    toStatus?: CaseStatus,
  ) {
    return this.prisma.caseTimeline.create({
      data: {
        caseId,
        eventType,
        title,
        description,
        fromStatus,
        toStatus,
        actorId: actor.userId,
        actorRole: actor.role,
      },
    });
  }
}
