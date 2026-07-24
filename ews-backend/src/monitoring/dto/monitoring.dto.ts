import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMonitoringDto {
  @IsNotEmpty()
  @IsString()
  catatan: string;
}

export class CloseCaseDto {
  @IsOptional()
  @IsString()
  catatan?: string;
}

export class ReopenCaseDto {
  @IsNotEmpty()
  @IsString()
  alasan: string;
}
