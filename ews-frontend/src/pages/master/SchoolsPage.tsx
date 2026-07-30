
import MasterCrudPage from "../../components/master/MasterCrudPage";
import { schoolsApi } from "../../services/master.service";
import type { School } from "../../types/api";

export default function SchoolsPage() {
  return (
    <MasterCrudPage<School>
      queryKey="master-schools"
      api={schoolsApi}
      searchPlaceholder="Cari nama / NPSN sekolah..."
      itemLabel={(r) => r.nama}
      emptyValue={{ active: true }}
      columns={[
        {
          header: "NPSN",
          render: (r) => (
            <span className="font-mono text-xs text-slate-500">{r.npsn}</span>
          ),
        },
        {
          header: "Nama Sekolah",
          render: (r) => (
            <span className="font-medium text-slate-800">{r.nama}</span>
          ),
        },
        { header: "Jenjang", render: (r) => r.jenjang },
        {
          header: "Kapanewon",
          render: (r) =>
            r.kapanewon || <span className="text-slate-400">-</span>,
        },
        {
          header: "Status",
          render: (r) => (
            <span
              className={`text-xs font-semibold ${r.active ? "text-green-600" : "text-slate-400"}`}
            >
              {r.active ? "Aktif" : "Nonaktif"}
            </span>
          ),
        },
      ]}
      fields={[
        { name: "npsn", label: "NPSN", required: true },
        { name: "nama", label: "Nama Sekolah", required: true },
        {
          name: "jenjang",
          label: "Jenjang",
          type: "select",
          required: true,
          options: ["SD", "SMP", "SMA", "SMK"].map((v) => ({
            value: v,
            label: v,
          })),
        },
        { name: "alamat", label: "Alamat", type: "textarea" },
        { name: "kapanewon", label: "Kapanewon" },
        { name: "kalurahan", label: "Kalurahan" },
        { name: "latitude", label: "Latitude", type: "number" },
        { name: "longitude", label: "Longitude", type: "number" },
        {
          name: "active",
          label: "Status",
          type: "checkbox",
          placeholder: "Sekolah aktif",
        },
      ]}
    />
  );
}
