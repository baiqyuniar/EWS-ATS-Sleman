// src/data/interventionCases.ts

export interface InterventionCase {
  id: number;

  studentId: number;

  nisn: string;

  studentName: string;

  schoolName: string;

  riskScore: number;

  factor: string;

  opd: string[];

  status: "baru" | "proses" | "selesai";

  createdAt: string;
}

export const interventionCases: InterventionCase[] = [
  {
    id: 1,

    studentId: 101,

    nisn: "0011223344",

    studentName: "Budi Santoso",

    schoolName: "SMPN 1 Sleman",

    riskScore: 89,

    factor: "Kemiskinan",

    opd: ["Dinas Sosial"],

    status: "baru",

    createdAt: "2026-06-01",
  },

  {
    id: 2,

    studentId: 102,

    nisn: "0011223355",

    studentName: "Siti Aminah",

    schoolName: "SMPN 2 Sleman",

    riskScore: 78,

    factor: "Kriminalitas",

    opd: ["DP3AP2KB"],

    status: "proses",

    createdAt: "2026-06-02",
  },

  {
    id: 3,

    studentId: 103,

    nisn: "0011223366",

    studentName: "Andi Saputra",

    schoolName: "SMAN 1 Sleman",

    riskScore: 52,

    factor: "Kehadiran",

    opd: ["Sekolah"],

    status: "selesai",

    createdAt: "2026-06-03",
  },

  {
    id: 4,

    studentId: 104,

    nisn: "0011223377",

    studentName: "Rina Kusuma",

    schoolName: "SMPN 3 Sleman",

    riskScore: 84,

    factor: "Kekerasan",

    opd: ["DP3AP2KB", "Dinas Sosial"],

    status: "proses",

    createdAt: "2026-06-04",
  },

  {
    id: 5,

    studentId: 105,

    nisn: "0011223388",

    studentName: "Ahmad Fauzi",

    schoolName: "SMKN 1 Sleman",

    riskScore: 91,

    factor: "Kesehatan",

    opd: ["Dinas Kesehatan"],

    status: "baru",

    createdAt: "2026-06-05",
  },
];

export function getRecommendedOPD(factor: string): string[] {
  const mapping: Record<string, string[]> = {
    Kemiskinan: ["Dinas Sosial"],

    Kriminalitas: ["DP3AP2KB"],

    Kekerasan: ["DP3AP2KB"],

    Disabilitas: ["Dinas Sosial"],

    Kehadiran: ["Sekolah"],

    Transportasi: ["Dinas Perhubungan"],

    Kesehatan: ["Dinas Kesehatan"],

    Prestasi: ["Dinas Pendidikan"],
  };

  return mapping[factor] || ["Dinas Pendidikan"];
}

export const opdList = [
  "Dinas Pendidikan",

  "Dinas Sosial",

  "DP3AP2KB",

  "Dinas Kesehatan",

  "Dinas Perhubungan",

  "Sekolah",
];
