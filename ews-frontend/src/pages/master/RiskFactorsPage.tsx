import { AlertTriangle } from "lucide-react";
import MasterCrudPage from "../../components/master/MasterCrudPage";
import { riskFactorsApi } from "../../services/master.service";
import type { RiskFactor } from "../../types/api";

export default function RiskFactorsPage() {
  return (
    <MasterCrudPage<RiskFactor>
      title="Master Faktor Risiko"
      description="Kelola kategori & faktor risiko yang dipakai Kapanewon saat membuat rujukan."
      icon={AlertTriangle}
      queryKey="master-risk-factors"
      api={riskFactorsApi}
      searchPlaceholder="Cari faktor risiko..."
      itemLabel={(r) => r.nama}
      emptyValue={{ active: true }}
      columns={[
        { header: "Kode", render: (r) => <span className="font-mono text-xs text-slate-500">{r.kode}</span> },
        { header: "Nama", render: (r) => <span className="font-medium text-slate-800">{r.nama}</span> },
        { header: "Kategori", render: (r) => r.kategori },
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
        { name: "kode", label: "Kode", required: true, placeholder: "mis. FR-EKO-01" },
        { name: "nama", label: "Nama Faktor Risiko", required: true },
        {
          name: "kategori",
          label: "Kategori",
          type: "select",
          required: true,
          options: [
            { value: "Ekonomi", label: "Ekonomi" },
            { value: "Sosial", label: "Sosial" },
            { value: "Akademik", label: "Akademik" },
            { value: "Kesehatan", label: "Kesehatan" },
            { value: "Keluarga", label: "Keluarga" },
          ],
        },
        { name: "deskripsi", label: "Deskripsi", type: "textarea" },
        { name: "active", label: "Status", type: "checkbox", placeholder: "Faktor risiko aktif" },
      ]}
    />
  );
}
