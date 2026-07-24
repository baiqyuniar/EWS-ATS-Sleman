import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AttachmentOwnerType,
  CaseStatus,
  HomeVisitResult,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CaseStateMachineService } from "../cases/case-state-machine.service";
import { CreateHomeVisitDto } from "./dto/home-visit.dto";
import { CurrentUserPayload } from "../auth/current-user.decorator";

@Injectable()
export class HomeVisitService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: CaseStateMachineService,
  ) {}

  // SRS "4. Home Visit oleh Sekolah". BR-06: bisa lebih dari sekali, BR-07: hanya visit
  // terakhir yang menentukan hasil, BR-15: foto wajib.
  async create(
    caseId: number,
    dto: CreateHomeVisitDto,
    user: CurrentUserPayload,
  ) {
    if (!dto.fotoUrls || dto.fotoUrls.length === 0) {
      throw new BadRequestException("Foto Home Visit wajib diunggah (BR-15)");
    }

    const kase = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: { student: { select: { schoolId: true } } },
    });
    if (!kase) throw new NotFoundException("Case tidak ditemukan");
    // BOLA fix: cegah SEKOLAH mengisi Home Visit (termasuk unggah foto) untuk Case
    // milik sekolah lain.
    if (user.role === UserRole.SEKOLAH && kase.student.schoolId !== user.schoolId) {
      throw new NotFoundException("Case tidak ditemukan");
    }

    const allowedStatuses: Set<CaseStatus> = new Set([
      CaseStatus.VERIFIKASI_NIK,
      CaseStatus.HOME_VISIT,
    ]);

    if (!allowedStatuses.has(kase.status)) {
      throw new BadRequestException(
        `Home Visit hanya dapat dilakukan setelah Verifikasi NIK. Status saat ini: ${kase.status}`,
      );
    }

    const lastVisit = await this.prisma.homeVisit.findFirst({
      where: { caseId },
      orderBy: { visitNumber: "desc" },
    });
    const visitNumber = (lastVisit?.visitNumber ?? 0) + 1;

    const homeVisit = await this.prisma.homeVisit.create({
      data: {
        caseId,
        visitNumber,
        tanggal: new Date(dto.tanggal),
        hasil: dto.hasil,
        catatan: dto.catatan,
        latitude: dto.latitude,
        longitude: dto.longitude,
        petugasId: user.userId,
        fotos: {
          create: dto.fotoUrls.map((url) => ({
            ownerType: AttachmentOwnerType.HOME_VISIT,
            fileUrl: url,
          })),
        },
      },
    });

    await this.stateMachine.logTimeline(
      caseId,
      { userId: user.userId, role: user.role as UserRole },
      "HOME_VISIT_ADDED",
      `Home Visit ke-${visitNumber} dicatat`,
      dto.catatan,
    );

    // BR-07: keputusan mengikuti Visit terakhir.
    if (dto.hasil === HomeVisitResult.KEMBALI_SEKOLAH) {
      await this.stateMachine.transition(
        caseId,
        CaseStatus.SELESAI_PENCEGAHAN,
        { userId: user.userId, role: user.role as UserRole },
        "Siswa kembali sekolah — pencegahan berhasil, kasus selesai (BR-08)",
      );
    } else if (dto.hasil === HomeVisitResult.TIDAK_KEMBALI) {
      await this.stateMachine.transition(
        caseId,
        CaseStatus.MENUNGGU_RUJUKAN,
        { userId: user.userId, role: user.role as UserRole },
        "Siswa tidak kembali sekolah — menunggu rujukan Kepanewon",
      );
    } else {
      // BELUM_SELESAI: stay in HOME_VISIT status, waiting for a further visit.
      if (kase.status !== CaseStatus.HOME_VISIT) {
        await this.stateMachine.transition(
          caseId,
          CaseStatus.HOME_VISIT,
          { userId: user.userId, role: user.role as UserRole },
          "Home Visit dimulai, belum ada keputusan akhir",
        );
      }
    }

    return this.prisma.homeVisit.findUnique({
      where: { id: homeVisit.id },
      include: { fotos: true },
    });
  }

  async findAllByCase(caseId: number, user: CurrentUserPayload) {
    if (user.role === UserRole.SEKOLAH && user.schoolId) {
      const kase = await this.prisma.case.findUnique({
        where: { id: caseId },
        include: { student: { select: { schoolId: true } } },
      });
      if (!kase || kase.student.schoolId !== user.schoolId) {
        throw new NotFoundException("Case tidak ditemukan");
      }
    }
    return this.prisma.homeVisit.findMany({
      where: { caseId },
      orderBy: { visitNumber: "asc" },
      include: { fotos: true, petugas: { select: { id: true, name: true } } },
    });
  }
}
