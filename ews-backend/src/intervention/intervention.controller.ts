import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { InterventionService } from './intervention.service';
import { CreateInterventionDto, SubmitCompletionDto, UpdateInterventionResultDto } from './dto/intervention.dto';

@ApiTags('intervention')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class InterventionController {
  constructor(private service: InterventionService) {}

  @Roles(UserRole.OPD)
  @Post('referrals/:referralId/interventions')
  create(
    @Param('referralId', ParseIntPipe) referralId: number,
    @Body() dto: CreateInterventionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(referralId, dto, user);
  }

  @Roles(UserRole.OPD)
  @Put('interventions/:id/result')
  updateResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInterventionResultDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.updateResult(id, dto, user);
  }

  // S07 -> S08
  @Roles(UserRole.OPD)
  @Post('referrals/:referralId/submit-completion')
  submitCompletion(
    @Param('referralId', ParseIntPipe) referralId: number,
    @Body() dto: SubmitCompletionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.submitCompletion(referralId, dto, user);
  }

  @Get('referrals/:referralId/interventions')
  findAll(@Param('referralId', ParseIntPipe) referralId: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findAllByReferral(referralId, user);
  }
}
