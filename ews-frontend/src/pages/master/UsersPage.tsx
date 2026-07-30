import { useQuery } from "@tanstack/react-query";
import MasterCrudPage from "../../components/master/MasterCrudPage";
import { schoolsApi, opdApi, wilayahApi } from "../../services/master.service";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/users.service";
import type { AppUser } from "../../types/api";
import { ROLE_LABEL } from "../../types/api";

export default function UsersPage() {
  const { data: schoolData } = useQuery({
    queryKey: ["master-school-options"],
    queryFn: () => schoolsApi.list({ limit: 200 }),
  });
  const { data: opdData } = useQuery({
    queryKey: ["master-opd-options"],
    queryFn: () => opdApi.list({ limit: 100 }),
  });
  const { data: wilayahData } = useQuery({
    queryKey: ["master-wilayah-options"],
    queryFn: () => wilayahApi.list({ limit: 200 }),
  });

  const schoolOptions = (schoolData?.data ?? []).map((s) => ({
    value: s.id,
    label: s.nama,
  }));
  const opdOptions = (opdData?.data ?? []).map((o) => ({
    value: o.id,
    label: o.nama,
  }));
  const wilayahOptions = (wilayahData?.data ?? []).map((w) => ({
    value: w.id,
    label: w.kapanewon,
  }));
  const roleOptions = Object.entries(ROLE_LABEL).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <MasterCrudPage<AppUser>
      queryKey="master-users"
      api={{
        list: getUsers,
        create: createUser,
        update: updateUser,
        remove: deleteUser,
      }}
      searchPlaceholder="Cari nama / email..."
      itemLabel={(r) => r.name}
      emptyValue={{ role: "SEKOLAH" }}
      columns={[
        {
          header: "Nama",
          render: (r) => (
            <span className="font-medium text-slate-800">{r.name}</span>
          ),
        },
        { header: "Email", render: (r) => r.email },
        {
          header: "Peran",
          render: (r) => (
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              {ROLE_LABEL[r.role]}
            </span>
          ),
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
        { name: "name", label: "Nama Lengkap", required: true },
        {
          name: "email",
          label: "Email",
          required: true,
          placeholder: "nama@sleman.go.id",
        },
        {
          name: "password",
          label: "Password",
          placeholder: "Minimal 6 karakter",
          helpText:
            "Wajib diisi saat membuat user baru. Saat mengubah data, kosongkan jika tidak ingin mengubah password.",
        },
        {
          name: "role",
          label: "Peran",
          type: "select",
          required: true,
          options: roleOptions,
        },
        {
          name: "schoolId",
          label: "Sekolah (untuk peran Sekolah)",
          type: "select",
          options: schoolOptions,
        },
        {
          name: "opdId",
          label: "OPD (untuk peran OPD)",
          type: "select",
          options: opdOptions,
        },
        {
          name: "wilayahId",
          label: "Wilayah / Kapanewon (untuk peran Kapanewon)",
          type: "select",
          options: wilayahOptions,
        },
        {
          name: "active",
          label: "Status",
          type: "checkbox",
          placeholder: "Akun aktif",
        },
      ]}
    />
  );
}
