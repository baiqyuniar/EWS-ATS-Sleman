import { useQuery } from "@tanstack/react-query";
import {
  Building2,
} from "lucide-react";

import MasterCrudPage from "../../components/master/MasterCrudPage";

import {
  interventionTypesApi,
  opdApi,
} from "../../services/master.service";

import type { InterventionType } from "../../types/api";

export default function InterventionTypesPage() {
  const { data: opdData } = useQuery({
    queryKey: ["master-opd-options"],
    queryFn: () => opdApi.list({ limit: 100 }),
  });

  const opdOptions = (opdData?.data ?? []).map((o) => ({
    value: o.id,
    label: o.nama,
  }));

  return (
    <MasterCrudPage<InterventionType>
      queryKey="master-intervention-types"
      api={interventionTypesApi}
      searchPlaceholder="Cari berdasarkan kode atau nama intervensi..."
      itemLabel={(r) => r.nama}
      emptyValue={{
        active: true,
      }}
      columns={[
        {
          header: "Kode",
          render: (r) => (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
              {r.kode}
            </span>
          ),
        },

        {
          header: "Nama Intervensi",
          render: (r) => (
            <div>
              <p className="font-semibold text-slate-800">
                {r.nama}
              </p>

              {r.deskripsi && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {r.deskripsi}
                </p>
              )}
            </div>
          ),
        },

        {
          header: "OPD Penanggung Jawab",
          render: (r) =>
            r.opd ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                <Building2 size={15} />
                {r.opd.nama}
              </span>
            ) : (
              <span className="text-slate-400">-</span>
            ),
        },

        {
          header: "Status",
          render: (r) => (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                r.active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {r.active ? "Aktif" : "Nonaktif"}
            </span>
          ),
        },
      ]}
      fields={[
        {
          name: "kode",
          label: "Kode Intervensi",
          required: true,
        },

        {
          name: "nama",
          label: "Nama Intervensi",
          required: true,
        },

        {
          name: "opdId",
          label: "OPD Penanggung Jawab",
          type: "select",
          options: opdOptions,
        },

        {
          name: "deskripsi",
          label: "Deskripsi Intervensi",
          type: "textarea",
          placeholder:
            "Masukkan deskripsi singkat jenis intervensi...",
        },

        {
          name: "active",
          label: "Status Aktif",
          type: "checkbox",
          placeholder:
            "Jenis intervensi dapat digunakan",
        },
      ]}
    />
  );
}