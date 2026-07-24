import { getToken, getUser } from "../store/auth.store";

export const useAuth = () => {
  const user = getUser();
  const token = getToken();

  return {
    user,
    isAuthenticated: !!user && !!token,
    role: user?.role ?? null,
  };
};
