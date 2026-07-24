import { api } from "../lib/api";
import type {
  Intervention,
  CreateInterventionPayload,
  UpdateInterventionResultPayload,
  SubmitCompletionPayload,
  Referral,
} from "../types/api";

export const createIntervention = async (
  referralId: number,
  payload: CreateInterventionPayload,
): Promise<Intervention> => {
  const { data } = await api.post<Intervention>(
    `/referrals/${referralId}/interventions`,
    payload,
  );
  return data;
};

export const updateInterventionResult = async (
  id: number,
  payload: UpdateInterventionResultPayload,
): Promise<Intervention> => {
  const { data } = await api.put<Intervention>(`/interventions/${id}/result`, payload);
  return data;
};

// S07 -> S08
export const submitCompletion = async (
  referralId: number,
  payload: SubmitCompletionPayload,
): Promise<Referral> => {
  const { data } = await api.post<Referral>(
    `/referrals/${referralId}/submit-completion`,
    payload,
  );
  return data;
};

export const getInterventions = async (referralId: number): Promise<Intervention[]> => {
  const { data } = await api.get<Intervention[]>(`/referrals/${referralId}/interventions`);
  return data;
};
