import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { bulkUploadPredictions } from "../../services/prediction.service";
import type { BulkPredictionResponse, BulkPredictionRow } from "../../types/api";
import { ErrorAlert } from "../../components/ui/Alert";
import { apiErrorMessage } from "../../lib/api";
import { RiskBadge } from "../../components/ui/Badge";

const TEMPLATE_HEADER =
  "studentId,num,kodePendidikanAyah,kodePendidikanIbu,kodePenghasilanAyah,kodePenghasilanIbu";

function parseCsv(text: string): BulkPredictionRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: any = {};
    headers.forEach((h, i) => {
      const raw = values[i];
      if (raw === undefined || raw === "") return;
      row[h] = h === "studentId" ? parseInt(raw, 10) : Number(raw);
    });
    return row as BulkPredictionRow;
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
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) throw new Error("File kosong atau format tidak sesuai");
      setRows(parsed);
    } catch (err: any) {
      setParseError(err.message || "Gagal membaca file");
      setRows([]);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_HEADER + "\n1,75,4,4,2,2\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-prediksi-batch.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Upload &amp; Prediksi Batch</h2>
              <p className="text-sm text-slate-500">
                Upload file CSV berisi ID siswa untuk menjalankan prediksi risiko secara massal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
            >
              <Download size={16} />
              Unduh Template CSV
            </button>
            <span className="text-xs text-slate-400">
              Kolom: {TEMPLATE_HEADER}
            </span>
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
              {fileName || "Klik atau seret file CSV ke sini"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {rows.length > 0 ? `${rows.length} baris terbaca` : "Format: .csv"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
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
                    <span className="text-slate-600">Student #{r.studentId}</span>
                  </div>
                  {r.success && r.riskCategory ? (
                    <RiskBadge value={r.riskCategory as any} />
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
