import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../auth/current-user.decorator";
import { CasesService } from "./cases.service";
import {
  CreatePelaporanSekolahDto,
  CreatePengaduanMasyarakatDto,
  FindCasesQueryDto,
  VerifikasiNikDto,
  VerifikasiPengaduanDto,
} from "./dto/case.dto";

@ApiTags("cases")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("cases")
export class CasesController {
  constructor(private service: CasesService) {}

  // Alur Pencegahan - langkah 3: "Pelaporan oleh Sekolah"
  @Roles(UserRole.SEKOLAH)
  @Post("pelaporan-sekolah")
  createPelaporanSekolah(
    @Body() dto: CreatePelaporanSekolahDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.createFromPelaporanSekolah(dto, user);
  }

  // Alur Penanganan - langkah 1: "Pengaduan Masyarakat" (dicatat oleh petugas Kapanewon)
  @Roles(UserRole.KAPANEWON)
  @Post("pengaduan-masyarakat")
  createPengaduanMasyarakat(
    @Body() dto: CreatePengaduanMasyarakatDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.createFromPengaduanMasyarakat(dto, user);
  }

  // S01 -> S02
  @Roles(UserRole.SEKOLAH)
  @Post(":id/verifikasi-nik")
  verifikasiNik(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: VerifikasiNikDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.verifikasiNik(id, dto, user);
  }

  // S01(Penanganan) -> S05
  @Roles(UserRole.KAPANEWON)
  @Post(":id/verifikasi-pengaduan")
  verifikasiPengaduan(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: VerifikasiPengaduanDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.verifikasiPengaduan(id, dto, user);
  }

  @Get()
  findAll(
    @Query() query: FindCasesQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.findAll(query, user);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }

  @Get(":id/timeline")
  getTimeline(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.getTimeline(id, user);
  }
}
