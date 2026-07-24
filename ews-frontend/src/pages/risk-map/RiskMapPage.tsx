import DashboardLayout from "../../layouts/DashboardLayout";

import SlemanGeoMap from "../../components/risk-map/SlemanGeoMap";

export default function RiskMapPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <SlemanGeoMap />
        </div>
      </div>
    </DashboardLayout>
  );
}
