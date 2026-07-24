import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, buildPaginationMeta } from '../../common/pagination.dto';

@Injectable()
export class OpdService {
  constructor(private prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.opd.create({ data: dto });
  }

  async findAll(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.search
      ? {
          OR: [
            { nama: { contains: query.search, mode: 'insensitive' as const } },
            { kode: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.opd.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { nama: 'asc' } }),
      this.prisma.opd.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: number) {
    const item = await this.prisma.opd.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('OPD tidak ditemukan');
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.opd.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.opd.delete({ where: { id } });
  }
}
