export const riskReference = {
  Rendah: {
    Keluarga: [
      {
        indikator: "Orang tua kurang mendukung pendidikan",
        opd: "PUSPAGA",
        intervensi: "Edukasi parenting",
      },
      {
        indikator: "Komunikasi keluarga kurang baik",
        opd: "PUSPAGA",
        intervensi: "Konseling keluarga",
      },
      {
        indikator: "Pengawasan belajar rendah",
        opd: "Sekolah",
        intervensi: "Home visit",
      },
    ],

    Ekonomi: [
      {
        indikator: "Keluarga rentan miskin",
        opd: "Dinas Sosial",
        intervensi: "Verifikasi bantuan",
      },
    ],

    Sosial: [
      {
        indikator: "Anak mulai bekerja ringan",
        opd: "Kalurahan",
        intervensi: "Pendampingan sosial",
      },
    ],

    Sekolah: [
      {
        indikator: "Motivasi belajar rendah",
        opd: "BK",
        intervensi: "Konseling",
      },
    ],
  },

  Sedang: {
    Keluarga: [
      {
        indikator: "Pengawasan orang tua rendah",
        opd: "PUSPAGA",
        intervensi: "Konseling + Home Visit",
      },
    ],

    Ekonomi: [
      {
        indikator: "Kesulitan biaya pendidikan",
        opd: "Dinas Sosial",
        intervensi: "Bantuan pendidikan",
      },
    ],
  },

  Tinggi: {
    Keluarga: [
      {
        indikator: "Yatim/piatu tanpa pengasuh",
        opd: "Dinas Sosial",
        intervensi: "Asesmen",
      },
      {
        indikator: "Orang tua menolak sekolah",
        opd: "PUSPAGA",
        intervensi: "Mediasi keluarga",
      },
    ],

    Sekolah: [
      {
        indikator: "Drop Out",
        opd: "Dinas Pendidikan",
        intervensi: "Reintegrasi sekolah",
      },
    ],
  },
};
