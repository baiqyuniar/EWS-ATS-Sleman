// import axios from "axios";

// export const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// // File/upload URLs returned by the backend (e.g. "/uploads/xxx.jpg") are relative
// // to the server root, not the "/api" prefix — this strips "/api" to get that root.
// export const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// export const TOKEN_KEY = "ews_token";

// export const api = axios.create({
//   baseURL: API_BASE_URL,
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem(TOKEN_KEY);
//   if (token) {
//     config.headers = config.headers ?? {};
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error?.response?.status === 401) {
//       localStorage.removeItem(TOKEN_KEY);
//       localStorage.removeItem("ews_user");
//       if (!window.location.pathname.startsWith("/login")) {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   },
// );

// /** Turns a backend-relative file URL ("/uploads/x.jpg") into an absolute URL. */
// export function fileUrl(path?: string | null): string {
//   if (!path) return "";
//   if (path.startsWith("http")) return path;
//   return `${SERVER_ORIGIN}${path}`;
// }

// /** Extracts a human-readable message from an axios/NestJS error. */
// export function apiErrorMessage(err: unknown, fallback = "Terjadi kesalahan"): string {
//   const anyErr = err as any;
//   const data = anyErr?.response?.data;
//   if (!data) return anyErr?.message || fallback;
//   if (Array.isArray(data.message)) return data.message.join(", ");
//   if (typeof data.message === "string") return data.message;
//   if (typeof data === "string") return data;
//   return fallback;
// }

import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// File/upload URLs returned by the backend (e.g. "/uploads/xxx.jpg") are relative
// to the server root, not the "/api" prefix — this strips "/api" to get that root.
export const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// SECURITY: JWT sekarang dikirim lewat cookie httpOnly yang di-set backend
// (lihat auth.controller.ts), bukan disimpan di localStorage dan ditempel
// manual ke header Authorization — pola lama itu rawan dicuri lewat XSS
// karena localStorage bisa dibaca oleh JavaScript apa pun yang berhasil
// nyusup ke halaman. `withCredentials: true` membuat axios ikut mengirim
// cookie ini di setiap request; browser & backend yang mengurus sisanya.
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("ews_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/** Turns a backend-relative file URL ("/uploads/x.jpg") into an absolute URL. */
export function fileUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SERVER_ORIGIN}${path}`;
}

/** Extracts a human-readable message from an axios/NestJS error. */
export function apiErrorMessage(err: unknown, fallback = "Terjadi kesalahan"): string {
  const anyErr = err as any;
  const data = anyErr?.response?.data;
  if (!data) return anyErr?.message || fallback;
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;
  if (typeof data === "string") return data;
  return fallback;
}