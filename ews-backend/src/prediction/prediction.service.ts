import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";
import { CurrentUserPayload } from "../auth/current-user.decorator";
import { PredictionEngineService } from "./prediction-engine.service";
import { MlClientService, MlFeatures } from "./ml-client.service";
import { SimulatePredictionDto } from "./dto/prediction.dto";
import { PaginationDto, buildPaginationMeta } from "../common/pagination.dto";
import { BulkPredictionResultDto } from "./dto/bulk-prediction-result.dto";

@Injectable()
export class PredictionService {
  constructor(
    private prisma: PrismaService,
    private engine: PredictionEngineService,
    private mlClient: MlClientService,
  ) {}

  /**
   * Builds the ML feature payload for a student, using explicit overrides from the
   * request (dto) first, falling back to stored Student/School data
   * (docs/CODEBOOK.md, repo ewsDropOut).
   */
  private buildFeatures(
    student: any,
    dto?: Partial<SimulatePredictionDto>,
  ): MlFeatures {
    const school = student.school;
    return {
      nisn: student.nisn,
      jk_bin:
        student.jenisKelamin === "L" ? 1 : student.jenisKelamin === "P" ? 0 : 1,
      num: dto?.num ?? student.numerasi ?? null,
      kode_pendidikan_ayah:
        dto?.kodePendidikanAyah ?? student.kodePendidikanAyah ?? null,
      kode_pendidikan_ibu:
        dto?.kodePendidikanIbu ?? student.kodePendidikanIbu ?? null,
      kode_penghasilan_ayah:
        dto?.kodePenghasilanAyah ?? student.kodePenghasilanAyah ?? null,
      kode_penghasilan_ibu:
        dto?.kodePenghasilanIbu ?? student.kodePenghasilanIbu ?? null,
      sulingjar: school
        ? {
            kesiapsiagaan_bencana: school.sulingjarKesiapsiagaanBencana,
            kualitas_pembelajaran: school.sulingjarKualitasPembelajaran,
            refleksi_guru: school.sulingjarRefleksiGuru,
            kepemimpinan_kepsek: school.sulingjarKepemimpinanKepsek,
            iklim_keamanan: school.sulingjarIklimKeamanan,
            iklim_kesetaraan_gender: school.sulingjarIklimKesetaraanGender,
            iklim_kebinekaan: school.sulingjarIklimKebinekaan,
            iklim_inklusivitas: school.sulingjarIklimInklusivitas,
            partisipasi_warga: school.sulingjarPartisipasiWarga,
            program_satuan_pendidikan: school.sulingjarProgramSatuanPendidikan,
          }
        : {},
    };
  }

  private bandToRiskCategory(
    band: string | null,
  ): "RENDAH" | "SEDANG" | "TINGGI" {
    if (band === "TINGGI" || band === "SEDANG" || band === "RENDAH")
      return band;
    return "RENDAH";
  }

