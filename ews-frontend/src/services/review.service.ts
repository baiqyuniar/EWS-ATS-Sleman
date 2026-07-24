import { api } from "../lib/api";
import type { Review, CreateReviewPayload } from "../types/api";

// S08 -> APPROVE: S09 | PERLU_PERBAIKAN: S07
export const createReview = async (
  referralId: number,
  payload: CreateReviewPayload,
): Promise<Review> => {
  const { data } = await api.post<Review>(`/referrals/${referralId}/review`, payload);
  return data;
};

export const getReviews = async (referralId: number): Promise<Review[]> => {
  const { data } = await api.get<Review[]>(`/referrals/${referralId}/review`);
  return data;
};
