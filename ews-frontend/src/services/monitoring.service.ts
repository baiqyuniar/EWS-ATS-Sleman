import { api } from "../lib/api";
import type {
  Monitoring,
  CreateMonitoringPayload,
  Case,
  CloseCasePayload,
  ReopenCasePayload,
} from "../types/api";

export const createMonitoring = async (
  caseId: number,
  payload: CreateMonitoringPayload,
): Promise<Monitoring> => {
  const { data } = await api.post<Monitoring>(`/cases/${caseId}/monitoring`, payload);
  return data;
};

export const getMonitorings = async (caseId: number): Promise<Monitoring[]> => {
  const { data } = await api.get<Monitoring[]>(`/cases/${caseId}/monitoring`);
  return data;
};

// S09 -> S10
export const closeCase = async (caseId: number, payload: CloseCasePayload): Promise<Case> => {
  const { data } = await api.post<Case>(`/cases/${caseId}/close`, payload);
  return data;
};

export const reopenCase = async (caseId: number, payload: ReopenCasePayload): Promise<Case> => {
  const { data } = await api.post<Case>(`/cases/${caseId}/reopen`, payload);
  return data;
};
