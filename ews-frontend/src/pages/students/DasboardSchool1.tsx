import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";

import MasterCrudPage from "../../components/master/MasterCrudPage";
import Modal from "../../components/ui/Modal";
import { RiskBadge } from "../../components/ui/Badge";
import {
  schoolsApi,
  agamaApi,
  kebutuhanKhususApi,
  jenisTinggalApi,
  alatTransportasiApi,
  pekerjaanOrtuApi,
  pendidikanOrtuApi,
  penghasilanOrtuApi,
} from "../../services/master.service";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../../services/students.service";
import { getPredictionsByStudent } from "../../services/prediction.service";
import type { Student, UserRole } from "../../types/api";
import { STUDENT_STATUS_LABEL } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";

// Role yang berwenang melihat data prediksi siswa (samakan dengan @Roles di
// GET /predictions/student/:id backend).
const CAN_VIEW_PREDICTION: UserRole[] = ["ADMIN", "SEKOLAH", "KAPANEWON", "DINAS_PENDIDIKAN"];

export default function StudentListPage() {
  const { role } = useAuth();
  const canWrite = role === "ADMIN" || role === "SEKOLAH";
  const canViewPrediction = !!role && CAN_VIEW_PREDICTION.includes(role);

  // Siswa yang sedang dilihat detail prediksinya lewat popup (klik "Lihat" di
  // kolom Prediksi). null = modal tertutup.
  const [predictionModalStudent, setPredictionModalStudent] = useState<Student | null>(null);
  const { data: predictionHistory, isLoading: isLoadingPredictions } = useQuery({
    queryKey: ["predictions-by-student", predictionModalStudent?.id],
    queryFn: () => getPredictionsByStudent(predictionModalStudent!.id),
    enabled: !!predictionModalStudent,
  });

  const { data: schoolData } = useQuery({
    queryKey: ["master-school-options"],
    queryFn: () => schoolsApi.list({ limit: 200 }),
  });
  const schoolOptions = (schoolData?.data ?? []).map((s) => ({
    value: s.id,
    label: s.nama,
  }));

  // Opsi mastering data (Data Siswa Aktif) — dipakai dropdown form tambah/edit siswa.
  const { data: agamaData } = useQuery({
    queryKey: ["master-agama-options"],
    queryFn: () => agamaApi.list({ limit: 100 }),
  });
  const { data: kebutuhanKhususData } = useQuery({
    queryKey: ["master-kebutuhan-khusus-options"],
    queryFn: () => kebutuhanKhususApi.list({ limit: 100 }),
  });
  const { data: jenisTinggalData } = useQuery({
    queryKey: ["master-jenis-tinggal-options"],
    queryFn: () => jenisTinggalApi.list({ limit: 100 }),
  });
  const { data: alatTransportasiData } = useQuery({
    queryKey: ["master-alat-transportasi-options"],
    queryFn: () => alatTransportasiApi.list({ limit: 100 }),
  });
  const { data: pekerjaanOrtuData } = useQuery({
    queryKey: ["master-pekerjaan-ortu-options"],
    queryFn: () => pekerjaanOrtuApi.list({ limit: 100 }),
  });
  const { data: pendidikanOrtuData } = useQuery({
    queryKey: ["master-pendidikan-ortu-options"],
    queryFn: () => pendidikanOrtuApi.list({ limit: 100 }),
  });
  const { data: penghasilanOrtuData } = useQuery({
    queryKey: ["master-penghasilan-ortu-options"],
    queryFn: () => penghasilanOrtuApi.list({ limit: 100 }),
  });

  const agamaOptions = (agamaData?.data ?? []).map((r) => ({ value: r.id, label: r.nama }));
  const kebutuhanKhususOptions = (kebutuhanKhususData?.data ?? []).map((r) => ({
    value: r.id,
    label: r.nama,
  }));
  const jenisTinggalOptions = (jenisTinggalData?.data ?? []).map((r) => ({
    value: r.id,
    label: r.nama,
  }));
  const alatTransportasiOptions = (alatTransportasiData?.data ?? []).map((r) => ({
    value: r.id,
    label: r.nama,
  }));
  const pekerjaanOrtuOptions = (pekerjaanOrtuData?.data ?? []).map((r) => ({
    value: r.id,
    label: r.nama,
  }));
  const pendidikanOrtuOptions = (pendidikanOrtuData?.data ?? []).map((r) => ({
    value: r.id,
    label: r.nama,
  }));
  const penghasilanOrtuOptions = (penghasilanOrtuData?.data ?? []).map((r) => ({
    value: r.id,
    label: r.nama,
  }));

  return (
    <>
    <MasterCrudPage<Student>
      queryKey="students-aktif"
      readOnly={!canWrite}
      api={{
        list: (q) => getStudents({ ...q, excludeStatus: "PUTUS_SEKOLAH" }),
        create: createStudent,
        update: updateStudent,
        remove: deleteStudent,
      }}
      searchPlaceholder="Cari nama / NISN / NIK siswa..."
      itemLabel={(r) => r.nama}
      emptyValue={{}}
      columns={[
        {
          header: "NISN",
          render: (r) => (
            <span className="font-mono text-xs text-slate-500">{r.nisn}</span>
          ),
        },
        {
          header: "Nama",
          render: (r) => (
            <span className="font-medium text-slate-800">{r.nama}</span>
          ),
        },
        {
          header: "Sekolah",
          render: (r) =>
            r.school?.nama || <span className="text-slate-400">-</span>,
        },
        {
          header: "Kelas",
          render: (r) => r.kelas || <span className="text-slate-400">-</span>,
        },
        {
          header: "Status",
          render: (r) => (
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
              {STUDENT_STATUS_LABEL[r.status]}
            </span>
          ),
        },
        {
          header: "Prediksi",
          render: (r) => {
            const latest = r.predictions?.[0];
            return (
              <div className="flex items-center gap-2 flex-wrap">
                {latest ? (
                  <>
                    <RiskBadge value={latest.riskCategory} />
                    <span className="text-xs font-medium text-slate-500">
                      {latest.probabilitas.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">
                    Belum diprediksi
                  </span>
                )}
                {canViewPrediction && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPredictionModalStudent(r);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Lihat <ExternalLink size={12} />
                  </button>
                )}
              </div>
            );
          },
        },
              ]}
              fields={[
                { name: "nisn", label: "NISN", required: true },
                { name: "nik", label: "NIK", required: true },
                { name: "nama", label: "Nama Lengkap", required: true },
                { name: "tempatLahir", label: "Tempat Lahir" },
                { name: "tanggalLahir", label: "Tanggal Lahir", type: "date" },
                {
                  name: "jenisKelamin",
                  label: "Jenis Kelamin",
                  type: "select",
                  options: [
                    { value: "L", label: "Laki-laki" },
                    { value: "P", label: "Perempuan" },
                  ],
                },
                { name: "kelas", label: "Kelas" },
                {
                  name: "schoolId",
                  label: "Sekolah",
                  type: "select",
                  options: schoolOptions,
                },
                {
                  name: "agamaId",
                  label: "Agama",
                  type: "select",
                  options: agamaOptions,
                },
                {
                  name: "kebutuhanKhususId",
                  label: "Kebutuhan Khusus (Siswa)",
                  type: "select",
                  options: kebutuhanKhususOptions,
                },

                // Alamat (mengikuti kolom Data Siswa Aktif)
                { name: "alamatJalan", label: "Alamat Jalan" },
                { name: "rt", label: "RT" },
                { name: "rw", label: "RW" },
                { name: "namaDusun", label: "Dusun" },
                { name: "desaKelurahan", label: "Desa/Kelurahan" },
                {
                  name: "kecamatan",
                  label: "Kecamatan/Kapanewon",
                  helpText: "Mengikuti kecamatan tempat sekolah berada.",
                },
                { name: "kabupaten", label: "Kabupaten" },
                { name: "provinsi", label: "Provinsi" },
                {
                  name: "jenisTinggalId",
                  label: "Jenis Tinggal",
                  type: "select",
                  options: jenisTinggalOptions,
                },
                {
                  name: "alatTransportasiId",
                  label: "Alat Transportasi",
                  type: "select",
                  options: alatTransportasiOptions,
                },

                // Kontak & administrasi
                { name: "namaOrtu", label: "Nama Orang Tua/Wali" },
                { name: "kontakOrtu", label: "Kontak Orang Tua/Wali" },
                { name: "penerimaKps", label: "Penerima KPS", type: "checkbox" },
                { name: "noKps", label: "No. KPS" },
                { name: "layakPip", label: "Layak PIP", type: "checkbox" },
                { name: "penerimaKip", label: "Penerima KIP", type: "checkbox" },
                { name: "noKip", label: "No. KIP" },
                { name: "noKks", label: "No. KKS" },
                { name: "regAktaLahir", label: "No. Registrasi Akta Lahir" },

                // Data Ayah
                { name: "namaAyah", label: "Nama Ayah" },
                { name: "tahunLahirAyah", label: "Tahun Lahir Ayah", type: "number" },
                {
                  name: "pendidikanAyahId",
                  label: "Pendidikan Ayah",
                  type: "select",
                  options: pendidikanOrtuOptions,
                  helpText: "Otomatis mengisi kode fitur ML (kodePendidikanAyah).",
                },
                {
                  name: "pekerjaanAyahId",
                  label: "Pekerjaan Ayah",
                  type: "select",
                  options: pekerjaanOrtuOptions,
                },
                {
                  name: "penghasilanAyahId",
                  label: "Penghasilan Ayah",
                  type: "select",
                  options: penghasilanOrtuOptions,
                  helpText: "Otomatis mengisi kode fitur ML (kodePenghasilanAyah).",
                },
                {
                  name: "kebutuhanKhususAyahId",
                  label: "Kebutuhan Khusus Ayah",
                  type: "select",
                  options: kebutuhanKhususOptions,
                },

                // Data Ibu
                { name: "namaIbu", label: "Nama Ibu Kandung" },
                { name: "tahunLahirIbu", label: "Tahun Lahir Ibu", type: "number" },
                {
                  name: "pendidikanIbuId",
                  label: "Pendidikan Ibu",
                  type: "select",
                  options: pendidikanOrtuOptions,
                  helpText: "Otomatis mengisi kode fitur ML (kodePendidikanIbu).",
                },
                {
                  name: "pekerjaanIbuId",
                  label: "Pekerjaan Ibu",
                  type: "select",
                  options: pekerjaanOrtuOptions,
                },
                {
                  name: "penghasilanIbuId",
                  label: "Penghasilan Ibu",
                  type: "select",
                  options: penghasilanOrtuOptions,
                  helpText: "Otomatis mengisi kode fitur ML (kodePenghasilanIbu).",
                },
                {
                  name: "kebutuhanKhususIbuId",
                  label: "Kebutuhan Khusus Ibu",
                  type: "select",
                  options: kebutuhanKhususOptions,
                },

                {
                  name: "status",
                  label: "Status Siswa",
                  type: "select",
                  hideOnEdit: false,
                  options: Object.entries(STUDENT_STATUS_LABEL).map(
                    ([value, label]) => ({ value, label }),
                  ),
                },
                {
                  name: "numerasi",
                  label: "Skor Numerasi (ASPD, 0-100)",
                  type: "number",
                  helpText:
                    "Fitur prediktor model ML — opsional, boleh dilengkapi belakangan.",
                },
              ]}
            />

    <Modal
      open={!!predictionModalStudent}
      onClose={() => setPredictionModalStudent(null)}
      title={`Riwayat Prediksi — ${predictionModalStudent?.nama ?? ""}`}
      maxWidth="max-w-xl"
    >
      {predictionModalStudent && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-slate-800">{predictionModalStudent.nama}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              NISN {predictionModalStudent.nisn} &middot;{" "}
              {predictionModalStudent.school?.nama ?? "Belum ada sekolah"}
            </p>
          </div>

          {isLoadingPredictions && (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}

          {!isLoadingPredictions && (predictionHistory ?? []).length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">
              Siswa ini belum pernah diprediksi.
            </p>
          )}

          {!isLoadingPredictions && (predictionHistory ?? []).length > 0 && (
            <div className="space-y-3">
              {predictionHistory!.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <RiskBadge value={p.riskCategory} />
                    <span className="text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-slate-400">Probabilitas Risiko</p>
                      <p className="font-semibold text-slate-700">
                        {p.probabilitas.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Model Dipakai</p>
                      <p className="font-semibold text-slate-700">
                        {p.modelDipakai ?? "-"}
                      </p>
                    </div>
                  </div>
                  {p.alasanRisiko.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.alasanRisiko.map((a, i) => (
                        <span
                          key={i}
                          className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
    </>
  );
}