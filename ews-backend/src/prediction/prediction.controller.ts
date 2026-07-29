import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/pagination.dto';
import { PredictionService } from './prediction.service';
import { SimulatePredictionDto } from './dto/prediction.dto';

// Layer 1 - Intelligence Layer. Prediction NEVER creates a Case automatically (BR-19).
@ApiTags('prediction')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('predictions')
export class PredictionController {
  constructor(private service: PredictionService) {}

  @Roles(UserRole.SEKOLAH)
  @Post('simulate')
  simulate(@Body() dto: SimulatePredictionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.simulate(dto, user);
  }

  @Roles(UserRole.SEKOLAH)
  @Post('bulk-upload')
  bulkUpload(
    @Body()
    body: {
      datasetBatch: string;
      rows: Array<{ nisn: string } & Partial<Omit<SimulatePredictionDto, 'studentId'>>>;
    },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // NOTE: for a real CSV/XLSX file upload, add a Multer FileInterceptor here and
    // parse the file server-side (e.g. with the `xlsx` package) into `rows` before
    // calling bulkCreate. This JSON-rows endpoint keeps the contract stable either way.
    return this.service.bulkCreate(body.rows, user, body.datasetBatch);
  }

  // Prediksi ML mentah (skor & alasan risiko) tidak relevan untuk alur kerja OPD
  // (OPD bekerja dari Referral/Intervention, bukan skor mentah) — dibatasi di sini,
  // ditambah scoping per-sekolah/kapanewon di service (BOLA fix).
  @Roles(UserRole.ADMIN, UserRole.SEKOLAH, UserRole.KAPANEWON, UserRole.DINAS_PENDIDIKAN)
  @Get()
  findAll(@Query() query: PaginationDto & { riskCategory?: string }, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(query, user);
  }

  @Roles(UserRole.ADMIN, UserRole.SEKOLAH, UserRole.KAPANEWON, UserRole.DINAS_PENDIDIKAN)
  @Get('actionable')
  findActionable(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findActionableRisks(user);
  }

  @Roles(UserRole.ADMIN, UserRole.SEKOLAH, UserRole.KAPANEWON, UserRole.DINAS_PENDIDIKAN)
  @Get('student/:studentId')
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findByStudent(studentId, user);
  }
}
