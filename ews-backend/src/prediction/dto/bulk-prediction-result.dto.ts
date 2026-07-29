export class BulkPredictionResultDto {
  nisn!:string;

  success!: boolean;

  predictionId?: number;

  probabilitas?: number;

  riskCategory?: string;

  modelDipakai?: string | null;

  error?: string;
}
