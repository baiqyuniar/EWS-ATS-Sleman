import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { HomeVisitService } from './home-visit.service';
import { CreateHomeVisitDto } from './dto/home-visit.dto';

@ApiTags('home-visit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cases/:caseId/home-visits')
export class HomeVisitController {
  constructor(private service: HomeVisitService) {}

  @Roles(UserRole.SEKOLAH)
  @Post()
  create(
    @Param('caseId', ParseIntPipe) caseId: number,
    @Body() dto: CreateHomeVisitDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(caseId, dto, user);
  }

  @Get()
  findAll(@Param('caseId', ParseIntPipe) caseId: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findAllByCase(caseId, user);
  }
}
