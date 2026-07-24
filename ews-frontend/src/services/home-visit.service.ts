import { api } from "../lib/api";
import type { HomeVisit, CreateHomeVisitPayload } from "../types/api";

export const createHomeVisit = async (
  caseId: number,
  payload: CreateHomeVisitPayload,
): Promise<HomeVisit> => {
  const { data } = await api.post<HomeVisit>(`/cases/${caseId}/home-visits`, payload);
  return data;
};

export const getHomeVisits = async (caseId: number): Promise<HomeVisit[]> => {
  const { data } = await api.get<HomeVisit[]>(`/cases/${caseId}/home-visits`);
  return data;
};
