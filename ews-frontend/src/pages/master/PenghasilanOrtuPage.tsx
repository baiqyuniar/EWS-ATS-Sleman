import { Wallet } from "lucide-react";
import MasterCrudPage from "../../components/master/MasterCrudPage";
import { penghasilanOrtuApi } from "../../services/master.service";
import type { PenghasilanOrtu } from "../../types/api";

export default function PenghasilanOrtuPage() {
  return (
    <MasterCrudPage<PenghasilanOrtu>
      title="Master Penghasilan Orang Tua"
      description="Kelola rentang penghasilan ayah/ibu siswa. Kode ordinal (0-6) dipakai fitur prediksi ML — urutkan dari terendah ke tertinggi."
      icon={Wallet}
      queryKey="master-penghasilan-ortu"
      api={penghasilanOrtuApi}
      searchPlaceholder="Cari rentang penghasilan..."
      itemLabel={(r) => r.nama}
      emptyValue={{ active: true, kodeOrdinal: 0 }}
      columns={[
        { header: "Rentang Penghasilan", render: (r) => <span className="font-medium text-slate-800">{r.nama}</span> },
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
        { name: "nama", label: "Rentang Penghasilan", required: true, placeholder: "mis. Rp. 500,000 - Rp. 999,999" },
        {
          name: "kodeOrdinal",
          label: "Kode Ordinal (0-6)",
          type: "number",
          required: true,
          helpText: "Dipakai fitur prediksi ML — 0 = tidak berpenghasilan, 6 = tertinggi.",
        },
        { name: "active", label: "Status", type: "checkbox", placeholder: "Rentang aktif dipakai" },
      ]}
    />
  );
}
