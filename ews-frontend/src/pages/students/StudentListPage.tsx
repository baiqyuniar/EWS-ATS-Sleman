import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

import MasterCrudPage from "../../components/master/MasterCrudPage";

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

import type { Student } from "../../types/api";
import { STUDENT_STATUS_LABEL } from "../../types/api";
import { useAuth } from "../../hooks/useAuth";

export default function StudentListPage() {
  const { role } = useAuth();
  const canWrite = role === "ADMIN" || role === "SEKOLAH";

  const [selectedPrediction, setSelectedPrediction] =
    useState<{
      student: Student;
      prediction: any;
    } | null>(null);

  const { data: schoolData } = useQuery({
    queryKey: ["master-school-options"],
    queryFn: () => schoolsApi.list({ limit: 200 }),
  });

  const schoolOptions = (schoolData?.data ?? []).map((s) => ({
    value: s.id,
    label: s.nama,
  }));

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

  const agamaOptions = (agamaData?.data ?? []).map((r) => ({
    value: r.id,
    label: r.nama,
  }));

  const kebutuhanKhususOptions =
    (kebutuhanKhususData?.data ?? []).map((r) => ({
      value: r.id,
      label: r.nama,
    }));

  const jenisTinggalOptions =
    (jenisTinggalData?.data ?? []).map((r) => ({
      value: r.id,
      label: r.nama,
    }));

  const alatTransportasiOptions =
    (alatTransportasiData?.data ?? []).map((r) => ({
      value: r.id,
      label: r.nama,
    }));

  const pekerjaanOrtuOptions =
    (pekerjaanOrtuData?.data ?? []).map((r) => ({
      value: r.id,
      label: r.nama,
    }));

  const pendidikanOrtuOptions =
    (pendidikanOrtuData?.data ?? []).map((r) => ({
      value: r.id,
      label: r.nama,
    }));

  const penghasilanOrtuOptions =
    (penghasilanOrtuData?.data ?? []).map((r) => ({
      value: r.id,
      label: r.nama,
    }));
    const getRiskBadgeColor = (riskCategory?: string) => {
  switch (riskCategory?.toUpperCase()) {
    case "RENDAH":
      return "bg-green-100 text-green-700";

    case "SEDANG":
      return "bg-yellow-100 text-yellow-700";

    case "TINGGI":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

  return (
    <>
      <MasterCrudPage<Student>
        queryKey="students-aktif"
        readOnly={!canWrite}
        api={{
          list: (q) =>
            getStudents({
              ...q,
              excludeStatus: "PUTUS_SEKOLAH",
            }),
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
              <span className="font-mono text-xs text-slate-500">
                {r.nisn}
              </span>
            ),
          },
          {
            header: "Nama",
            render: (r) => (
              <span className="font-medium text-slate-800">
                {r.nama}
              </span>
            ),
          },
          {
            header: "Sekolah",
            render: (r) =>
              r.school?.nama ?? (
                <span className="text-slate-400">-</span>
              ),
          },
          {
            header: "Kelas",
            render: (r) =>
              r.kelas ?? (
                <span className="text-slate-400">-</span>
              ),
          },
          {
            header: "Status",
            render: (r) => {
              const statusClass = {
                AKTIF: "bg-green-100 text-green-700",
                PUTUS_SEKOLAH: "bg-red-100 text-red-700",
                LULUS: "bg-blue-100 text-blue-700",
                PINDAH: "bg-yellow-100 text-yellow-700",
              };

              return (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusClass[r.status as keyof typeof statusClass] ??
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {STUDENT_STATUS_LABEL[r.status]}
                </span>
              );
            },
          },
          {
            header: "Prediksi",
            render: (r) => {
              const latest = r.predictions?.[0];

              return (
                <div className="flex items-center gap-2 flex-wrap">
                  {latest ? (
                    <>
                      <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getRiskBadgeColor(
                      latest.riskCategory
                    )}`}
                  >
                    {latest.riskCategory}
                  </span>

                      <span className="text-xs text-slate-500">
                        {latest.probabilitas.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Belum diprediksi
                    </span>
                  )}

                  {role === "SEKOLAH" && latest && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        setSelectedPrediction({
                          student: r,
                          prediction: latest,
                        });
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Detail
                      <ExternalLink size={12} />
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

        { name: "alamatJalan", label: "Alamat Jalan" },
        { name: "rt", label: "RT" },
        { name: "rw", label: "RW" },
        { name: "namaDusun", label: "Dusun" },
        { name: "desaKelurahan", label: "Desa/Kelurahan" },

        {
          name: "kecamatan",
          label: "Kecamatan/Kapanewon",
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

        { name: "namaOrtu", label: "Nama Orang Tua/Wali" },
        { name: "kontakOrtu", label: "Kontak Orang Tua/Wali" },

        {
          name: "penerimaKps",
          label: "Penerima KPS",
          type: "checkbox",
        },

        { name: "noKps", label: "No. KPS" },

        {
          name: "layakPip",
          label: "Layak PIP",
          type: "checkbox",
        },

        {
          name: "penerimaKip",
          label: "Penerima KIP",
          type: "checkbox",
        },

        { name: "noKip", label: "No. KIP" },
        { name: "noKks", label: "No. KKS" },
        { name: "regAktaLahir", label: "No. Registrasi Akta Lahir" },

        // Ayah
        { name: "namaAyah", label: "Nama Ayah" },
        {
          name: "tahunLahirAyah",
          label: "Tahun Lahir Ayah",
          type: "number",
        },

        {
          name: "pendidikanAyahId",
          label: "Pendidikan Ayah",
          type: "select",
          options: pendidikanOrtuOptions,
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
        },

        {
          name: "kebutuhanKhususAyahId",
          label: "Kebutuhan Khusus Ayah",
          type: "select",
          options: kebutuhanKhususOptions,
        },

        // Ibu
        { name: "namaIbu", label: "Nama Ibu Kandung" },

        {
          name: "tahunLahirIbu",
          label: "Tahun Lahir Ibu",
          type: "number",
        },

        {
          name: "pendidikanIbuId",
          label: "Pendidikan Ibu",
          type: "select",
          options: pendidikanOrtuOptions,
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
          options: Object.entries(STUDENT_STATUS_LABEL).map(
            ([value, label]) => ({
              value,
              label,
            })
          ),
        },

        {
          name: "numerasi",
          label: "Skor Numerasi (ASPD)",
          type: "number",
        },
      ]}
    />

    {/* ================= MODAL ================= */}

    {selectedPrediction && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">

          <div className="flex items-center justify-between border-b p-5">
            <h2 className="text-lg font-bold">
              Detail Prediksi Machine Learning
            </h2>

            <button
              onClick={() => setSelectedPrediction(null)}
              className="text-2xl text-slate-400 hover:text-slate-700"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">

            <div className="grid grid-cols-2 gap-5">

              <div>
                <p className="text-xs text-slate-500">Nama</p>
                <p className="font-semibold">
                  {selectedPrediction.student.nama}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">NISN</p>
                <p className="font-semibold">
                  {selectedPrediction.student.nisn}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Kelas</p>
                <p className="font-semibold">
                  {selectedPrediction.student.kelas || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-semibold">
                  {STUDENT_STATUS_LABEL[selectedPrediction.student.status]}
                </p>
              </div>

            </div>

            <hr />

            {selectedPrediction.prediction ? (
              <div className="grid grid-cols-2 gap-5">

                <div>
                  <p className="text-xs text-slate-500">
                    Kategori Risiko
                  </p>

                  <p className="text-lg font-bold text-red-600">
                    {selectedPrediction.prediction.riskCategory}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Probabilitas
                  </p>

                  <p className="text-lg font-bold">
                    {selectedPrediction.prediction.probabilitas.toFixed(2)}%
                  </p>
                </div>

              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-center text-slate-500">
                Siswa ini belum memiliki hasil prediksi Machine Learning.
              </div>
            )}

          </div>

          <div className="flex justify-end border-t p-5">
            <button
              onClick={() => setSelectedPrediction(null)}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    )}
    </>
  );
}