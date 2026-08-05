// import { TOKEN_KEY } from "../lib/api";
// import type { LoginResponse } from "../types/api";

// const USER_KEY = "ews_user";

// export type StoredUser = LoginResponse["user"];

// export const saveSession = (session: LoginResponse) => {
//   localStorage.setItem(TOKEN_KEY, session.accessToken);
//   localStorage.setItem(USER_KEY, JSON.stringify(session.user));
// };

// export const getUser = (): StoredUser | null => {
//   const user = localStorage.getItem(USER_KEY);
//   return user ? JSON.parse(user) : null;
// };

// export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

// export const logout = () => {
//   localStorage.removeItem(TOKEN_KEY);
//   localStorage.removeItem(USER_KEY);
// };

import type { LoginResponse } from "../types/api";

const USER_KEY = "ews_user";

export type StoredUser = LoginResponse["user"];

// SECURITY: JWT tidak lagi disimpan di sini. Token sekarang dikelola backend
// lewat cookie httpOnly (lihat auth.controller.ts di backend) yang tidak bisa
// dibaca JavaScript sama sekali — jadi walau ada celah XSS di frontend, token
// tidak bisa dicuri lewat script. Yang disimpan di sini hanya data user untuk
// keperluan tampilan (nama, role, dll), BUKAN kredensial. Enforcement akses
// yang sebenarnya tetap dilakukan server-side lewat JwtAuthGuard; kalau cookie
// tidak valid/kedaluwarsa, request API akan dapat 401 dan interceptor di
// lib/api.ts akan otomatis membersihkan data ini lalu redirect ke /login.
export const saveSession = (session: LoginResponse) => {
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
};

export const getUser = (): StoredUser | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem(USER_KEY);
};