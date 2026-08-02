import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, buildPaginationMeta } from '../../common/pagination.dto';

@Injectable()
export class PendidikanOrtuService {
  constructor(private prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.pendidikanOrtu.create({ data: dto });
  }

  async findAll(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.search
      ? {
          OR: [
            { nama: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      // Diurutkan ASC berdasarkan kodeOrdinal (bukan nama) supaya daftar tampil
      // sesuai jenjang: dari "Tidak sekolah"/SD naik ke S3 — bukan alfabetis
      // (alfabetis akan menaruh "S1" sebelum "SD", yang salah urutan jenjang).
      this.prisma.pendidikanOrtu.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { kodeOrdinal: 'asc' } }),
      this.prisma.pendidikanOrtu.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: number) {
    const item = await this.prisma.pendidikanOrtu.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('PendidikanOrtu tidak ditemukan');
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.pendidikanOrtu.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.pendidikanOrtu.delete({ where: { id } });
  }
}
