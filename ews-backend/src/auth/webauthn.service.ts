import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Passkey/WebAuthn — login berbasis kunci kriptografi yang terikat ke perangkat
 * fisik pengguna (biometrik/PIN perangkat membuka kunci privat yang TIDAK PERNAH
 * meninggalkan perangkat itu). Ini beda kelas dari captcha: captcha (PoW) cuma
 * membuktikan biaya komputasi dikeluarkan, sedangkan passkey membuktikan
 * "perangkat terdaftar milik akun ini yang dipegang sekarang" — jauh lebih dekat
 * ke "membuktikan Anda adalah pemilik akun yang sah" dibanding captcha apa pun.
 *
 * Saat ini dibatasi untuk role ADMIN (lihat WebauthnController) sebagai lapisan
 * tambahan untuk akun paling berisiko tinggi, di atas password+captcha+lockdown
 * yang sudah ada — bukan pengganti login password biasa untuk role lain.
 *
 * Tantangan ceremony WebAuthn (challenge) ditandatangani (HMAC-SHA256) dan
 * dikirim balik ke client sebagai token, sama seperti CaptchaService — supaya
 * server tidak perlu menyimpan sesi challenge di memori/Redis.
 */
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class WebauthnService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private getSecret(): string {
    return (
      this.config.get<string>('CAPTCHA_SECRET') || this.config.get<string>('JWT_SECRET') || 'insecure-fallback'
    );
  }

  private get rpID(): string {
    const explicit = this.config.get<string>('WEBAUTHN_RP_ID');
    if (explicit) return explicit;
    // Default: turunkan dari CORS_ORIGIN (mis. https://ats.sleman.go.id -> ats.sleman.go.id).
    const origin = this.origin;
    try {
      return new URL(origin).hostname;
    } catch {
      return 'localhost';
    }
  }

  private get origin(): string {
    return (
      this.config.get<string>('WEBAUTHN_ORIGIN') ||
      this.config.get<string>('CORS_ORIGIN') ||
      'http://localhost:5173'
    );
  }

  private get rpName(): string {
    return this.config.get<string>('WEBAUTHN_RP_NAME') || 'Gandheng-ATS Kabupaten Sleman';
  }

  private signToken(payload: Record<string, string | number>): string {
    const json = JSON.stringify(payload);
    const signature = createHmac('sha256', this.getSecret()).update(json).digest('hex');
    return Buffer.from(`${json}::${signature}`).toString('base64url');
  }

  private verifyToken<T extends { expiresAt: number }>(token: string): T | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const sepIndex = decoded.lastIndexOf('::');
      if (sepIndex === -1) return null;
      const json = decoded.slice(0, sepIndex);
      const signature = decoded.slice(sepIndex + 2);
      const expected = createHmac('sha256', this.getSecret()).update(json).digest('hex');
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
      const payload = JSON.parse(json) as T;
      if (Date.now() > payload.expiresAt) return null;
      return payload;
    } catch {
      return null;
    }
  }

  private parseTransports(raw: string | null): AuthenticatorTransportFuture[] | undefined {
    if (!raw) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }

  // ---------------------------------------------------------------------
  // Registrasi (mendaftarkan passkey baru ke akun yang SUDAH login)
  // ---------------------------------------------------------------------

  async generateRegistrationChallenge(userId: number, email: string, name: string) {
    const existing = await this.prisma.webAuthnCredential.findMany({ where: { userId } });

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userName: email,
      userDisplayName: name,
      attestationType: 'none',
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId,
        transports: this.parseTransports(c.transports),
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    const token = this.signToken({
      challenge: options.challenge,
      userId,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });

    return { options, token };
  }

  async verifyRegistration(
    userId: number,
    token: string,
    response: RegistrationResponseJSON,
    deviceLabel?: string,
  ) {
    const payload = this.verifyToken<{ challenge: string; userId: number; expiresAt: number }>(token);
    if (!payload || payload.userId !== userId) {
      return { verified: false as const, message: 'Sesi registrasi passkey tidak valid atau sudah kedaluwarsa.' };
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: payload.challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { verified: false as const, message: 'Passkey tidak berhasil diverifikasi. Silakan coba lagi.' };
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await this.prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: credential.transports ? JSON.stringify(credential.transports) : null,
        deviceLabel: deviceLabel?.trim() || (credentialDeviceType === 'multiDevice' ? 'Passkey (multi-perangkat)' : 'Passkey'),
      },
    });

    // credentialBackedUp sengaja tidak disimpan — hanya dipakai kalau nanti ingin
    // membedakan kebijakan untuk passkey yang di-sync ke cloud vs hardware key.
    void credentialBackedUp;

    return { verified: true as const };
  }

  // ---------------------------------------------------------------------
  // Autentikasi (login memakai passkey yang sudah terdaftar)
  // ---------------------------------------------------------------------

  async generateAuthenticationChallenge(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { webauthnCredentials: true },
    });

    // Tetap generate options walau user/kredensial tidak ada, supaya respons API
    // tidak membocorkan keberadaan akun lewat perbedaan bentuk response — hanya
    // beda di allowCredentials (kosong = passkey manapun tidak akan cocok saat verify).
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      userVerification: 'preferred',
      allowCredentials: user?.webauthnCredentials.map((c) => ({
        id: c.credentialId,
        transports: this.parseTransports(c.transports),
      })),
    });

    const token = this.signToken({
      challenge: options.challenge,
      // userId 0 sebagai penanda "tidak ditemukan" — tetap konsisten bentuk
      // tokennya supaya tidak ada perbedaan yang bisa diamati dari luar.
      userId: user?.id ?? 0,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });

    return { options, token };
  }

  async verifyAuthentication(token: string, response: AuthenticationResponseJSON) {
    const payload = this.verifyToken<{ challenge: string; userId: number; expiresAt: number }>(token);
    if (!payload || !payload.userId) {
      return { verified: false as const, message: 'Login dengan passkey gagal. Silakan coba lagi.' };
    }

    const stored = await this.prisma.webAuthnCredential.findUnique({
      where: { credentialId: response.id },
      include: { user: true },
    });

    // Kredensial harus ada DAN memang milik user yang sesuai dengan challenge
    // yang diterbitkan (mencegah credential ID dari akun lain dicoba-cocokkan
    // ke challenge akun ini).
    if (!stored || stored.userId !== payload.userId) {
      return { verified: false as const, message: 'Passkey tidak dikenali.' };
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: payload.challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      credential: {
        id: stored.credentialId,
        publicKey: new Uint8Array(stored.publicKey),
        counter: Number(stored.counter),
        transports: this.parseTransports(stored.transports),
      },
    });

    if (!verification.verified) {
      return { verified: false as const, message: 'Passkey tidak berhasil diverifikasi.' };
    }

    // SECURITY: signature counter TIDAK BOLEH turun/sama — kalau turun, ini indikasi
    // kuat kredensial telah di-clone (replay attack dari salinan authenticator).
    // simplewebauthn sudah mengecek ini secara internal juga, tapi kita catat ulang
    // nilai barunya di DB supaya perbandingan berikutnya tetap akurat.
    await this.prisma.webAuthnCredential.update({
      where: { id: stored.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter), lastUsedAt: new Date() },
    });

    if (!stored.user.active) {
      return { verified: false as const, message: 'Akun tidak aktif.' };
    }

    return { verified: true as const, user: stored.user };
  }

  // ---------------------------------------------------------------------
  // Manajemen kredensial
  // ---------------------------------------------------------------------

  async listCredentials(userId: number) {
    const rows = await this.prisma.webAuthnCredential.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, deviceLabel: true, createdAt: true, lastUsedAt: true },
    });
    return rows;
  }

  async deleteCredential(userId: number, credentialRowId: number) {
    const result = await this.prisma.webAuthnCredential.deleteMany({
      where: { id: credentialRowId, userId },
    });
    return result.count > 0;
  }
}
