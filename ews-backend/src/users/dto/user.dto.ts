import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, Matches, MinLength } from 'class-validator';

// SECURITY: samakan kebijakan password dengan ChangePasswordDto (lih. auth/dto/login.dto.ts).
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const PASSWORD_POLICY_MESSAGE =
  'Password minimal 10 karakter dan harus mengandung huruf besar, huruf kecil, dan angka';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(10, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsInt()
  schoolId?: number;

  @IsOptional()
  @IsInt()
  opdId?: number;

  @IsOptional()
  @IsInt()
  wilayahId?: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  schoolId?: number;

  @IsOptional()
  @IsInt()
  opdId?: number;

  @IsOptional()
  @IsInt()
  wilayahId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @MinLength(10, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(PASSWORD_POLICY_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  password?: string;
}
