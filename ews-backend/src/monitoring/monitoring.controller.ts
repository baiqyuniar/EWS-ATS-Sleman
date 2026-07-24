import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { MonitoringService } from './monitoring.service';
import { CloseCaseDto, CreateMonitoringDto, ReopenCaseDto } from './dto/monitoring.dto';

@ApiTags('monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cases/:caseId')
export class MonitoringController {
  constructor(private service: MonitoringService) {}

  // BR-17: Monitoring hanya dicatat oleh Dinas Pendidikan. Admin bersifat read-only (lih. GET di bawah).
  @Roles(UserRole.DINAS_PENDIDIKAN)
  @Post('monitoring')
  create(
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: CreateMonitoringDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(caseId, dto, user);
  }

  // Tanpa @Roles: dapat diakses semua peran yang berwenang melihat Case ini (termasuk Admin, read-only).
  @Get('monitoring')
  findAll(@Param('caseId', ParseIntPipe) caseId: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findAllByCase(caseId, user);
  }

  // S09 -> S10
  @Roles(UserRole.DINAS_PENDIDIKAN)
  @Post('close')
  closeCase(
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: CloseCaseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.closeCase(caseId, dto, user);
  }

  @Roles(UserRole.DINAS_PENDIDIKAN)
  @Post('reopen')
  reopenCase(
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: ReopenCaseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.reopenCase(caseId, dto, user);
  }
}
