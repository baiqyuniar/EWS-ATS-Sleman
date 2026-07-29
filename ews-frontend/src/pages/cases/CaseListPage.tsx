import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Search, Loader2, ChevronRight, Megaphone, FileText } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getCases } from "../../services/cases.service";
import type { CaseStatus, CaseSource } from "../../types/api";
import { CASE_STATUS_LABEL, CASE_SOURCE_LABEL } from "../../types/api";
import { CaseStatusBadge, CaseSourceBadge } from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../hooks/useAuth";

export default function CaseListPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CaseStatus | "">("");
  const [source, setSource] = useState<CaseSource | "">("");

  const { data, isLoading } = useQuery({
    queryKey: ["cases", page, search, status, source],
    queryFn: () =>
      getCases({
        page,
        limit: 10,
        search: search || undefined,
        status: (status || undefined) as CaseStatus | undefined,
        source: (source || undefined) as CaseSource | undefined,
      }),
  });

  const canCreatePelaporan = role === "SEKOLAH";
  const canCreatePengaduan = role === "KAPANEWON";

  return (
  <DashboardLayout>
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Toolbar */}
      <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
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
              placeholder="Cari nomor kasus / nama siswa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as CaseStatus | "");
              setPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="">Semua Status</option>
            {Object.entries(CASE_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value as CaseSource | "");
              setPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="">Semua Sumber</option>
            {Object.entries(CASE_SOURCE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Button */}
        <div className="flex flex-wrap gap-3">
          {canCreatePelaporan && (
            <button
              onClick={() => navigate("/cases/new/pelaporan")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              <FileText size={17} />
              Pelaporan Sekolah
            </button>
          )}

          {canCreatePengaduan && (
            <button
              onClick={() => navigate("/cases/new/pengaduan")}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition"
            >
              <Megaphone size={17} />
              Pengaduan Masyarakat
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="animate-spin" size={20} />
          Memuat data...
        </div>
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Belum ada kasus"
          description="Kasus akan muncul di sini setelah ada pelaporan sekolah atau pengaduan masyarakat."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">
                    Nomor Kasus
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">
                    Siswa
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">
                    Sumber
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-500">
                    Tanggal Dibuat
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {data?.data.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-700">
                      {c.nomorKasus}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">
                        {c.student?.nama}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.student?.school?.nama ?? "-"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <CaseSourceBadge value={c.source} />
                    </td>

                    <td className="px-6 py-4">
                      <CaseStatusBadge value={c.status} />
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-6 py-4 text-right text-slate-400">
                      <ChevronRight size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-6 py-4">
            {data?.meta && (
              <Pagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                onChange={setPage}
              />
            )}
          </div>
        </>
      )}
    </div>
  </DashboardLayout>
  );
}