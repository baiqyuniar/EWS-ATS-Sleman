// export class BulkPredictionResultDto {
//   studentId!: number;

//   success!: boolean;

//   predictionId?: number;

//   probabilitas?: number;

//   riskCategory?: string;

//   modelDipakai?: string | null;

//   error?: string;
// }

export class BulkPredictionResultDto {
  nisn!: string;

  studentId?: number;

  success!: boolean;

  predictionId?: number;

  probabilitas?: number;

  riskCategory?: string;

  modelDipakai?: string | null;

  error?: string;
}
