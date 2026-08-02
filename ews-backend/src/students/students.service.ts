import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateStudentDto,
  FindStudentsQueryDto,
  UpdateStudentDto,
} from "./dto/student.dto";
import { buildPaginationMeta } from "../common/pagination.dto";
import { CurrentUserPayload } from "../auth/current-user.decorator";
import { blindIndex, decryptSensitive, encryptSensitive } from "../common/crypto.util";

// SECURITY: NIK disimpan terenkripsi (lihat src/common/crypto.util.ts) — helper di
// bawah ini men-decrypt kolom `nik` sebelum data dikembalikan ke client, dan
// dipakai konsisten di findAll/findOne supaya tidak ada jalur yang lupa decrypt.
function withDecryptedNik<T extends { nik?: string | null }>(student: T): T {
  if (!student) return student;
  return { ...student, nik: decryptSensitive(student.nik ?? null) ?? student.nik };
}

// Relasi mastering data yang ditampilkan di detail/list siswa. Dipisah supaya
// mudah dipakai ulang di findAll/findOne.
const MASTER_INCLUDE = {
  agama: true,
  kebutuhanKhusus: true,
  jenisTinggal: true,
  alatTransportasi: true,
  pendidikanAyah: true,
  pendidikanIbu: true,
  pekerjaanAyah: true,
  pekerjaanIbu: true,
  penghasilanAyah: true,
  penghasilanIbu: true,
  kebutuhanKhususAyah: true,
  kebutuhanKhususIbu: true,
} as const;

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  private async syncOrdinalCodes<T extends Record<string, any>>(
    dto: T,
  ): Promise<T> {
    const data: any = { ...dto };
    if (data.pendidikanAyahId && data.kodePendidikanAyah === undefined) {
      const m = await this.prisma.pendidikanOrtu.findUnique({
        where: { id: data.pendidikanAyahId },
      });
      if (m) data.kodePendidikanAyah = m.kodeOrdinal;
    }
    if (data.pendidikanIbuId && data.kodePendidikanIbu === undefined) {
      const m = await this.prisma.pendidikanOrtu.findUnique({
        where: { id: data.pendidikanIbuId },
      });
      if (m) data.kodePendidikanIbu = m.kodeOrdinal;
    }
    if (data.penghasilanAyahId && data.kodePenghasilanAyah === undefined) {
      const m = await this.prisma.penghasilanOrtu.findUnique({
        where: { id: data.penghasilanAyahId },
      });
      if (m) data.kodePenghasilanAyah = m.kodeOrdinal;
    }
    if (data.penghasilanIbuId && data.kodePenghasilanIbu === undefined) {
      const m = await this.prisma.penghasilanOrtu.findUnique({
        where: { id: data.penghasilanIbuId },
      });
      if (m) data.kodePenghasilanIbu = m.kodeOrdinal;
    }
    return data as T;
  }

  async create(dto: CreateStudentDto, user: CurrentUserPayload) {
    const nikHash = blindIndex(dto.nik);
    const existing = await this.prisma.student.findFirst({
      where: { OR: [{ nisn: dto.nisn }, { nikHash }] },
    });
    if (existing) throw new ConflictException("NISN/NIK siswa sudah terdaftar");

    const data = await this.syncOrdinalCodes(dto);
    const schoolId =
      user.role === "SEKOLAH" ? (user.schoolId ?? undefined) : data.schoolId;
    const created = await this.prisma.student.create({
      data: {
        ...data,
        nik: encryptSensitive(dto.nik),
        nikHash,
        schoolId,
        tanggalLahir: data.tanggalLahir
          ? new Date(data.tanggalLahir)
          : undefined,
      } as any,
    });
    return withDecryptedNik(created);
  }

  async findAll(query: FindStudentsQueryDto, user: CurrentUserPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    // NIK sekarang terenkripsi (ciphertext acak per baris) — tidak bisa dicari
    // dengan `contains` di database. Kalau teks pencarian persis 16 digit angka,
    // dianggap pencarian NIK exact-match lewat blind index (nikHash); selain itu
    // NIK dilewati dari pencarian (nama & NISN tetap bisa dicari sebagian/contains).
    const searchIsExactNik = query.search ? /^\d{16}$/.test(query.search.trim()) : false;
    const where: any = query.search
      ? {
          OR: [
            { nama: { contains: query.search, mode: "insensitive" as const } },
            { nisn: { contains: query.search, mode: "insensitive" as const } },
            ...(searchIsExactNik ? [{ nikHash: blindIndex(query.search.trim()) }] : []),
          ],
        }
      : {};

    if (query.status) {
      where.status = query.status;
    } else if (query.excludeStatus) {
      where.status = { not: query.excludeStatus };
    }

    if (user.role === "SEKOLAH" && user.schoolId) {
      where.schoolId = user.schoolId;
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          school: { select: { id: true, nama: true } },
          alasanDoRiskFactor: {
            select: { id: true, kode: true, nama: true, kategori: true },
          },
          referrals: {
            where: { origin: "DO_STUDENT" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { opd: { select: { id: true, nama: true } } },
          },
          // Hasil prediksi ML terbaru (jika ada) — dipakai FE untuk menampilkan
          // persentase & kategori risiko langsung di kolom "Prediksi" tanpa
          // request terpisah per baris.
          predictions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          ...MASTER_INCLUDE,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nama: "asc" },
      }),
      this.prisma.student.count({ where }),
    ]);
    return { data: data.map(withDecryptedNik), meta: buildPaginationMeta(total, page, limit) };
  }

  // BOLA fix: sebelumnya findOne tidak menerima `user` sama sekali, sehingga siswa
  // manapun bisa diakses lewat ID meski bukan siswa sekolah sendiri (IDOR). Sekarang
  // user SEKOLAH hanya bisa mengakses siswa dari sekolahnya sendiri; role lain (yang
  // memang berwenang lintas-sekolah menurut Authorization Matrix) tetap bebas.
  async findOne(id: number, user: CurrentUserPayload) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        school: true,
        predictions: { orderBy: { createdAt: "desc" }, take: 5 },
        cases: { orderBy: { createdAt: "desc" } },
        ...MASTER_INCLUDE,
      },
    });
    if (!student) throw new NotFoundException("Siswa tidak ditemukan");
    if (
      user.role === "SEKOLAH" &&
      user.schoolId &&
      student.schoolId !== user.schoolId
    ) {
      // 404 (bukan 403) supaya tidak membocorkan keberadaan data siswa sekolah lain.
      throw new NotFoundException("Siswa tidak ditemukan");
    }
    return withDecryptedNik(student);
  }

  async update(id: number, dto: UpdateStudentDto, user: CurrentUserPayload) {
    await this.findOne(id, user);
    const data = await this.syncOrdinalCodes(dto);
    // Cegah user SEKOLAH memindahkan siswa keluar dari sekolahnya sendiri via update.
    if (user.role === "SEKOLAH") delete (data as any).schoolId;
    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        ...data,
        tanggalLahir: data.tanggalLahir
          ? new Date(data.tanggalLahir)
          : undefined,
      } as any,
    });
    return withDecryptedNik(updated);
  }

  async remove(id: number, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.student.update({
      where: { id },
      data: { status: "PINDAH" },
    });
  }
}
