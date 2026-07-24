import { api } from "../lib/api";
import type { Referral, CreateReferralPayload, CreateDoStudentReferralPayload } from "../types/api";

export const createReferral = async (
  caseId: number,
  payload: CreateReferralPayload,
): Promise<Referral[]> => {
  const { data } = await api.post<Referral[]>(`/cases/${caseId}/referral`, payload);
  return data;
};

// Jalur ringan: rujukan langsung siswa Putus Sekolah (DO) oleh Admin, tanpa Case.
export const createDoStudentReferral = async (
  studentId: number,
  payload: CreateDoStudentReferralPayload,
): Promise<Referral> => {
  const { data } = await api.post<Referral>(`/students/${studentId}/referral-do`, payload);
  return data;
};

// OPD memverifikasi/menerima rujukan sebelum memulai intervensi.
export const verifyReferral = async (id: number): Promise<Referral> => {
  const { data } = await api.post<Referral>(`/referrals/${id}/verify`, {});
  return data;
};

export const getReferrals = async (): Promise<Referral[]> => {
  const { data } = await api.get<Referral[]>("/referrals");
  return data;
};

export const getReferral = async (id: number): Promise<Referral> => {
  const { data } = await api.get<Referral>(`/referrals/${id}`);
  return data;
};
