import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/review.dto';

@ApiTags('review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('referrals/:referralId/review')
export class ReviewController {
  constructor(private service: ReviewService) {}

  @Roles(UserRole.DINAS_PENDIDIKAN)
  @Post()
  create(
    @Param('referralId', ParseIntPipe) referralId: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(referralId, dto, user);
  }

  @Get()
  findAll(@Param('referralId', ParseIntPipe) referralId: number) {
    return this.service.findAllByReferral(referralId);
  }
}
