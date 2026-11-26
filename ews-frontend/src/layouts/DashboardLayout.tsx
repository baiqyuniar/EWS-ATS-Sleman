import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../hooks/useAuth";
import ChangePasswordModal from "../components/auth/ChangePasswordModal";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { user } = useAuth();
  const [mustChange, setMustChange] = useState<boolean>(!!user?.mustChangePassword);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6">{children}</main>
      </div>

      {/* Modal Paksa Ganti Password Default */}
      {mustChange && (
        <ChangePasswordModal
          open={true}
          forced={true}
          onClose={() => {}}
          onSuccess={() => setMustChange(false)}
        />
      )}
    </div>
  );
}
