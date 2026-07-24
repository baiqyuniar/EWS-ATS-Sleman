import { IsArray, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

// Fitur sesuai docs/CODEBOOK.md pada repo ewsDropOut (https://github.com/hdmeasure/ewsDropOut).
// Dipakai oleh "Simulasi Prediksi" (1 siswa) maupun bulk-upload (banyak siswa sekaligus).
export class SimulatePredictionDto {
  @IsInt()
  studentId: number;

  // Override opsional: jika tidak dikirim, service akan mengambil dari data Student/School
  // tersimpan (numerasi, kodePendidikanAyah/Ibu, kodePenghasilanAyah/Ibu, sulingjar sekolah).
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

  @IsOptional()
  @IsArray()
  riskFactorIds?: number[]; // faktor risiko tambahan (master data) yang ingin dilampirkan manual
}
