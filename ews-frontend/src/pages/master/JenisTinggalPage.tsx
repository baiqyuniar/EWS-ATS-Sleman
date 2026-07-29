import MasterCrudPage from "../../components/master/MasterCrudPage";
import { jenisTinggalApi } from "../../services/master.service";
import type { JenisTinggal } from "../../types/api";

export default function JenisTinggalPage() {
  return (
    <MasterCrudPage<JenisTinggal>
      queryKey="master-jenis-tinggal"
      api={jenisTinggalApi}
      searchPlaceholder="Cari jenis tinggal..."
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
        { name: "nama", label: "Jenis Tinggal", required: true },
        { name: "active", label: "Status", type: "checkbox", placeholder: "Jenis Tinggal aktif dipakai" },
      ]}
    />
  );
}
