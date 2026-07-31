import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../auth/current-user.decorator";
import { DashboardService } from "./dashboard.service";

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get()
  get(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getDashboard(user);
  }

  // Dipakai komponen "VillageHeatmap" — peta risiko per kapanewon (kabupaten-wide).
  // ?mode=residence (default) = kelompokkan lewat kecamatan tempat siswa tinggal;
  // ?mode=school = kelompokkan lewat kapanewon lokasi sekolah.
  @Get("kapanewon-heatmap")
  getKapanewonHeatmap(@Query("mode") mode?: "residence" | "school") {
    return this.service.getKapanewonHeatmap(
      mode === "school" ? "school" : "residence",
    );
  }

  // Dipakai komponen "ReportTable" — daftar kasus terbaru (role-scoped).
  @Get("recent-cases")
  getRecentCases(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getRecentCases(user);
  }

  // Dipakai komponen "ReportTable" di Dashboard Sekolah — siswa risiko tertinggi.
  @Get("top-risk-students")
  async getTopRiskStudents(@CurrentUser() user: CurrentUserPayload) {
    if (user.role === "SEKOLAH" && !user.schoolId) {
      throw new ForbiddenException(
        "Akun sekolah tidak terhubung ke sekolah manapun",
      );
    }
    return this.service.getTopRiskStudents(
      user.role === "SEKOLAH" ? user.schoolId : undefined,
    );
  }

  // Dipakai komponen "DashboardChart" — tren jumlah kasus per bulan (role-scoped).
  @Get("monthly-trend")
  getMonthlyTrend(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getMonthlyTrend(user);
  }

  // Analisis otomatis (mastering data) untuk Dashboard Sekolah. User SEKOLAH hanya
  // boleh mengakses sekolahnya sendiri; role lain (ADMIN/DINAS/KAPANEWON) bebas memilih.
  @Get("schools/:schoolId/analytics")
  async schoolAnalytics(
    @Param("schoolId") schoolId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const id = Number(schoolId);
    if (user.role === "SEKOLAH" && user.schoolId !== id) {
      throw new ForbiddenException(
        "Tidak berwenang mengakses dashboard sekolah lain",
      );
    }
    return this.service.schoolAnalytics(id);
  }

  // Dipakai komponen "DashboardChart" di Dashboard Sekolah — tren risiko per periode.
  @Get("schools/:schoolId/risk-trend")
  async getSchoolRiskTrend(
    @Param("schoolId") schoolId: string,
    @Query("period") period: "week" | "month" | "year" = "month",
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const id = Number(schoolId);
    if (user.role === "SEKOLAH" && user.schoolId !== id) {
      throw new ForbiddenException(
        "Tidak berwenang mengakses dashboard sekolah lain",
      );
    }
    return this.service.getSchoolRiskTrend(id, period);
  }

  // Analisis otomatis (mastering data) gabungan seluruh sekolah dalam satu kapanewon.
  @Get("kapanewon/:kapanewon/analytics")
  async kapanewonAnalytics(
    @Param("kapanewon") kapanewon: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (user.role === "KAPANEWON") {
      await this.service.assertKapanewonAccess(user.wilayahId, kapanewon);
    }
    return this.service.kapanewonAnalytics(kapanewon);
  }
}
