import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ExternalLink } from "lucide-react";

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
  const navigate = useNavigate();
  const canWrite = role === "ADMIN" || role === "SEKOLAH";

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
    <MasterCrudPage<Student>
      title="Daftar Siswa Aktif"
      description="Data induk siswa aktif lintas sekolah"
      icon={GraduationCap}
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
          render: (r) =>
            role === "SEKOLAH" ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/predictions?studentId=${r.id}`);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                Lihat <ExternalLink size={12} />
              </button>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            ),
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
  );
}
