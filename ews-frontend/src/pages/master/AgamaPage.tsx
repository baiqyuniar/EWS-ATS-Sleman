import { BookHeart } from "lucide-react";
import MasterCrudPage from "../../components/master/MasterCrudPage";
import { agamaApi } from "../../services/master.service";
import type { Agama } from "../../types/api";

export default function AgamaPage() {
  return (
    <MasterCrudPage<Agama>
      title="Master Agama"
      description="Kelola daftar agama yang dipakai pada data siswa."
      icon={BookHeart}
      queryKey="master-agama"
      api={agamaApi}
      searchPlaceholder="Cari agama..."
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
        { name: "nama", label: "Nama Agama", required: true },
        { name: "active", label: "Status", type: "checkbox", placeholder: "Nama Agama aktif dipakai" },
      ]}
    />
  );
}
