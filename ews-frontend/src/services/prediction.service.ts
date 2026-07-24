import { api } from "../lib/api";
import type {
  Paginated,
  Prediction,
  SimulatePredictionPayload,
  BulkPredictionRow,
  BulkPredictionResponse,
} from "../types/api";

export interface PredictionQuery {
  page?: number;
  limit?: number;
  riskCategory?: string;
}

export const simulatePrediction = async (
  payload: SimulatePredictionPayload,
): Promise<Prediction> => {
  const { data } = await api.post<Prediction>("/predictions/simulate", payload);
  return data;
};

export const bulkUploadPredictions = async (
  datasetBatch: string,
  rows: BulkPredictionRow[],
): Promise<BulkPredictionResponse> => {
  const { data } = await api.post<BulkPredictionResponse>("/predictions/bulk-upload", {
    datasetBatch,
    rows,
  });
  return data;
};

export const getPredictions = async (
  query: PredictionQuery = {},
): Promise<Paginated<Prediction>> => {
  const { data } = await api.get<Paginated<Prediction>>("/predictions", { params: query });
  return data;
};

/** Siswa risiko sedang/tinggi yang belum punya Case — "1. Prediksi Risiko" -> "2. Klasifikasi Risiko" pada flowchart. */
export const getActionablePredictions = async (): Promise<Prediction[]> => {
  const { data } = await api.get<Prediction[]>("/predictions/actionable");
  return data;
};

export const getPredictionsByStudent = async (studentId: number): Promise<Prediction[]> => {
  const { data } = await api.get<Prediction[]>(`/predictions/student/${studentId}`);
  return data;
};
