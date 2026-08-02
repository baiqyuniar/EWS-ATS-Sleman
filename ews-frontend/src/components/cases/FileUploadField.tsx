import { useRef, useState } from "react";
import { Paperclip, X, Loader2 } from "lucide-react";
import { uploadFiles } from "../../services/uploads.service";
import { fileUrl } from "../../lib/api";

interface Props {
  label: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  accept?: string;
  required?: boolean;
  /** Ukuran maksimal per file dalam MB. Default 10MB, mengikuti batas backend (uploads.controller.ts). */
  maxSizeMB?: number;
}

// SECURITY/UX: batasan jenis & ukuran file diverifikasi backend (uploads.controller.ts,
// whitelist JPG/PNG/WEBP/PDF, maks 10MB) — validasi di sini murni supaya pengguna dapat
// pesan kesalahan langsung tanpa menunggu round-trip ke server untuk kesalahan yang jelas.
const DEFAULT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const DEFAULT_ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export default function FileUploadField({
  label,
  urls,
  onChange,
  accept,
  required,
  maxSizeMB = 10,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const validateFiles = (files: File[]): string => {
    for (const file of files) {
      const ext = file.name.includes(".") ? `.${file.name.split(".").pop()!.toLowerCase()}` : "";
      const typeOk = DEFAULT_ALLOWED_TYPES.includes(file.type) && DEFAULT_ALLOWED_EXT.includes(ext);
      if (!typeOk) {
        return `Jenis file "${file.name}" tidak diizinkan. Hanya JPG, PNG, WEBP, atau PDF.`;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `Ukuran file "${file.name}" melebihi ${maxSizeMB}MB.`;
      }
    }
    return "";
  };

  const handleFiles = async (files: FileList) => {
    setError("");
    const fileArr = Array.from(files);
    const validationError = validateFiles(fileArr);
    if (validationError) {
      setError(validationError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadFiles(fileArr);
      onChange([...urls, ...uploaded.map((u) => u.url)]);
    } catch {
      setError("Gagal mengunggah file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 mb-1.5 block">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {urls.map((u, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full"
          >
            <a href={fileUrl(u)} target="_blank" rel="noreferrer" className="hover:underline max-w-[140px] truncate">
              {u.split("/").pop()}
            </a>
            <button type="button" onClick={() => onChange(urls.filter((_, idx) => idx !== i))}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl px-4 py-2 hover:bg-blue-50 disabled:opacity-50"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
        {uploading ? "Mengunggah..." : "Unggah File"}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-xs text-slate-400 mt-1">
        Format: JPG, PNG, WEBP, atau PDF. Maksimal {maxSizeMB}MB per file.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept ?? DEFAULT_ALLOWED_EXT.join(",")}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
