// import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
// import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
// import { Throttle } from '@nestjs/throttler';
// import { AuthService } from './auth.service';
// import { CaptchaService } from './captcha.service';
// import { LoginDto, ChangePasswordDto } from './dto/login.dto';
// import { JwtAuthGuard } from './jwt-auth.guard';
// import { CurrentUser, CurrentUserPayload } from './current-user.decorator';

// @ApiTags('auth')
// @Controller('auth')
// export class AuthController {
//   constructor(
//     private authService: AuthService,
//     private captchaService: CaptchaService,
//   ) {}

//   // Soal captcha baru untuk ditampilkan di halaman login (lihat CaptchaService).
//   // Sengaja tidak pakai JwtAuthGuard — endpoint ini dipanggil SEBELUM login.
//   @Throttle({ default: { limit: 20, ttl: 60_000 } })
//   @Get('captcha')
//   getCaptcha() {
//     return this.captchaService.generate();
//   }

//   // SECURITY: mitigasi brute-force — maksimal 5 percobaan login per menit per IP,
//   // jauh lebih ketat daripada limit umum (lihat THROTTLE_LOGIN_LIMIT di .env / ThrottlerModule).
//   // Lapisan tambahan: captcha (di atas) + lockdown per akun (lihat AuthService.login()).
//   @Throttle({ default: { limit: 5, ttl: 60_000 } })
//   @Post('login')
//   login(@Body() dto: LoginDto) {
//     return this.authService.login(
//       dto.email,
//       dto.password,
//       dto.captchaToken,
//       dto.captchaNonce,
//       dto.website,
//     );
//   }

//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
//   @Get('me')
//   me(@CurrentUser() user: CurrentUserPayload) {
//     return this.authService.me(user.userId);
//   }

//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
//   @Post('change-password')
//   changePassword(@CurrentUser() user: CurrentUserPayload, @Body() dto: ChangePasswordDto) {
//     return this.authService.changePassword(user.userId, dto.oldPassword, dto.newPassword);
//   }

//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
//   @Post('logout')
//   logout() {
//     // Stateless JWT: logout is handled client-side by discarding the token.
//     return { message: 'Logout berhasil' };
//   }
// }

import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { LoginDto, ChangePasswordDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from './current-user.decorator';
import { ACCESS_TOKEN_COOKIE, getAccessTokenCookieOptions } from '../config/security.config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private captchaService: CaptchaService,
    private config: ConfigService,
  ) {}

  // Soal captcha baru untuk ditampilkan di halaman login (lihat CaptchaService).
  // Sengaja tidak pakai JwtAuthGuard — endpoint ini dipanggil SEBELUM login.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('captcha')
  getCaptcha() {
    return this.captchaService.generate();
  }

  // SECURITY: mitigasi brute-force — maksimal 5 percobaan login per menit per IP,
  // jauh lebih ketat daripada limit umum (lihat THROTTLE_LOGIN_LIMIT di .env / ThrottlerModule).
  // Lapisan tambahan: captcha (di atas) + lockdown per akun (lihat AuthService.login()).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.login(
      dto.email,
      dto.password,
      dto.captchaToken,
      dto.captchaNonce,
      dto.website,
    );
    // SECURITY: token disimpan di cookie httpOnly (tidak bisa dibaca JavaScript),
    // bukan lagi dikembalikan di body JSON untuk disimpan frontend di localStorage
    // (rawan dicuri lewat XSS). Frontend hanya menerima data user untuk keperluan UI.
    res.cookie(ACCESS_TOKEN_COOKIE, session.accessToken, getAccessTokenCookieOptions(this.config));
    return { user: session.user };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.me(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  changePassword(@CurrentUser() user: CurrentUserPayload, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.userId, dto.oldPassword, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    return { message: 'Logout berhasil' };
  }
}