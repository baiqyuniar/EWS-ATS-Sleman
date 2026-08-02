import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

// Body dari navigator.credentials.create()/get() yang sudah di-serialize oleh
// @simplewebauthn/browser (startRegistration/startAuthentication). Strukturnya
// kompleks & didefinisikan oleh spec WebAuthn (bukan sesuatu yang kita desain
// sendiri) — divalidasi cukup sebagai objek di sini; @simplewebauthn/server yang
// memvalidasi isinya secara kriptografis saat verifyRegistrationResponse/
// verifyAuthenticationResponse (kalau bentuknya salah, akan gagal verify dengan
// error yang jelas, bukan diam-diam lolos).

export class WebauthnRegisterVerifyDto {
  @ApiProperty({ description: 'Token dari POST /auth/webauthn/register/options' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ description: 'Hasil dari @simplewebauthn/browser startRegistration()' })
  @IsObject()
  response: Record<string, unknown>;

  @ApiProperty({ required: false, description: 'Nama perangkat, mis. "Laptop Kerja"' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceLabel?: string;
}

export class WebauthnLoginOptionsDto {
  @ApiProperty({ example: 'admin@sleman.go.id' })
  @IsEmail()
  email: string;
}

export class WebauthnLoginVerifyDto {
  @ApiProperty({ description: 'Token dari POST /auth/webauthn/login/options' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ description: 'Hasil dari @simplewebauthn/browser startAuthentication()' })
  @IsObject()
  response: Record<string, unknown>;
}
