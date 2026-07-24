import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, buildPaginationMeta } from '../../common/pagination.dto';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  create(dto: any) {
    return this.prisma.school.create({ data: dto });
  }

  async findAll(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.search
      ? {
          OR: [
            { nama: { contains: query.search, mode: 'insensitive' as const } },
            { npsn: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.school.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { nama: 'asc' } }),
      this.prisma.school.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: number) {
    const school = await this.prisma.school.findUnique({ where: { id } });
    if (!school) throw new NotFoundException('Sekolah tidak ditemukan');
    return school;
  }

  async update(id: number, dto: any) {
    await this.findOne(id);
    return this.prisma.school.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.school.update({ where: { id }, data: { active: false } });
  }
}
