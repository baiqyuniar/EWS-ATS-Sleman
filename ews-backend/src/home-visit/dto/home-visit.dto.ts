import { IsArray, IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HomeVisitResult } from '@prisma/client';

export class CreateHomeVisitDto {
  @IsISO8601()
  tanggal: string;

  @IsEnum(HomeVisitResult)
  hasil: HomeVisitResult;

  @IsOptional()
  @IsString()
  catatan?: string;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  // BR-15: foto wajib. Expecting file URLs already uploaded (e.g. via a separate
  // /uploads endpoint or object storage) — keeps this DTO storage-agnostic.
  @IsArray()
  @IsNotEmpty({ each: true })
  fotoUrls: string[];
}
