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
}

export default function FileUploadField({ label, urls, onChange, accept, required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadFiles(Array.from(files));
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
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
