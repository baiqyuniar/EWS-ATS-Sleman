import MasterCrudPage from "../../components/master/MasterCrudPage";
import { pekerjaanOrtuApi } from "../../services/master.service";
import type { PekerjaanOrtu } from "../../types/api";

export default function PekerjaanOrtuPage() {
  return (
    <MasterCrudPage<PekerjaanOrtu>
      queryKey="master-pekerjaan-ortu"
      api={pekerjaanOrtuApi}
      searchPlaceholder="Cari pekerjaan..."
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
        { name: "nama", label: "Nama Pekerjaan", required: true },
        { name: "active", label: "Status", type: "checkbox", placeholder: "Nama Pekerjaan aktif dipakai" },
      ]}
    />
  );
}
