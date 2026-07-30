import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Download, CheckCircle2, XCircle } from "lucide-react";
import * as XLSX from "xlsx";

import DashboardLayout from "../../layouts/DashboardLayout";
import { bulkUploadPredictions } from "../../services/prediction.service";
import type { BulkPredictionResponse, BulkPredictionRow, RiskCategory } from "../../types/api";
import { ErrorAlert } from "../../components/ui/Alert";
import { apiErrorMessage } from "../../lib/api";
import { RiskBadge } from "../../components/ui/Badge";

const TEMPLATE_COLUMNS = [
  "nisn",
  "num",
  "kodePendidikanAyah",
  "kodePendidikanIbu",
  "kodePenghasilanAyah",
  "kodePenghasilanIbu",
] as const;

const TEMPLATE_HEADER = TEMPLATE_COLUMNS.join(",");
function parseExcelRows(data: ArrayBuffer): BulkPredictionRow[] {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  const raw: unknown[][] = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  if (raw.length < 2) return [];

  const headers: string[] = raw[0].map((h: unknown) => String(h ?? "").trim());
  return raw
    .slice(1)
    .filter((line: unknown[]) => line.some((cell) => cell !== null && cell !== ""))
    .map((line: unknown[]) => {
      const values = line;
      const row: Record<string, string | number> = {};
      headers.forEach((h: string, i: number) => {
        const cell = values[i];
        if (cell === null || cell === undefined || cell === "") return;
        // nisn tetap string (bisa berawalan angka 0) — kolom lain numerik.
        row[h] = h === "nisn" ? String(cell).trim() : Number(cell);
      });
      return row as unknown as BulkPredictionRow;
    });
}

export default function UploadPredictionPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<BulkPredictionRow[]>([]);
  const [datasetBatch, setDatasetBatch] = useState(`BATCH-${new Date().toISOString().slice(0, 10)}`);
  const [parseError, setParseError] = useState("");

  const mutation = useMutation<BulkPredictionResponse, unknown, void>({
    mutationFn: () => bulkUploadPredictions(datasetBatch, rows),
  });

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setParseError("");
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelRows(buffer);
      if (parsed.length === 0) throw new Error("File kosong atau format tidak sesuai");
      setRows(parsed);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : "Gagal membaca file");
      setRows([]);
    }
  };

  const downloadTemplate = () => {
    // NISN contoh sengaja berupa string (bukan number) supaya SheetJS menyimpannya
    // sebagai sel teks — angka nol di depan NISN tidak hilang saat dibuka di Excel.
    const exampleRow: (string | number)[] = ["0012345678", 75, 4, 4, 2, 2];
    const sheet = XLSX.utils.aoa_to_sheet([[...TEMPLATE_COLUMNS], exampleRow]);
    sheet["!cols"] = TEMPLATE_COLUMNS.map((c) => ({ wch: Math.max(c.length + 2, 12) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Template");
    XLSX.writeFile(workbook, "template-prediksi-batch.xlsx");
  };

return (
  <DashboardLayout>
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <button
          onClick={downloadTemplate}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-all hover:bg-blue-100 hover:border-blue-300"
        >
          <Download size={16} />
          Unduh Template Excel
        </button>

        <div className="text-xs text-slate-500">
          <span className="font-medium text-slate-600">
            Format Kolom:
          </span>{" "}
          {TEMPLATE_HEADER}
        </div>
      </div>
      </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              Nama Batch Dataset
            </label>
            <input
              value={datasetBatch}
              onChange={(e) => setDatasetBatch(e.target.value)}
              className="w-full max-w-sm px-4 py-2.5 rounded-2xl border border-slate-200 text-sm mb-5"
            />
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition"
          >
            <Upload size={28} className="mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-600">
              {fileName || "Klik atau seret file Excel ke sini"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {rows.length > 0 ? `${rows.length} baris terbaca` : "Format: .xlsx, .xls"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          <ErrorAlert message={parseError} />
          <ErrorAlert message={mutation.isError ? apiErrorMessage(mutation.error) : null} />

          <button
            onClick={() => mutation.mutate()}
            disabled={rows.length === 0 || mutation.isPending}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition disabled:opacity-50"
          >
            {mutation.isPending ? "Memproses..." : `Jalankan Prediksi untuk ${rows.length} Siswa`}
          </button>
        </div>

        {mutation.data && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-slate-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{mutation.data.processed}</p>
                <p className="text-xs text-slate-500">Diproses</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{mutation.data.success}</p>
                <p className="text-xs text-slate-500">Berhasil</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{mutation.data.failed}</p>
                <p className="text-xs text-slate-500">Gagal</p>
              </div>
            </div>

            <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
              {mutation.data.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    {r.success ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                    <span className="text-slate-600">NISN {r.nisn}</span>
                  </div>
                  {r.success && r.riskCategory ? (
                    <RiskBadge value={r.riskCategory as RiskCategory} />
                  ) : (
                    <span className="text-xs text-red-500">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}