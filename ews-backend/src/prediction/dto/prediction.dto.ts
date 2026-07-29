import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class SimulatePredictionDto {
  @IsInt()
  studentId: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  num?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(8)
  kodePendidikanAyah?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(8)
  kodePendidikanIbu?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  kodePenghasilanAyah?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  kodePenghasilanIbu?: number;

  // ===========================
  // SULINGJAR
  // ===========================

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  sulingjarD18?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  sulingjarD1?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  sulingjarD2?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  sulingjarD6?: number;

  @IsOptional()
  @IsArray()
  riskFactorIds?: number[];
}