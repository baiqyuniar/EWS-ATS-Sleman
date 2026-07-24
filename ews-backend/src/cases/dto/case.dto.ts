import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { CaseSource, CaseStatus } from "@prisma/client";
import { PaginationDto } from "src/common/pagination.dto";

export class CreatePelaporanSekolahDto {
  @IsInt()
  studentId!: number;

  @IsOptional()
  predictionId?: number;

  @IsOptional()
  @IsString()
  catatan?: string;

  @IsOptional()
  @IsString()
  isiLaporan?: string;

  // BR-20: if the student already has an active case, the caller must explicitly
  // confirm they want to open a new (unrelated) case instead of adding to the existing one.
  @IsOptional()
  @IsBoolean()
  forceNewCase?: boolean;
}

export class CreatePengaduanMasyarakatDto {
  @IsInt()
  studentId!: number;

  @IsNotEmpty()
  @IsString()
  namaPelapor!: string;

  @IsOptional()
  @IsString()
  kontakPelapor?: string;

  @IsOptional()
  @IsString()
  caraPengaduan?: string; // datang langsung / telepon / aplikasi / online

  @IsOptional()
  @IsString()
  kondisiAwal?: string;

  @IsOptional()
  @IsString()
  isiLaporan?: string;

  @IsOptional()
  @IsBoolean()
  forceNewCase?: boolean;
}

export class VerifikasiNikDto {
  @IsBoolean()
  nikVerified!: boolean;

  @IsOptional()
  @IsString()
  catatan?: string;
}

export class VerifikasiPengaduanDto {
  @IsBoolean()
  validasiIdentitas!: boolean;

  @IsOptional()
  @IsString()
  koordinasiSekolah?: string;

  @IsOptional()
  @IsString()
  catatan?: string;
}

export class FindCasesQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @IsOptional()
  @IsEnum(CaseSource)
  source?: CaseSource;
}
