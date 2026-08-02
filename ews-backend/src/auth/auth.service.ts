import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CaptchaService } from './captcha.service';

// Hash bcrypt "kosong" (bukan hash dari password beneran manapun) — dipakai supaya
// bcrypt.compare tetap dijalankan (dengan cost yang sama) walau user tidak ditemukan,
// agar waktu respons login tidak membocorkan apakah suatu email terdaftar atau tidak
// (timing side-channel / user enumeration).
const DUMMY_HASH = '$2b$10$C6UzMDM.H6dfI/f/IKcEeO6RUiTMi9tRb3S9M.hTVGw4qeeYq5ejq';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private captcha: CaptchaService,
  ) {}

  private get maxAttempts(): number {
    return Number(this.config.get<string>('LOGIN_LOCKOUT_MAX_ATTEMPTS')) || 5;
  }

  private get lockoutMinutes(): number {
    return Number(this.config.get<string>('LOGIN_LOCKOUT_MINUTES')) || 15;
  }

  async login(
    email: string,
    password: string,
    captchaToken: string,
    captchaNonce: string,
    honeypot?: string,
  ) {
    // SECURITY (honeypot): field tersembunyi yang harusnya SELALU kosong untuk
    // manusia. Bot yang mengisi semua field form secara otomatis (tanpa render
    // CSS, jadi tidak tahu field ini disembunyikan) akan mengisinya. Dicek PALING
    // AWAL — lebih murah dari captcha (tidak perlu hash) — dan ditolak dengan
    // pesan generik yang SAMA seperti password salah, supaya bot tidak bisa
    // membedakan "kena honeypot" vs "password salah" lalu beradaptasi.
    if (honeypot) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // SECURITY: captcha (Proof-of-Work) diverifikasi PALING AWAL, sebelum menyentuh
    // database sama sekali — mencegah bot/script mengirim ribuan percobaan login
    // otomatis tanpa mengeluarkan biaya komputasi (lihat CaptchaService).
    if (!this.captcha.verify(captchaToken, captchaNonce)) {
      throw new BadRequestException('Captcha salah atau sudah kedaluwarsa. Silakan coba lagi.');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    // SECURITY (lockdown policy): kalau akun sedang terkunci karena terlalu banyak
    // password salah beruntun, tolak SEBELUM mengecek password sama sekali —
    // supaya percobaan lanjutan (termasuk password yang benar) tidak diproses
    // selama masa jeda, dan penyerang tidak bisa terus menebak selama dikunci.
    if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60_000);
      throw new UnauthorizedException(
        `Akun Anda terkunci sementara karena terlalu banyak percobaan login yang gagal. ` +
          `Coba lagi dalam ${remainingMinutes} menit.`,
      );
    }

    // SECURITY: selalu jalankan bcrypt.compare (terhadap dummy hash jika user tidak
    // ada/nonaktif) supaya waktu respons konsisten baik untuk "email tidak terdaftar"
    // maupun "password salah" — mencegah enumerasi akun lewat timing.
    const passwordValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !user.active || !passwordValid) {
      // Lockdown policy: hitung percobaan gagal per akun (hanya kalau user memang
      // ada — supaya email acak yang tidak terdaftar tidak memicu write ke DB).
      if (user) {
        const attempts = user.failedLoginAttempts + 1;
        const shouldLock = attempts >= this.maxAttempts;
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: shouldLock ? 0 : attempts,
            lockedUntil: shouldLock ? new Date(Date.now() + this.lockoutMinutes * 60_000) : null,
          },
        });
        if (shouldLock) {
          throw new UnauthorizedException(
            `Terlalu banyak percobaan login gagal. Akun Anda dikunci selama ${this.lockoutMinutes} menit ` +
              `sebelum bisa mencoba login lagi.`,
          );
        }
      }
      throw new UnauthorizedException('Email atau password salah');
    }

    // Login berhasil — reset penghitung & kunci akun (kalau ada dari percobaan sebelumnya).
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    return this.issueSession(user);
  }

  // Dipakai bersama oleh login password (di atas) dan login passkey
  // (lihat WebauthnController) supaya bentuk sesi (JWT payload + response) selalu
  // konsisten dari kedua jalur login.
  async issueSession(user: {
    id: number;
    name: string;
    email: string;
    role: string;
    schoolId: number | null;
    opdId: number | null;
    wilayahId: number | null;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      opdId: user.opdId,
      wilayahId: user.wilayahId,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        opdId: user.opdId,
        wilayahId: user.wilayahId,
      },
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Password lama salah');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password berhasil diubah' };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        schoolId: true,
        opdId: true,
        wilayahId: true,
        school: { select: { id: true, nama: true } },
        opd: { select: { id: true, nama: true } },
        wilayah: { select: { id: true, kapanewon: true } },
      },
    });
    return user;
  }
}
