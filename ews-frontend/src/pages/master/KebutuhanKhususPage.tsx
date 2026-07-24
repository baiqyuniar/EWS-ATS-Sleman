import { HeartHandshake } from "lucide-react";
import MasterCrudPage from "../../components/master/MasterCrudPage";
import { kebutuhanKhususApi } from "../../services/master.service";
import type { KebutuhanKhusus } from "../../types/api";

export default function KebutuhanKhususPage() {
  return (
    <MasterCrudPage<KebutuhanKhusus>
      title="Master Kebutuhan Khusus"
      description="Kelola daftar kategori kebutuhan khusus (Dapodik) untuk siswa maupun orang tua."
      icon={HeartHandshake}
      queryKey="master-kebutuhan-khusus"
      api={kebutuhanKhususApi}
      searchPlaceholder="Cari kebutuhan khusus..."
      itemLabel={(r) => r.nama}
      emptyValue={{ active: true }}
      columns={[
        { header: "Kode", render: (r) => <span className="font-mono text-xs text-slate-500">{r.kode ?? "-"}</span> },
        { header: "Nama", render: (r) => <span className="font-medium text-slate-800">{r.nama}</span> },
        {
          header: "Status",
          render: (r) => (
            <span className={`text-xs font-semibold ${r.active ? "text-green-600" : "text-slate-400"}`}>
              {r.active ? "Aktif" : "Nonaktif"}
            </span>
          ),
        },
      ]}
      fields={[
        { name: "kode", label: "Kode", placeholder: "mis. A, B, C ... (kosongkan bila tidak ada)" },
        { name: "nama", label: "Nama Kebutuhan Khusus", required: true, placeholder: "mis. A - Tuna Netra" },
        { name: "active", label: "Status", type: "checkbox", placeholder: "Kebutuhan khusus aktif dipakai" },
      ]}
    />
  );
}
