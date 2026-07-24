export class BulkPredictionResultDto {
  studentId!: number;

  success!: boolean;

  predictionId?: number;

  probabilitas?: number;

  riskCategory?: string;

  modelDipakai?: string | null;

  error?: string;
}
