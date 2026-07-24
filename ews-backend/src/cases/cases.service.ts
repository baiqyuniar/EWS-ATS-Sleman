import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CaseSource, CaseStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { generateCaseNumber } from "../common/case-number.util";
import { CaseStateMachineService } from "./case-state-machine.service";
import {
  CreatePelaporanSekolahDto,
  CreatePengaduanMasyarakatDto,
  FindCasesQueryDto,
  VerifikasiNikDto,
  VerifikasiPengaduanDto,
} from "./dto/case.dto";
import { CurrentUserPayload } from "../auth/current-user.decorator";
import { buildPaginationMeta } from "../common/pagination.dto";

const CASE_INCLUDE = {
  student: { include: { school: true } },
  report: true,
  homeVisits: { orderBy: { visitNumber: "asc" as const } },
  referrals: {
    include: {
      opd: true,
      riskFactor: true,
      interventions: { include: { interventionType: true } },
      reviews: true,
    },
  },
  monitorings: { orderBy: { createdAt: "desc" as const } },
  createdBy: { select: { id: true, name: true, role: true } },
};

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: CaseStateMachineService,
  ) {}

  /** BR-20: check if the student already has a non-final active case. */
  private async findActiveCase(studentId: number) {
    return this.prisma.case.findFirst({
      where: {
        studentId,
        status: {
          notIn: [CaseStatus.SELESAI_PENCEGAHAN, CaseStatus.CLOSED_CASE],
        },
      },
    });
  }

  // Data scoping per role (Authorization Matrix). Dipakai konsisten oleh findAll,
  // findOne, getTimeline, dan verifikasiNik/verifikasiPengaduan supaya tidak ada jalur
  // yang lupa di-scope (celah BOLA/IDOR sebelumnya: findOne/getTimeline/verifikasi*
  // tidak menerima `user` sama sekali).
  private async scopeWhereForUser(user: CurrentUserPayload): Promise<any> {
    if (user.role === UserRole.SEKOLAH) {
      return user.schoolId ? { student: { schoolId: user.schoolId } } : { id: -1 };
    }
    if (user.role === UserRole.OPD) {
      return user.opdId ? { referrals: { some: { opdId: user.opdId } } } : { id: -1 };
    }
    if (user.role === UserRole.KAPANEWON) {
      if (!user.wilayahId) return { id: -1 };
      const wilayah = await this.prisma.wilayah.findUnique({ where: { id: user.wilayahId } });
      if (!wilayah) return { id: -1 };
      const schools = await this.prisma.school.findMany({
        where: { kapanewon: wilayah.kapanewon },
        select: { id: true },
      });
      return { student: { schoolId: { in: schools.map((s) => s.id) } } };
    }
    // ADMIN & DINAS_PENDIDIKAN: akses penuh (sesuai kebutuhan oversight lintas-wilayah).
    return {};
  }

  // ---------------- ALUR PENCEGAHAN: Pelaporan oleh Sekolah (SRS "3. Pelaporan oleh Sekolah") ----------------
  async createFromPelaporanSekolah(
    dto: CreatePelaporanSekolahDto,
    user: CurrentUserPayload,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student)
      throw new NotFoundException(
        "Siswa tidak ditemukan (tidak sinkron dengan Pusdatin)",
      );
    // BOLA fix: cegah user SEKOLAH membuat Case atas nama siswa sekolah lain.
    if (user.role === UserRole.SEKOLAH && student.schoolId !== user.schoolId) {
      throw new NotFoundException(
        "Siswa tidak ditemukan (tidak sinkron dengan Pusdatin)",
      );
    }

    const active = await this.findActiveCase(dto.studentId);
    if (active && !dto.forceNewCase) {
      throw new ConflictException({
        message:
          "Siswa ini masih memiliki Case aktif. Tambahkan laporan ke Case tersebut, atau set forceNewCase=true jika ini permasalahan berbeda (BR-20).",
        existingCase: {
          id: active.id,
          nomorKasus: active.nomorKasus,
          status: active.status,
        },
      });
    }

    const nomorKasus = await generateCaseNumber(this.prisma);

    const kase = await this.prisma.case.create({
      data: {
        nomorKasus,
        studentId: dto.studentId,
        source: CaseSource.PELAPORAN_SEKOLAH,
        status: CaseStatus.CASE_CREATED,
        predictionId: dto.predictionId,
        catatan: dto.catatan,
        createdById: user.userId,
        report: { create: { isiLaporan: dto.isiLaporan } },
      },
      include: CASE_INCLUDE,
    });

    await this.stateMachine.logTimeline(
      kase.id,
      { userId: user.userId, role: user.role as UserRole },
      "CASE_CREATED",
      "Kasus dibuat dari Pelaporan Sekolah",
      dto.catatan,
      undefined,
      CaseStatus.CASE_CREATED,
    );

    return kase;
  }

  // ---------------- ALUR PENANGANAN: Pengaduan Masyarakat (SRS "1. Pengaduan Masyarakat") ----------------
  async createFromPengaduanMasyarakat(
    dto: CreatePengaduanMasyarakatDto,
    user: CurrentUserPayload,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: { school: true },
    });
    if (!student) throw new NotFoundException("Siswa tidak ditemukan");
    // BOLA fix: cegah user KAPANEWON membuat Case pengaduan untuk siswa di luar
    // wilayah kapanewon-nya sendiri.
    if (user.role === UserRole.KAPANEWON && user.wilayahId) {
      const wilayah = await this.prisma.wilayah.findUnique({ where: { id: user.wilayahId } });
      if (!wilayah || student.school?.kapanewon !== wilayah.kapanewon) {
        throw new NotFoundException("Siswa tidak ditemukan");
      }
    }

    const active = await this.findActiveCase(dto.studentId);
    if (active && !dto.forceNewCase) {
      throw new ConflictException({
        message: "Siswa ini masih memiliki Case aktif (BR-20).",
        existingCase: {
          id: active.id,
          nomorKasus: active.nomorKasus,
          status: active.status,
        },
      });
    }

    const nomorKasus = await generateCaseNumber(this.prisma);

    const kase = await this.prisma.case.create({
      data: {
        nomorKasus,
        studentId: dto.studentId,
        source: CaseSource.PENGADUAN_MASYARAKAT,
        status: CaseStatus.CASE_CREATED,
        createdById: user.userId,
        report: {
          create: {
            namaPelapor: dto.namaPelapor,
            kontakPelapor: dto.kontakPelapor,
            caraPengaduan: dto.caraPengaduan,
            kondisiAwal: dto.kondisiAwal,
            isiLaporan: dto.isiLaporan,
          },
        },
      },
      include: CASE_INCLUDE,
    });

    await this.stateMachine.logTimeline(
      kase.id,
      { userId: user.userId, role: user.role as UserRole },
      "CASE_CREATED",
      "Kasus dibuat dari Pengaduan Masyarakat",
      dto.kondisiAwal,
      undefined,
      CaseStatus.CASE_CREATED,
    );

    return kase;
  }

  // ---------------- S01 -> S02: Verifikasi NIK (Sekolah, jalur Pelaporan Sekolah) ----------------
  async verifikasiNik(
    caseId: number,
    dto: VerifikasiNikDto,
    user: CurrentUserPayload,
  ) {
    const kase = await this.findOne(caseId, user);
    if (kase.source !== CaseSource.PELAPORAN_SEKOLAH) {
      throw new BadRequestException(
        "Verifikasi NIK hanya berlaku untuk jalur Pelaporan Sekolah",
      );
    }
    if (!dto.nikVerified) {
      throw new BadRequestException(
        "NIK tidak ditemukan di Pusdatin. Operator sekolah perlu menginput data diri siswa baru sebelum melanjutkan.",
      );
    }

    await this.prisma.caseReport.update({
      where: { caseId },
      data: { nikVerified: true, nikVerifiedAt: new Date() },
    });

    return this.stateMachine.transition(
      caseId,
      CaseStatus.VERIFIKASI_NIK,
      { userId: user.userId, role: user.role as UserRole },
      "NIK terverifikasi ke Pusdatin",
      dto.catatan,
    );
  }

  // ---------------- S01(Penanganan) -> S05: Verifikasi Pengaduan (Kapanewon) ----------------
  async verifikasiPengaduan(
    caseId: number,
    dto: VerifikasiPengaduanDto,
    user: CurrentUserPayload,
  ) {
    const kase = await this.findOne(caseId, user);
    if (kase.source !== CaseSource.PENGADUAN_MASYARAKAT) {
      throw new BadRequestException(
        "Verifikasi Pengaduan hanya berlaku untuk jalur Pengaduan Masyarakat",
      );
    }
    if (!dto.validasiIdentitas) {
      throw new BadRequestException(
        "Identitas siswa tidak valid, pengaduan tidak dapat dilanjutkan ke rujukan.",
      );
    }

    await this.prisma.caseReport.update({
      where: { caseId },
      data: {
        validasiIdentitas: true,
        koordinasiSekolah: dto.koordinasiSekolah,
      },
    });

    return this.stateMachine.transition(
      caseId,
      CaseStatus.MENUNGGU_RUJUKAN,
      { userId: user.userId, role: user.role as UserRole },
      "Pengaduan diverifikasi Kapanewon, menunggu rujukan ke OPD",
      dto.catatan,
    );
  }

  async findAll(query: FindCasesQueryDto, user: CurrentUserPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.source) where.source = query.source;
    if (query.search) {
      where.OR = [
        { nomorKasus: { contains: query.search, mode: "insensitive" } },
        { student: { nama: { contains: query.search, mode: "insensitive" } } },
        { student: { nisn: { contains: query.search } } },
      ];
    }

    // Data scoping per role (Authorization Matrix: Case CRUD = Sekolah/Kapanewon; OPD only sees referred cases BR-11)
    Object.assign(where, await this.scopeWhereForUser(user));

    const [data, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        include: CASE_INCLUDE,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.case.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  // BOLA fix: sebelumnya findOne(caseId) tidak menerima `user` sama sekali — siapa pun
  // yang login (SEKOLAH sekolah lain, OPD lain, dst) bisa membuka detail Case manapun
  // hanya dengan menebak ID. Sekarang di-scope sama seperti findAll.
  async findOne(caseId: number, user: CurrentUserPayload) {
    const where = { id: caseId, ...(await this.scopeWhereForUser(user)) };
    const kase = await this.prisma.case.findFirst({
      where,
      include: CASE_INCLUDE,
    });
    // 404 (bukan 403) baik untuk "tidak ada" maupun "ada tapi bukan wewenang Anda" —
    // supaya tidak membocorkan keberadaan Case milik pihak lain.
    if (!kase) throw new NotFoundException("Case tidak ditemukan");
    return kase;
  }

  async getTimeline(caseId: number, user: CurrentUserPayload) {
    await this.findOne(caseId, user);
    return this.prisma.caseTimeline.findMany({
      where: { caseId },
      orderBy: { createdAt: "asc" },
      include: { actor: { select: { id: true, name: true, role: true } } },
    });
  }
}
