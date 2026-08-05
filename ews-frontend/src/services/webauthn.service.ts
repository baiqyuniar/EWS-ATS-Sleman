// import { startRegistration, startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
// import { api } from "../lib/api";
// import type { LoginResponse } from "../types/api";

// export { browserSupportsWebAuthn };

// export interface PasskeyCredentialSummary {
//   id: number;
//   deviceLabel: string | null;
//   createdAt: string;
//   lastUsedAt: string | null;
// }

// // ------------------------- Registrasi (ADMIN, harus sudah login) -------------------------

// /**
//  * Mendaftarkan passkey baru untuk akun ADMIN yang sedang login. Memicu prompt
//  * biometrik/PIN bawaan browser (navigator.credentials.create()) lewat
//  * @simplewebauthn/browser — TIDAK ADA private key yang dikirim ke server,
//  * hanya public key hasil dari ceremony ini.
//  */
// export const registerPasskey = async (deviceLabel?: string): Promise<void> => {
//   const { data: options } = await api.get("/auth/webauthn/register/options");
//   const response = await startRegistration({ optionsJSON: options.options });
//   await api.post("/auth/webauthn/register/verify", {
//     token: options.token,
//     response,
//     deviceLabel,
//   });
// };

// export const listPasskeys = async (): Promise<PasskeyCredentialSummary[]> => {
//   const { data } = await api.get("/auth/webauthn/credentials");
//   return data;
// };

// export const deletePasskey = async (id: number): Promise<void> => {
//   await api.delete(`/auth/webauthn/credentials/${id}`);
// };

// // ------------------------- Login (publik, sebelum ada sesi) -------------------------

// /**
//  * Login memakai passkey yang sudah terdaftar untuk email tersebut. Memicu
//  * prompt biometrik/PIN (navigator.credentials.get()). Melempar Error dengan
//  * pesan yang bisa ditampilkan langsung ke pengguna kalau gagal/dibatalkan.
//  */
// export const loginWithPasskey = async (email: string): Promise<LoginResponse> => {
//   const { data: options } = await api.post("/auth/webauthn/login/options", { email });
//   const response = await startAuthentication({ optionsJSON: options.options });
//   const { data: result } = await api.post("/auth/webauthn/login/verify", {
//     token: options.token,
//     response,
//   });
//   if (!result.verified) {
//     throw new Error(result.message || "Login dengan passkey gagal.");
//   }
//   return { accessToken: result.accessToken, user: result.user };
// };

import { startRegistration, startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { api } from "../lib/api";
import type { LoginResponse } from "../types/api";

export { browserSupportsWebAuthn };

export interface PasskeyCredentialSummary {
  id: number;
  deviceLabel: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

// ------------------------- Registrasi (ADMIN, harus sudah login) -------------------------

/**
 * Mendaftarkan passkey baru untuk akun ADMIN yang sedang login. Memicu prompt
 * biometrik/PIN bawaan browser (navigator.credentials.create()) lewat
 * @simplewebauthn/browser — TIDAK ADA private key yang dikirim ke server,
 * hanya public key hasil dari ceremony ini.
 */
export const registerPasskey = async (deviceLabel?: string): Promise<void> => {
  const { data: options } = await api.get("/auth/webauthn/register/options");
  const response = await startRegistration({ optionsJSON: options.options });
  await api.post("/auth/webauthn/register/verify", {
    token: options.token,
    response,
    deviceLabel,
  });
};

export const listPasskeys = async (): Promise<PasskeyCredentialSummary[]> => {
  const { data } = await api.get("/auth/webauthn/credentials");
  return data;
};

export const deletePasskey = async (id: number): Promise<void> => {
  await api.delete(`/auth/webauthn/credentials/${id}`);
};

// ------------------------- Login (publik, sebelum ada sesi) -------------------------

/**
 * Login memakai passkey yang sudah terdaftar untuk email tersebut. Memicu
 * prompt biometrik/PIN (navigator.credentials.get()). Melempar Error dengan
 * pesan yang bisa ditampilkan langsung ke pengguna kalau gagal/dibatalkan.
 */
export const loginWithPasskey = async (email: string): Promise<LoginResponse> => {
  const { data: options } = await api.post("/auth/webauthn/login/options", { email });
  const response = await startAuthentication({ optionsJSON: options.options });
  const { data: result } = await api.post("/auth/webauthn/login/verify", {
    token: options.token,
    response,
  });
  if (!result.verified) {
    throw new Error(result.message || "Login dengan passkey gagal.");
  }
  return { user: result.user };
};