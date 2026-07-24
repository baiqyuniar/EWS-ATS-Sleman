import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReportsService } from './reports.service';

// Authorization Matrix: Export Laporan = Admin & Dinas only.
@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Roles(UserRole.ADMIN, UserRole.DINAS_PENDIDIKAN)
  @Get('rekap')
  rekap(@Query() query: { from?: string; to?: string }) {
    return this.service.rekap(query);
  }

  @Get('statistik-sekolah')
  statistikSekolah() {
    return this.service.statistikSekolah();
  }

  @Roles(UserRole.ADMIN, UserRole.DINAS_PENDIDIKAN)
  @Get('export')
  exportRows(@Query() query: { from?: string; to?: string }) {
    return this.service.exportRows(query);
  }
}
