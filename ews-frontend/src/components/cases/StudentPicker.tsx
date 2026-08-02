import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { getStudents } from "../../services/students.service";
import type { Student } from "../../types/api";

interface Props {
  value: Student | null;
  onChange: (student: Student | null) => void;
  initialSearch?: string;
}

export default function StudentPicker({ value, onChange, initialSearch }: Props) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [open, setOpen] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ["students-search", search],
    queryFn: () => getStudents({ search, limit: 8 }),
    enabled: open && search.length > 1,
  });

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-1.5 block">
        Siswa <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={value ? `${value.nama.toUpperCase()} (${value.nisn})` : search}
          onChange={(e) => {
            onChange(null);
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ketik nama atau NISN siswa..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>
      {open && !value && search.length > 1 && (
        <div className="mt-2 border border-slate-100 rounded-2xl divide-y divide-slate-50 max-h-56 overflow-y-auto">
          {isFetching && <p className="text-xs text-slate-400 px-4 py-3">Mencari...</p>}
          {data?.data.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm"
            >
              <p className="font-medium text-slate-700 uppercase">{s.nama}</p>
              <p className="text-xs text-slate-400">
                NISN {s.nisn} &middot; {s.school?.nama ? s.school.nama.toUpperCase() : "Belum ada sekolah"}
              </p>
            </button>
          ))}
          {data && data.data.length === 0 && !isFetching && (
            <p className="text-xs text-slate-400 px-4 py-3">Siswa tidak ditemukan.</p>
          )}
        </div>
      )}
    </div>
  );
}
