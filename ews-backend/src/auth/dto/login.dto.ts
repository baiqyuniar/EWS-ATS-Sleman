import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// SECURITY: kebijakan kompleksitas password minimal — mencegah password lemah
// seperti "123456"/"password" yang mudah ditebak/brute-force. Berlaku untuk
// password BARU (register/reset/ganti password), bukan untuk field `password`
// di LoginDto (supaya akun lama dengan password pendek tetap bisa login sampai
// mereka mengganti password sesuai kebijakan baru ini).
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const PASSWORD_POLICY_MESSAGE =
  'Password minimal 10 karakter dan harus mengandung huruf besar, huruf kecil, dan angka';

export class LoginDto {
  @ApiProperty({ example: 'admin@sleman.go.id' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsNotEmpty()
  password: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  oldPassword: string;

  @IsNotEmpty()
  @MinLength(10, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  newPassword: string;
}
