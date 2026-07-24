import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AssignmentStatus,
  AttachmentOwnerType,
  CaseStatus,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CaseStateMachineService } from "../cases/case-state-machine.service";
import {
  CreateInterventionDto,
  SubmitCompletionDto,
  UpdateInterventionResultDto,
} from "./dto/intervention.dto";
import { CurrentUserPayload } from "../auth/current-user.decorator";

@Injectable()
export class InterventionService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: CaseStateMachineService,
  ) {}

  // BOLA fix: sebelumnya getReferralOrThrow tidak pernah memeriksa referral.opdId
  // terhadap user.opdId di SATU PUN method pada file ini — OPD mana pun bisa
  // membuat/melihat intervensi milik OPD lain hanya dengan menebak referralId.
  private async getReferralOrThrow(referralId: number, user?: CurrentUserPayload) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: { case: true },
    });
    if (!referral) throw new NotFoundException("Rujukan tidak ditemukan");
    if (user?.role === UserRole.OPD && referral.opdId !== user.opdId) {
      throw new NotFoundException("Rujukan tidak ditemukan");
    }
    if (user?.role === UserRole.SEKOLAH && user.schoolId && referral.case) {
      const student = await this.prisma.student.findUnique({
        where: { id: referral.case.studentId },
        select: { schoolId: true },
      });
      if (student?.schoolId !== user.schoolId) {
        throw new NotFoundException("Rujukan tidak ditemukan");
      }
    }
    return referral;
  }

  // SRS "7. Verifikasi & Intervensi oleh OPD". BR-12: OPD dapat melakukan banyak intervensi per Case.
  // Sejak penyesuaian DO-Student: referral bisa juga tanpa Case (origin=DO_STUDENT) — dalam hal ini
  // status dicek langsung dari Referral.status, bukan dari Case.status, dan tidak ada transisi Case.
  async create(
    referralId: number,
    dto: CreateInterventionDto,
    user: CurrentUserPayload,
  ) {
    const referral = await this.getReferralOrThrow(referralId, user);

    if (referral.case) {
      const allowedCaseStatuses: CaseStatus[] = [
        CaseStatus.DIRUJUK_OPD,
        CaseStatus.INTERVENSI_BERJALAN,
      ];
      if (!allowedCaseStatuses.includes(referral.case.status)) {
        throw new BadRequestException(
          `Intervensi hanya dapat ditambahkan saat kasus Dirujuk OPD atau Intervensi Berjalan. Status saat ini: ${referral.case.status}`,
        );
      }
    } else {
      const allowedReferralStatuses: AssignmentStatus[] = [
        AssignmentStatus.MENUNGGU,
        AssignmentStatus.DITERIMA,
        AssignmentStatus.INTERVENSI_BERJALAN,
      ];
      if (!allowedReferralStatuses.includes(referral.status)) {
        throw new BadRequestException(
          `Intervensi hanya dapat ditambahkan saat rujukan Menunggu, Diterima, atau Intervensi Berjalan. Status saat ini: ${referral.status}`,
        );
      }
    }

    const intervention = await this.prisma.intervention.create({
      data: {
        referralId,
        interventionTypeId: dto.interventionTypeId,
        deskripsi: dto.deskripsi,
        tanggal: dto.tanggal ? new Date(dto.tanggal) : new Date(),
        petugasId: user.userId,
      },
      include: { interventionType: true },
    });

    // First intervention moves the referral (dan Case bila ada) ke "Intervensi Berjalan" (S06 -> S07).
    if (referral.status === AssignmentStatus.MENUNGGU || referral.status === AssignmentStatus.DITERIMA) {
      await this.prisma.referral.update({
        where: { id: referralId },
        data: { status: AssignmentStatus.INTERVENSI_BERJALAN },
      });
      if (referral.caseId) {
        await this.stateMachine.transition(
          referral.caseId,
          CaseStatus.INTERVENSI_BERJALAN,
          { userId: user.userId, role: user.role as UserRole },
          "OPD mulai melaksanakan intervensi",
        );
      }
    } else if (referral.caseId) {
      await this.stateMachine.logTimeline(
        referral.caseId,
        { userId: user.userId, role: user.role as UserRole },
        "INTERVENTION_ADDED",
        `Intervensi tambahan dicatat: ${dto.deskripsi}`,
      );
    }

    return intervention;
  }

  // BR-16: hasil wajib diisi sebelum intervensi dianggap lengkap.
  async updateResult(
    interventionId: number,
    dto: UpdateInterventionResultDto,
    user: CurrentUserPayload,
  ) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id: interventionId },
      include: { referral: true },
    });
    if (!intervention)
      throw new NotFoundException("Intervensi tidak ditemukan");
    // BOLA fix: cegah OPD lain mengisi/mengubah hasil intervensi bukan miliknya.
    if (user.role === UserRole.OPD && intervention.referral.opdId !== user.opdId) {
      throw new NotFoundException("Intervensi tidak ditemukan");
    }

    return this.prisma.intervention.update({
      where: { id: interventionId },
      data: {
        hasil: dto.hasil,
        attachments: dto.lampiranUrls
          ? {
              create: dto.lampiranUrls.map((url) => ({
                ownerType: AttachmentOwnerType.INTERVENTION,
                fileUrl: url,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    });
  }

  // SRS "8. Ajukan Intervensi Selesai" -> S07 -> S08. Requires every intervention on this
  // referral to have a recorded `hasil` (BR-16), matching "Jika seluruh intervensi telah dilakukan".
  async submitCompletion(
    referralId: number,
    dto: SubmitCompletionDto,
    user: CurrentUserPayload,
  ) {
    const referral = await this.getReferralOrThrow(referralId, user);

    const interventions = await this.prisma.intervention.findMany({
      where: { referralId },
    });
    if (interventions.length === 0) {
      throw new BadRequestException(
        "Belum ada intervensi yang dicatat untuk kasus ini",
      );
    }
    const incomplete = interventions.filter((i) => !i.hasil);
    if (incomplete.length > 0) {
      throw new BadRequestException(
        `${incomplete.length} intervensi belum memiliki hasil (BR-16). Lengkapi hasil setiap intervensi terlebih dahulu.`,
      );
    }

    await this.prisma.referral.update({
      where: { id: referralId },
      data: { status: AssignmentStatus.SELESAI_DIAJUKAN },
    });

    if (!referral.caseId) {
      // Rujukan DO-Student: tidak ada Case/state machine untuk ditransisikan.
      return this.prisma.referral.findUnique({ where: { id: referralId } });
    }

    return this.stateMachine.transition(
      referral.caseId,
      CaseStatus.VERIFIKASI_PENYELESAIAN,
      { userId: user.userId, role: user.role as UserRole },
      "OPD mengajukan status Intervensi Selesai",
      dto.catatan,
    );
  }

  async findAllByReferral(referralId: number, user: CurrentUserPayload) {
    // BOLA fix: pastikan requester berwenang atas referral ini sebelum menampilkan
    // daftar intervensinya (sebelumnya endpoint ini tanpa @Roles() & tanpa scoping sama sekali).
    await this.getReferralOrThrow(referralId, user);
    return this.prisma.intervention.findMany({
      where: { referralId },
      include: {
        interventionType: true,
        attachments: true,
        petugas: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
