import { TOKEN_KEY } from "../lib/api";
import type { LoginResponse } from "../types/api";

const USER_KEY = "ews_user";

export type StoredUser = LoginResponse["user"];

export const saveSession = (session: LoginResponse) => {
  localStorage.setItem(TOKEN_KEY, session.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
};

export const getUser = (): StoredUser | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
