export interface School {
  id: number;
  npsn: string;
  nama: string;
  kepanewon: string;
  siswa: number;
  berisiko: number;
}

export const schoolList: School[] = Array.from({ length: 260 }, (_, index) => ({
  id: index + 1,
  npsn: `2040${String(index + 1).padStart(5, "0")}`,
  nama: `Sekolah ${index + 1}`,
  kepanewon: ["Godean", "Mlati", "Depok", "Ngaglik", "Kalasan", "Prambanan"][
    index % 6
  ],
  siswa: Math.floor(Math.random() * 500),
  berisiko: Math.floor(Math.random() * 100),
}));
