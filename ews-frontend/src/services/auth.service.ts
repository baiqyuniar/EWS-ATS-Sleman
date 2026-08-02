import { api } from "../lib/api";
import type { LoginPayload, LoginResponse, AppUser, CaptchaChallenge } from "../types/api";

export const getCaptcha = async (): Promise<CaptchaChallenge> => {
  const { data } = await api.get<CaptchaChallenge>("/auth/captcha");
  return data;
};

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
};

export const me = async (): Promise<AppUser> => {
  const { data } = await api.get<AppUser>("/auth/me");
  return data;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const { data } = await api.post("/auth/change-password", { oldPassword, newPassword });
  return data;
};

export const logoutRemote = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};
