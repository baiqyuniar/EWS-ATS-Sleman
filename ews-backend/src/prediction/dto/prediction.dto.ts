import { Type } from "class-transformer";
import {
  IsArray,
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class SimulatePredictionDto {
  @IsString()
  nisn: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  num?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  kodePendidikanAyah?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  kodePendidikanIbu?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  kodePenghasilanAyah?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  kodePenghasilanIbu?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  sulingjarD18?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  sulingjarD1?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  sulingjarD2?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  sulingjarD6?: number;

  @IsOptional()
  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  riskFactorIds?: number[];
}