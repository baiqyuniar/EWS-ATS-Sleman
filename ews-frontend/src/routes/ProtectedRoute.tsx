import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type Props = {
  children: React.ReactNode;
  roles?: string[];
};

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuth();

  const role = user?.role;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jika role tidak sesuai
  if (roles && roles.length > 0 && (!role || !roles.includes(role))) {
    // Khusus role SEKOLAH arahkan ke dashboard sekolah
    if (role === "SEKOLAH") {
      return <Navigate to="/dashboard/school" replace />;
    }
    if (role === "KAPANEWON") {
      return <Navigate to="/dashboard/kapanewon" replace />;
    }
    if (role === "OPD") {
      return <Navigate to="/dashboard/dinas" replace />;
    }

    // Role lain ke dashboard utama
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
