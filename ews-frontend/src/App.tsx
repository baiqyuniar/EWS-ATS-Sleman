import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import DashboardSchoolPage from "./pages/dashboard-school/DashboardSchool";
import DashboardPageDinas from "./pages/dashboard-dinas/DashboardPage";
import DashboardPageKapanewon from "./pages/dashboard-kapanewon/DashboardPage";
import RiskMapPage from "./pages/risk-map/RiskMapPage";
import SchoolDashboard from "./pages/dashboard-school/DashboardSchool";
import ProtectedRoute from "./routes/ProtectedRoute";

import StudentListPage from "./pages/students/StudentListPage";
import StudentDoListPage from "./pages/students/StudentDoListPage";
import SimulasiPredictionPage from "./pages/predictions/SimulasiPredictionPage";
import UploadPredictionPage from "./pages/predictions/UploadPredictionPage";

import CaseListPage from "./pages/cases/CaseListPage";
import CaseCreatePelaporanPage from "./pages/cases/CaseCreatePelaporanPage";
import CaseCreatePengaduanPage from "./pages/cases/CaseCreatePengaduanPage";
import CaseDetailPage from "./pages/cases/CaseDetailPage";
import ReferralsInboxPage from "./pages/referrals/ReferralsInboxPage";
import ReferralDetailPage from "./pages/referrals/ReferralDetailPage";

import WilayahPage from "./pages/master/WilayahPage";
import SchoolsPage from "./pages/master/SchoolsPage";
import OpdPage from "./pages/master/OpdPage";
import RiskFactorsPage from "./pages/master/RiskFactorsPage";
import InterventionTypesPage from "./pages/master/InterventionTypesPage";
import RegulationsPage from "./pages/master/RegulationsPage";
import UsersPage from "./pages/master/UsersPage";
import AgamaPage from "./pages/master/AgamaPage";
import KebutuhanKhususPage from "./pages/master/KebutuhanKhususPage";
import JenisTinggalPage from "./pages/master/JenisTinggalPage";
import AlatTransportasiPage from "./pages/master/AlatTransportasiPage";
import PekerjaanOrtuPage from "./pages/master/PekerjaanOrtuPage";
import PendidikanOrtuPage from "./pages/master/PendidikanOrtuPage";
import PenghasilanOrtuPage from "./pages/master/PenghasilanOrtuPage";

import ReportsPage from "./pages/reports/ReportsPage";

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Dashboard & Peta Risiko — dibiarkan seperti semula */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["ADMIN", "DINAS_PENDIDIKAN"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/school"
        element={
          <ProtectedRoute roles={["SEKOLAH"]}>
            <DashboardSchoolPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/dinas"
        element={
          <ProtectedRoute roles={["OPD"]}>
            <DashboardPageDinas />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/kapanewon"
        element={
          <ProtectedRoute roles={["KAPANEWON"]}>
            <DashboardPageKapanewon />
          </ProtectedRoute>
        }
      />

      <Route
        path="/risk-map"
        element={
          <ProtectedRoute>
            <RiskMapPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard-sekolah"
        element={
          <ProtectedRoute roles={["SEKOLAH"]}>
            <SchoolDashboard />
          </ProtectedRoute>
        }
      />

      {/* Siswa & Prediksi */}
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <StudentListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/do"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <StudentDoListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions"
        element={
          <ProtectedRoute roles={["SEKOLAH"]}>
            <SimulasiPredictionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions/upload"
        element={
          <ProtectedRoute roles={["SEKOLAH"]}>
            <UploadPredictionPage />
          </ProtectedRoute>
        }
      />

      {/* Kasus (Alur Pencegahan & Penanganan) */}
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <CaseListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/new/pelaporan"
        element={
          <ProtectedRoute roles={["SEKOLAH"]}>
            <CaseCreatePelaporanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/new/pengaduan"
        element={
          <ProtectedRoute roles={["KAPANEWON"]}>
            <CaseCreatePengaduanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <CaseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals"
        element={
          <ProtectedRoute roles={["OPD"]}>
            <ReferralsInboxPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals/:id"
        element={
          <ProtectedRoute roles={["OPD", "DINAS_PENDIDIKAN"]}>
            <ReferralDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Master Data — khusus Admin */}
      <Route
        path="/master/users"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/schools"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <SchoolsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/opd"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <OpdPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/wilayah"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <WilayahPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/risk-factors"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <RiskFactorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/intervention-types"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <InterventionTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/regulations"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <RegulationsPage />
          </ProtectedRoute>
        }
      />
      {/* Mastering data siswa (dari Data Siswa Aktif / Dapodik) */}
      <Route
        path="/master/agama"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AgamaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/kebutuhan-khusus"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <KebutuhanKhususPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/jenis-tinggal"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <JenisTinggalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/alat-transportasi"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AlatTransportasiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/pekerjaan-ortu"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <PekerjaanOrtuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/pendidikan-ortu"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <PendidikanOrtuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/penghasilan-ortu"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <PenghasilanOrtuPage />
          </ProtectedRoute>
        }
      />

      {/* Laporan */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={["ADMIN", "DINAS_PENDIDIKAN"]}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
