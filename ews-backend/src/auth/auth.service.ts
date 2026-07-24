import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

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
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // SECURITY: selalu jalankan bcrypt.compare (terhadap dummy hash jika user tidak
    // ada/nonaktif) supaya waktu respons konsisten baik untuk "email tidak terdaftar"
    // maupun "password salah" — mencegah enumerasi akun lewat timing.
    const passwordValid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !user.active || !passwordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

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
