import { GraduationCap } from "lucide-react";
import MasterCrudPage from "../../components/master/MasterCrudPage";
import { pendidikanOrtuApi } from "../../services/master.service";
import type { PendidikanOrtu } from "../../types/api";

export default function PendidikanOrtuPage() {
  return (
    <MasterCrudPage<PendidikanOrtu>
      title="Master Pendidikan Orang Tua"
      description="Kelola jenjang pendidikan ayah/ibu siswa. Kode ordinal (0-8) dipakai fitur prediksi ML — urutkan dari terendah ke tertinggi."
      icon={GraduationCap}
      queryKey="master-pendidikan-ortu"
      api={pendidikanOrtuApi}
      searchPlaceholder="Cari jenjang pendidikan..."
      itemLabel={(r) => r.nama}
      emptyValue={{ active: true, kodeOrdinal: 0 }}
      columns={[
        { header: "Nama", render: (r) => <span className="font-medium text-slate-800">{r.nama}</span> },
        {
          header: "Kode Ordinal",
          render: (r) => <span className="font-mono text-xs text-slate-500">{r.kodeOrdinal}</span>,
        },
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
        { name: "nama", label: "Jenjang Pendidikan", required: true, placeholder: "mis. SMA / sederajat" },
        {
          name: "kodeOrdinal",
          label: "Kode Ordinal (0-8)",
          type: "number",
          required: true,
          helpText: "Dipakai fitur prediksi ML — 0 = paling rendah, 8 = paling tinggi (S3).",
        },
        { name: "active", label: "Status", type: "checkbox", placeholder: "Jenjang aktif dipakai" },
      ]}
    />
  );
}
