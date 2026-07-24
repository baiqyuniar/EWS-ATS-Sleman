import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, buildPaginationMeta } from '../../common/pagination.dto';

@Injectable()
export class WilayahService {
  constructor(private prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.wilayah.create({ data: dto });
  }

  async findAll(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.search
      ? {
          OR: [
            { kapanewon: { contains: query.search, mode: 'insensitive' as const } },
            { kalurahan: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.wilayah.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { kapanewon: 'asc' } }),
      this.prisma.wilayah.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: number) {
    const item = await this.prisma.wilayah.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Wilayah tidak ditemukan');
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.wilayah.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.wilayah.delete({ where: { id } });
  }
}
