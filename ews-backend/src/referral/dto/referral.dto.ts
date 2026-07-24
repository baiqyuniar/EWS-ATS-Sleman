import { RiskCategory } from '@prisma/client';
import { ArrayMinSize, ArrayUnique, IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

// Rujukan oleh Kapanewon (BR-10) — mendukung multi-OPD: satu Case bisa dirujuk ke
// beberapa OPD sekaligus (mis. Dinas Sosial + Dinas Kesehatan) untuk intervensi bersama.
export class CreateReferralDto {
  @IsOptional()
  @IsInt()
  riskFactorId?: number;

  @IsEnum(RiskCategory)
  tingkatRisiko: RiskCategory;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  opdIds: number[];

  @IsOptional()
  @IsString()
  catatan?: string;
}

// Jalur ringan: rujukan langsung siswa Putus Sekolah (DO) oleh Admin, tanpa Case.
export class CreateDoStudentReferralDto {
  @IsOptional()
  @IsInt()
  riskFactorId?: number;

  @IsEnum(RiskCategory)
  tingkatRisiko: RiskCategory;

  @IsInt()
  opdId: number;

  @IsOptional()
  @IsString()
  catatan?: string;
}
