import { schoolList } from "./schoolList";

export interface Student {
  id: number;
  nisn: string;
  nama: string;
  kelas: string;
  literasi: number;
  numerasi: number;
  sains: number;
  risiko: number;
}

export interface SchoolDetail {
  schoolId: number;
  students: Student[];
}

const kelasList = ["7A", "7B", "7C", "8A", "8B", "8C", "9A", "9B"];

export const schoolDetails: SchoolDetail[] = schoolList.map((school) => ({
  schoolId: school.id,

  students: Array.from(
    {
      length: Math.max(school.siswa, 20),
    },
    (_, index) => ({
      id: index + 1,

      nisn: `00${school.id}${String(index + 1).padStart(6, "0")}`,

      nama: `Siswa ${index + 1}`,

      kelas: kelasList[index % kelasList.length],

      literasi: Math.floor(Math.random() * 100),

      numerasi: Math.floor(Math.random() * 100),

      sains: Math.floor(Math.random() * 100),

      risiko: Math.floor(Math.random() * 100),
    }),
  ),
}));
