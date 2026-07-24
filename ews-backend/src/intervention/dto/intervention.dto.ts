import { IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInterventionDto {
  @IsInt()
  interventionTypeId: number;

  @IsNotEmpty()
  @IsString()
  deskripsi: string;

  @IsOptional()
  @IsISO8601()
  tanggal?: string;
}

export class UpdateInterventionResultDto {
  // BR-16: Intervensi wajib memiliki hasil, tanggal, petugas (petugas = current user), lampiran opsional.
  @IsNotEmpty()
  @IsString()
  hasil: string;

  @IsOptional()
  lampiranUrls?: string[];
}

export class SubmitCompletionDto {
  @IsOptional()
  @IsString()
  catatan?: string;
}
