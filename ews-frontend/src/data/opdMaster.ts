export interface OPD {
  id: string;
  nama: string;
  deskripsi: string;
  icon: string;
}

export const opdMaster: OPD[] = [
  {
    id: "disdik",
    nama: "Dinas Pendidikan",
    deskripsi: "Pendampingan pendidikan dan sekolah",
    icon: "📚",
  },
  {
    id: "dinsos",
    nama: "Dinas Sosial",
    deskripsi: "Bantuan sosial dan ekonomi",
    icon: "❤️",
  },
  {
    id: "dp3ap2kb",
    nama: "DP3AP2KB",
    deskripsi: "Perlindungan anak dan keluarga",
    icon: "👨‍👩‍👧",
  },
  {
    id: "dinkes",
    nama: "Dinas Kesehatan",
    deskripsi: "Layanan kesehatan",
    icon: "🩺",
  },
  {
    id: "disnaker",
    nama: "Disnaker",
    deskripsi: "Penanganan anak bekerja",
    icon: "👷",
  },
  {
    id: "dukcapil",
    nama: "Dukcapil",
    deskripsi: "Administrasi kependudukan",
    icon: "🪪",
  },
];
