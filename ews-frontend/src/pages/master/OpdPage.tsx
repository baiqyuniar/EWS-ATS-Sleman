import MasterCrudPage from "../../components/master/MasterCrudPage";
import { opdApi } from "../../services/master.service";
import type { Opd } from "../../types/api";

export default function OpdPage() {
  return (
    <MasterCrudPage<Opd>
      queryKey="master-opd"
      api={opdApi}
      searchPlaceholder="Cari nama OPD..."
      itemLabel={(r) => r.nama}
      emptyValue={{ active: true }}
      columns={[
        { header: "Kode", render: (r) => <span className="font-mono text-xs text-slate-500">{r.kode}</span> },
        { header: "Nama OPD", render: (r) => <span className="font-medium text-slate-800 uppercase">{r.nama}</span> },
        { header: "Jenis Layanan", render: (r) => r.jenisLayanan || <span className="text-slate-400">-</span> },
        { header: "Kontak", render: (r) => r.kontak || <span className="text-slate-400">-</span> },
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
        { name: "kode", label: "Kode OPD", required: true },
        { name: "nama", label: "Nama OPD", required: true },
        { name: "jenisLayanan", label: "Jenis Layanan", placeholder: "mis. Ekonomi, Sosial, Kesehatan" },
        { name: "alamat", label: "Alamat", type: "textarea" },
        { name: "kontak", label: "Kontak" },
        { name: "active", label: "Status", type: "checkbox", placeholder: "OPD aktif" },
      ]}
    />
  );
}
