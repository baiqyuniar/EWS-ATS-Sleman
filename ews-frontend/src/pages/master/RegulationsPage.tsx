import MasterCrudPage from "../../components/master/MasterCrudPage";
import { regulationsApi } from "../../services/master.service";
import type { Regulation } from "../../types/api";

export default function RegulationsPage() {
  return (
    <MasterCrudPage<Regulation>
      queryKey="master-regulations"
      api={regulationsApi}
      searchPlaceholder="Cari regulasi..."
      itemLabel={(r) => r.judul}
      columns={[
        { header: "Nomor", render: (r) => <span className="font-mono text-xs text-slate-500">{r.nomor}</span> },
        { header: "Judul", render: (r) => <span className="font-medium text-slate-800">{r.judul}</span> },
        { header: "Deskripsi", render: (r) => r.deskripsi || <span className="text-slate-400">-</span> },
      ]}
      fields={[
        { name: "nomor", label: "Nomor Regulasi", required: true, placeholder: "mis. Perbup 12/2024" },
        { name: "judul", label: "Judul", required: true },
        { name: "deskripsi", label: "Deskripsi", type: "textarea" },
        { name: "fileUrl", label: "URL Dokumen", placeholder: "https://..." },
      ]}
    />
  );
}
