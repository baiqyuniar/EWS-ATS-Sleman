import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { ReferralService } from './referral.service';
import { CreateDoStudentReferralDto, CreateReferralDto } from './dto/referral.dto';

@ApiTags('referral')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ReferralController {
  constructor(private service: ReferralService) {}

  // S05 -> S06. BR-10: rujukan Case hanya oleh Kapanewon (Admin bersifat read-only untuk Case).
  @Roles(UserRole.KAPANEWON)
  @Post('cases/:caseId/referral')
  create(
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: CreateReferralDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(caseId, dto, user);
  }

  // Jalur ringan khusus Admin: rujukan langsung siswa Putus Sekolah (DO) ke OPD, tanpa Case.
  @Roles(UserRole.ADMIN)
  @Post('students/:studentId/referral-do')
  createDoReferral(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: CreateDoStudentReferralDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.createForDoStudent(studentId, dto, user);
  }

  @Get('referrals')
  findAll(@CurrentUser() user: CurrentUserPayload) {
    if (user.role === UserRole.OPD && user.opdId) {
      return this.service.findAllForOpd(user.opdId);
    }
    return this.service.findAll();
  }

  @Get('referrals/:id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }

  // OPD memverifikasi/menerima rujukan sebelum memulai intervensi.
  @Roles(UserRole.OPD)
  @Post('referrals/:id/verify')
  verify(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.verify(id, user);
  }
}
