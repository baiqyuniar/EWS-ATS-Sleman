import { MapPin } from "lucide-react";
import MasterCrudPage from "../../components/master/MasterCrudPage";
import { wilayahApi } from "../../services/master.service";
import type { Wilayah } from "../../types/api";

export default function WilayahPage() {
  return (
    <MasterCrudPage<Wilayah>
      title="Master Wilayah"
      description="Kelola data kapanewon & kalurahan Kabupaten Sleman."
      icon={MapPin}
      queryKey="master-wilayah"
      api={wilayahApi}
      searchPlaceholder="Cari kapanewon..."
      itemLabel={(r) => r.kapanewon}
      columns={[
        { header: "Kapanewon", render: (r) => <span className="font-medium text-slate-800">{r.kapanewon}</span> },
        { header: "Kalurahan", render: (r) => r.kalurahan || <span className="text-slate-400">-</span> },
      ]}
      fields={[
        { name: "kapanewon", label: "Kapanewon", required: true, placeholder: "mis. Depok" },
        { name: "kalurahan", label: "Kalurahan", placeholder: "mis. Caturtunggal (opsional)" },
      ]}
    />
  );
}
