import { api } from "../lib/api";
import type { UploadResponse } from "../types/api";

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<UploadResponse>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const uploadFiles = async (files: File[]): Promise<UploadResponse[]> => {
  return Promise.all(files.map((f) => uploadFile(f)));
};
