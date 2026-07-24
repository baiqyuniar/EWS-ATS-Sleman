import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, buildPaginationMeta } from '../../common/pagination.dto';

@Injectable()
export class RegulationsService {
  constructor(private prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.regulation.create({ data: dto });
  }

  async findAll(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.search
      ? {
          OR: [
            { judul: { contains: query.search, mode: 'insensitive' as const } },
            { nomor: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.regulation.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { judul: 'asc' } }),
      this.prisma.regulation.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: number) {
    const item = await this.prisma.regulation.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Regulation tidak ditemukan');
    return item;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.regulation.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.regulation.delete({ where: { id } });
  }
}
