import MasterCrudPage from "../../components/master/MasterCrudPage";
import { alatTransportasiApi } from "../../services/master.service";
import type { AlatTransportasi } from "../../types/api";

export default function AlatTransportasiPage() {
  return (
    <MasterCrudPage<AlatTransportasi>
      queryKey="master-alat-transportasi"
      api={alatTransportasiApi}
      searchPlaceholder="Cari alat transportasi..."
      itemLabel={(r) => r.nama}
      emptyValue={{ active: true }}
      columns={[
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
        { name: "nama", label: "Alat Transportasi", required: true },
        { name: "active", label: "Status", type: "checkbox", placeholder: "Alat Transportasi aktif dipakai" },
      ]}
    />
  );
}
