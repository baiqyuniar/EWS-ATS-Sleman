import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';
import { AuthService } from './auth.service';
import { WebauthnService } from './webauthn.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { CurrentUser, CurrentUserPayload } from './current-user.decorator';
import {
  WebauthnRegisterVerifyDto,
  WebauthnLoginOptionsDto,
  WebauthnLoginVerifyDto,
} from './dto/webauthn.dto';

/**
 * Passkey/WebAuthn — lapisan login tambahan untuk akun berisiko tinggi.
 *
 * PENDAFTARAN passkey (register/*) dibatasi ke role ADMIN dan WAJIB login
 * (JwtAuthGuard) dulu dengan password biasa — jadi mendaftarkan passkey baru
 * TIDAK BISA dipakai untuk mengambil alih akun tanpa tahu password sebelumnya.
 *
 * LOGIN pakai passkey (login/*) publik (dipanggil sebelum ada sesi), sama
 * seperti endpoint /auth/login biasa.
 */
@ApiTags('auth')
@Controller('auth/webauthn')
export class WebauthnController {
  constructor(
    private webauthnService: WebauthnService,
    private authService: AuthService,
  ) {}

  // --------------------------- Registrasi (ADMIN, harus sudah login) ---------------------------

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('register/options')
  async registerOptions(@CurrentUser() user: CurrentUserPayload) {
    const me = await this.authService.me(user.userId);
    if (!me) throw new NotFoundException('User tidak ditemukan');
    return this.webauthnService.generateRegistrationChallenge(me.id, me.email, me.name);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post('register/verify')
  registerVerify(@CurrentUser() user: CurrentUserPayload, @Body() dto: WebauthnRegisterVerifyDto) {
    return this.webauthnService.verifyRegistration(
      user.userId,
      dto.token,
      dto.response as unknown as RegistrationResponseJSON,
      dto.deviceLabel,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('credentials')
  listCredentials(@CurrentUser() user: CurrentUserPayload) {
    return this.webauthnService.listCredentials(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete('credentials/:id')
  async deleteCredential(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    const deleted = await this.webauthnService.deleteCredential(user.userId, id);
    return { deleted };
  }

  // --------------------------- Login (publik, sebelum ada sesi) ---------------------------

  // SECURITY: rate-limit ketat sama seperti /auth/login & /auth/captcha — endpoint
  // ini publik (dipanggil sebelum login) jadi tetap perlu dibatasi dari brute-force/DoS.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login/options')
  loginOptions(@Body() dto: WebauthnLoginOptionsDto) {
    return this.webauthnService.generateAuthenticationChallenge(dto.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login/verify')
  async loginVerify(@Body() dto: WebauthnLoginVerifyDto) {
    const result = await this.webauthnService.verifyAuthentication(
      dto.token,
      dto.response as unknown as AuthenticationResponseJSON,
    );
    if (!result.verified) {
      return { verified: false, message: result.message };
    }
    const session = await this.authService.issueSession(result.user);
    return { verified: true, ...session };
  }
}
