import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import Modal from "../ui/Modal";
import Pagination from "../ui/Pagination";
import EmptyState from "../ui/EmptyState";
import { ErrorAlert } from "../ui/Alert";
import { apiErrorMessage } from "../../lib/api";
import type { Paginated } from "../../types/api";

export interface FieldConfig {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "checkbox" | "date" | "email";
  options?: { value: string | number; label: string }[];
  required?: boolean;
  placeholder?: string;
  hideOnEdit?: boolean;
  helpText?: string;
}

export interface ColumnConfig<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface CrudApi<T> {
  list: (query: { page?: number; limit?: number; search?: string }) => Promise<Paginated<T>>;
  create: (payload: any) => Promise<T>;
  update: (id: number, payload: any) => Promise<T>;
  remove: (id: number) => Promise<void>;
}

interface Props<T extends { id: number }> {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  queryKey: string;
  api: CrudApi<T>;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  searchPlaceholder?: string;
  itemLabel?: (row: T) => string;
  emptyValue?: Record<string, any>;
  readOnly?: boolean;
}

export default function MasterCrudPage<T extends { id: number }>({
  title,
  description,
  icon: Icon,
  queryKey,
  api,
  columns,
  fields,
  searchPlaceholder,
  itemLabel,
  emptyValue = {},
  readOnly = false,
}: Props<T>) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryKey, page, search],
    queryFn: () => api.list({ page, limit: 10, search }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyValue });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setForm({ ...row });
    setFormError("");
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      delete payload.id;
      // strip empty-string optionals so backend @IsOptional validators don't choke
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") payload[k] = undefined;
      });
      if (editing) {
        return api.update(editing.id, payload);
      }
      return api.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setModalOpen(false);
    },
    onError: (err) => setFormError(apiErrorMessage(err, "Gagal menyimpan data")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setDeleteTarget(null);
    },
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <DashboardLayout>
      <div className="space-y-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              {Icon ? <Icon size={22} /> : null}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={searchPlaceholder ?? "Cari..."}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {!readOnly && (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition whitespace-nowrap"
                >
                  <Plus size={18} />
                  Tambah
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={20} /> Memuat data...
            </div>
          ) : isError ? (
            <div className="p-6">
              <ErrorAlert message="Gagal memuat data dari server. Pastikan backend berjalan." />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Icon} title="Belum ada data" description="Data akan muncul di sini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    {columns.map((c) => (
                      <th key={c.header} className={`px-6 py-3 font-medium ${c.className ?? ""}`}>
                        {c.header}
                      </th>
                    ))}
                    {!readOnly && <th className="px-6 py-3 font-medium text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      {columns.map((c) => (
                        <td key={c.header} className={`px-6 py-3.5 ${c.className ?? ""}`}>
                          {c.render(row)}
                        </td>
                      ))}
                      {!readOnly && (
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(row)}
                              className="w-9 h-9 rounded-xl hover:bg-blue-50 text-blue-600 flex items-center justify-center"
                              title="Ubah"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(row)}
                              className="w-9 h-9 rounded-xl hover:bg-red-50 text-red-500 flex items-center justify-center"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Ubah Data" : "Tambah Data"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <ErrorAlert message={formError} />
          {fields
            .filter((f) => !(editing && f.hideOnEdit))
            .map((field) => (
              <div key={field.name}>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    required={field.required}
                    value={form[field.name] ?? ""}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                ) : field.type === "select" ? (
                  <select
                    required={field.required}
                    value={form[field.name] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.name]:
                          field.options?.find((o) => String(o.value) === e.target.value)
                            ?.value ?? e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                  >
                    <option value="">Pilih {field.label}</option>
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={!!form[field.name]}
                      onChange={(e) => setForm({ ...form, [field.name]: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    {field.placeholder ?? "Aktif"}
                  </label>
                ) : (
                  <input
                    type={
                      field.type === "number"
                        ? "number"
                        : field.type === "date"
                          ? "date"
                          : field.type === "email"
                            ? "email"
                            : "text"
                    }
                    required={field.required}
                    value={form[field.name] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.name]:
                          field.type === "number"
                            ? e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                            : e.target.value,
                      })
                    }
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                )}
                {field.helpText && <p className="text-xs text-slate-400 mt-1">{field.helpText}</p>}
              </div>
            ))}

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition disabled:opacity-60"
          >
            {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Data"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-slate-600 mb-6">
          Yakin ingin menghapus{" "}
          <span className="font-semibold">
            {deleteTarget && itemLabel ? itemLabel(deleteTarget) : "data ini"}
          </span>
          ? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 py-2.5 rounded-2xl border border-slate-200 font-medium text-slate-600"
          >
            Batal
          </button>
          <button
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
            className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60"
          >
            {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
