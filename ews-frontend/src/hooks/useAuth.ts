// import { getToken, getUser } from "../store/auth.store";

// export const useAuth = () => {
//   const user = getUser();
//   const token = getToken();

//   return {
//     user,
//     isAuthenticated: !!user && !!token,
//     role: user?.role ?? null,
//   };
// };

import { getUser } from "../store/auth.store";

export const useAuth = () => {
  const user = getUser();

  // Catatan: ini hanya hint di sisi client untuk UX (menghindari flash halaman
  // terproteksi sebelum redirect). Cookie JWT httpOnly tidak bisa dibaca di
  // sini, jadi validitas sesi yang sebenarnya tetap ditegakkan oleh backend
  // (JwtAuthGuard) di setiap request; kalau cookie tidak valid/kedaluwarsa,
  // request API akan dapat 401 dan interceptor di lib/api.ts akan membersihkan
  // data ini lalu redirect ke /login.
  return {
    user,
    isAuthenticated: !!user,
    role: user?.role ?? null,
  };
};