  // "2. Klasifikasi Risiko" — single-student prediction (Simulasi Prediksi).
  // Tries the real ML model (ews-ml-service) first; falls back to the rule-based
  // placeholder engine only if the ML service is not configured/unreachable.
  async simulate(dto: SimulatePredictionDto, uploadedById: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: { school: true },
    });
    if (!student) throw new NotFoundException("Siswa tidak ditemukan");

    const features = this.buildFeatures(student, dto);
    const mlResult = await this.mlClient.predict(features);

    let probabilitas: number;
    let riskCategory: "RENDAH" | "SEDANG" | "TINGGI";
    let probDo: number | null = null;
    let risikoDoLabel: string | null = null;
    let alasanRisiko: string[] = [];
    let modelDipakai: string | null = null;

    if (mlResult) {
      if (mlResult.risiko_do === "Data Tidak Lengkap") {
        throw new BadRequestException(
          `Data siswa belum lengkap untuk model "${mlResult.model_dipakai}". Lengkapi data akademik/keluarga siswa (atau data mutu sekolah) terlebih dahulu, lalu coba lagi.`,
        );
      }
      probDo = mlResult.prob_do;
      risikoDoLabel = mlResult.risiko_do;
      alasanRisiko = mlResult.alasan_risiko;
      modelDipakai = mlResult.model_dipakai;
      riskCategory = this.bandToRiskCategory(mlResult.risk_band);
      probabilitas = Math.round((mlResult.prob_do ?? 0) * 10000) / 100; // 0-100, 2 desimal
    } else {
      // Fallback: ews-ml-service belum dikonfigurasi/tidak bisa diakses.
      const fallback = this.engine.score({
        num: features.num,
        kodePendidikanAyah: features.kode_pendidikan_ayah,
        kodePendidikanIbu: features.kode_pendidikan_ibu,
        kodePenghasilanAyah: features.kode_penghasilan_ayah,
        kodePenghasilanIbu: features.kode_penghasilan_ibu,
      });
      probabilitas = fallback.probabilitas;
      riskCategory = fallback.riskCategory;
      modelDipakai = "fallback-rule-based";
    }

    return this.prisma.prediction.create({
      data: {
        studentId: dto.studentId,
        probabilitas,
        riskCategory: riskCategory as any,
        probDo,
        risikoDoLabel,
        alasanRisiko,
        modelDipakai,
        source: "MANUAL",
        uploadedById,
        riskFactors: dto.riskFactorIds
          ? {
              create: dto.riskFactorIds.map((riskFactorId) => ({
                riskFactorId,
              })),
            }
          : undefined,
      },
      include: {
        riskFactors: { include: { riskFactor: true } },
        student: true,
      },
    });
  }

  // Batch upload: dipakai untuk memproses banyak siswa sekaligus (mis. hasil ASPD tahunan).
  // `rows` minimal berisi { studentId }, boleh menambahkan override fitur per baris.
  async bulkCreate(
    rows: Array<{ studentId: number } & Partial<SimulatePredictionDto>>,
    uploadedById: number,
    datasetBatch: string,
  ) {
    const results: BulkPredictionResultDto[] = [];
    for (const row of rows) {
      const student = await this.prisma.student.findUnique({
        where: { id: row.studentId },
        include: { school: true },
      });

      if (!student) {
        results.push({
          studentId: row.studentId,
          success: false,
          error: "Siswa tidak ditemukan",
        });
        continue;
      }

      const features = this.buildFeatures(student, row);
      const mlResult = await this.mlClient.predict(features);

      let probabilitas: number;
      let riskCategory: "RENDAH" | "SEDANG" | "TINGGI";
      let probDo: number | null = null;
      let risikoDoLabel: string | null = null;
      let alasanRisiko: string[] = [];
      let modelDipakai: string | null = null;

      if (mlResult && mlResult.risiko_do !== "Data Tidak Lengkap") {
        probDo = mlResult.prob_do;
        risikoDoLabel = mlResult.risiko_do;
        alasanRisiko = mlResult.alasan_risiko;
        modelDipakai = mlResult.model_dipakai;
        riskCategory = this.bandToRiskCategory(mlResult.risk_band);
        probabilitas = Math.round((mlResult.prob_do ?? 0) * 10000) / 100;
      } else if (mlResult) {
        results.push({
          studentId: row.studentId,
          success: false,
          error: "Data Tidak Lengkap untuk model ML",
        });
        continue;
      } else {
        const fallback = this.engine.score({
          num: features.num,
          kodePendidikanAyah: features.kode_pendidikan_ayah,
          kodePendidikanIbu: features.kode_pendidikan_ibu,
          kodePenghasilanAyah: features.kode_penghasilan_ayah,
          kodePenghasilanIbu: features.kode_penghasilan_ibu,
        });

        probabilitas = fallback.probabilitas;
        riskCategory = fallback.riskCategory;
        modelDipakai = "fallback-rule-based";
      }

      const prediction = await this.prisma.prediction.create({
        data: {
          studentId: row.studentId,
          probabilitas,
          riskCategory: riskCategory as any,
          probDo,
          risikoDoLabel,
          alasanRisiko,
          modelDipakai,
          source: "ML_BATCH",
          datasetBatch,
          uploadedById,
        },
      });

      results.push({
        studentId: row.studentId,
        success: true,
        predictionId: prediction.id,
        probabilitas: prediction.probabilitas,
        riskCategory: prediction.riskCategory,
        modelDipakai: prediction.modelDipakai,
      });
    }

    return {
      processed: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // BOLA fix: findAll/findActionable/findByStudent sebelumnya sama sekali tidak
  // menerima `user` — siapa pun yang login (mis. akun SEKOLAH lain) bisa melihat
  // skor & alasan risiko ML seluruh siswa se-kabupaten. Helper ini dipakai ketiganya
  // agar konsisten dengan scoping di modul lain (students/cases).
  private async studentWhereForUser(user: CurrentUserPayload): Promise<any> {
    if (user.role === UserRole.SEKOLAH) {
      return user.schoolId ? { schoolId: user.schoolId } : { id: -1 };
    }
    if (user.role === UserRole.KAPANEWON) {
      if (!user.wilayahId) return { id: -1 };
      const wilayah = await this.prisma.wilayah.findUnique({ where: { id: user.wilayahId } });
      if (!wilayah) return { id: -1 };
      const schools = await this.prisma.school.findMany({
        where: { kapanewon: wilayah.kapanewon },
        select: { id: true },
      });
      return { schoolId: { in: schools.map((s) => s.id) } };
    }
    // ADMIN & DINAS_PENDIDIKAN: akses penuh (oversight lintas-wilayah).
    return {};
  }

  async findAll(query: PaginationDto & { riskCategory?: string }, user: CurrentUserPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = { student: await this.studentWhereForUser(user) };
    if (query.riskCategory) where.riskCategory = query.riskCategory;

    const [data, total] = await Promise.all([
      this.prisma.prediction.findMany({
        where,
        include: {
          student: { include: { school: true } },
          riskFactors: { include: { riskFactor: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.prediction.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findByStudent(studentId: number, user: CurrentUserPayload) {
    const studentWhere = await this.studentWhereForUser(user);
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, ...studentWhere },
      select: { id: true },
    });
    // 404 (bukan 403): tidak membocorkan keberadaan siswa di luar wewenang requester.
    if (!student) throw new NotFoundException("Siswa tidak ditemukan");

    return this.prisma.prediction.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: { riskFactors: { include: { riskFactor: true } } },
    });
  }

  // Latest prediction per student that is SEDANG/TINGGI and does not yet have a Case —
  // this is what a Sekolah dashboard would show as "perlu ditindaklanjuti".
  async findActionableRisks(user: CurrentUserPayload) {
    const studentWhere = await this.studentWhereForUser(user);
    const predictions = await this.prisma.prediction.findMany({
      where: { riskCategory: { in: ["SEDANG", "TINGGI"] }, student: studentWhere },
      distinct: ["studentId"],
      orderBy: [{ studentId: "asc" }, { createdAt: "desc" }],
      include: { student: { include: { school: true, cases: true } } },
    });
    return predictions.filter(
      (p) =>
        p.student.cases.length === 0 ||
        p.student.cases.every((c) =>
          ["SELESAI_PENCEGAHAN", "CLOSED_CASE"].includes(c.status),
        ),
    );
  }
}
