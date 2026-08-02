import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";
import { encryptSensitive, blindIndex } from "../src/common/crypto.util";

const prisma = new PrismaClient();

// SECURITY: NIK disimpan terenkripsi (lihat src/common/crypto.util.ts) — seed data
// juga wajib melalui ini, bukan hanya jalur aplikasi (StudentsService), supaya tidak
// ada NIK plaintext yang masuk ke database lewat `npm run seed`.
function encryptNikFields<T extends { nik: string }>(row: T): T & { nikHash: string } {
  return { ...row, nik: encryptSensitive(row.nik), nikHash: blindIndex(row.nik) };
}

function loadJson<T>(fileName: string): T {
  const filePath = path.join(__dirname, "seed-data", fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function main() {
  console.log("Seeding EWS-APS Kabupaten Sleman...");

  // ---------------- Wilayah: 86 kalurahan / 17 kapanewon (data resmi Kab. Sleman) ----------------
  const wilayahData =
    loadJson<{ kapanewon: string; kalurahan: string }[]>("wilayah.json");
  await prisma.wilayah.createMany({ data: wilayahData, skipDuplicates: true });
  console.log(`Wilayah: ${wilayahData.length} kalurahan tersimpan.`);

  // ---------------- Sekolah: 889 sekolah se-Kabupaten Sleman (dari data Dapodik/referensi) ----------------
  const schoolsData = loadJson<
    {
      npsn: string;
      nama: string;
      jenjang: string;
      alamat: string;
      kapanewon: string;
      kalurahan: string;
    }[]
  >("schools.json");
  await prisma.school.createMany({ data: schoolsData, skipDuplicates: true });
  console.log(`Sekolah: ${schoolsData.length} sekolah tersimpan.`);

  // ---------------- Sulingjar: indikator mutu sekolah (Survei Lingkungan Belajar) ----------------
  // Sumber: Data_Sulingjar_Sleman.xlsx (Kemendikbud), dikonversi ke JSON dengan hanya
  // 4 indikator yang dipakai model ML final (aspd_num + tanpa_aspd gabungan — lihat
  // ews-ml-service/models/*_spec.json: D.18, D.1, D.2, D.6). Nilai Kurang/Sedang/Baik
  // pada file sumber sudah dikonversi ke 1/2/3 (docs/CODEBOOK.md repo ewsDropOut).
  // Field ini disimpan di level School (bukan Student) — karena mutu sekolah berlaku
  // untuk semua siswa di sekolah itu, seluruh siswa otomatis "mewarisi" nilai ini lewat
  // relasi Student.school saat fitur ML dibangun (lihat PredictionService.buildFeatures
  // di ews-backend).
  const sulingjarData = loadJson<
    {
      npsn: string;
      nama: string | null;
      sulingjarKesiapsiagaanBencana: number | null;
      sulingjarKualitasPembelajaran: number | null;
      sulingjarRefleksiGuru: number | null;
      sulingjarIklimKesetaraanGender: number | null;
    }[]
  >("sulingjar.json");

  let sulingjarUpdated = 0;
  for (const s of sulingjarData) {
    const result = await prisma.school.updateMany({
      where: { npsn: s.npsn },
      data: {
        sulingjarKesiapsiagaanBencana: s.sulingjarKesiapsiagaanBencana,
        sulingjarKualitasPembelajaran: s.sulingjarKualitasPembelajaran,
        sulingjarRefleksiGuru: s.sulingjarRefleksiGuru,
        sulingjarIklimKesetaraanGender: s.sulingjarIklimKesetaraanGender,
      },
    });
    sulingjarUpdated += result.count;
  }
  console.log(
    `Sulingjar: ${sulingjarUpdated} sekolah diperbarui dengan data mutu sekolah ` +
      `(dari ${sulingjarData.length} baris di sumber, dicocokkan lewat NPSN; sisanya ` +
      `tidak punya NPSN yang cocok di master sekolah — umumnya TK/PAUD di luar cakupan survei).`,
  );

  // ---------------- Faktor Anak Tidak Sekolah (23 kategori resmi) ----------------
  const riskFactorsData =
    loadJson<{ kode: string; nama: string; kategori: string }[]>(
      "risk-factors.json",
    );
  await prisma.riskFactor.createMany({
    data: riskFactorsData,
    skipDuplicates: true,
  });
  console.log(
    `Faktor Anak Tidak Sekolah: ${riskFactorsData.length} kategori tersimpan.`,
  );

  // ---------------- Mastering Data Siswa (dari Data Siswa Aktif / Dapodik) ----------------
  // Additive & idempotent (skipDuplicates) — aman dijalankan berulang, tidak menghapus data lama.
  const agamaData = loadJson<{ nama: string }[]>("agama.json");
  await prisma.agama.createMany({ data: agamaData, skipDuplicates: true });
  console.log(`Master Agama: ${agamaData.length} data tersimpan.`);

  const kebutuhanKhususData = loadJson<{ kode: string | null; nama: string }[]>(
    "kebutuhan-khusus.json",
  );
  await prisma.kebutuhanKhusus.createMany({
    data: kebutuhanKhususData,
    skipDuplicates: true,
  });
  console.log(
    `Master Kebutuhan Khusus: ${kebutuhanKhususData.length} data tersimpan.`,
  );

  const jenisTinggalData = loadJson<{ nama: string }[]>("jenis-tinggal.json");
  await prisma.jenisTinggal.createMany({
    data: jenisTinggalData,
    skipDuplicates: true,
  });
  console.log(
    `Master Jenis Tinggal: ${jenisTinggalData.length} data tersimpan.`,
  );

  const alatTransportasiData = loadJson<{ nama: string }[]>(
    "alat-transportasi.json",
  );
  await prisma.alatTransportasi.createMany({
    data: alatTransportasiData,
    skipDuplicates: true,
  });
  console.log(
    `Master Alat Transportasi: ${alatTransportasiData.length} data tersimpan.`,
  );

  const pekerjaanOrtuData = loadJson<{ nama: string }[]>("pekerjaan-ortu.json");
  await prisma.pekerjaanOrtu.createMany({
    data: pekerjaanOrtuData,
    skipDuplicates: true,
  });
  console.log(
    `Master Pekerjaan Ortu: ${pekerjaanOrtuData.length} data tersimpan.`,
  );

  const pendidikanOrtuData = loadJson<{ nama: string; kodeOrdinal: number }[]>(
    "pendidikan-ortu.json",
  );
  await prisma.pendidikanOrtu.createMany({
    data: pendidikanOrtuData,
    skipDuplicates: true,
  });
  console.log(
    `Master Pendidikan Ortu: ${pendidikanOrtuData.length} data tersimpan.`,
  );

  const penghasilanOrtuData = loadJson<{ nama: string; kodeOrdinal: number }[]>(
    "penghasilan-ortu.json",
  );
  await prisma.penghasilanOrtu.createMany({
    data: penghasilanOrtuData,
    skipDuplicates: true,
  });
  console.log(
    `Master Penghasilan Ortu: ${penghasilanOrtuData.length} data tersimpan.`,
  );

  // ---------------- OPD ----------------
  const opdData = [
    {
      kode: "DINSOS",
      nama: "Dinas Sosial Kabupaten Sleman",
      jenisLayanan: "Ekonomi/Sosial",
    },
    {
      kode: "DISNAKER",
      nama: "Dinas Tenaga Kerja Kabupaten Sleman",
      jenisLayanan: "Ekonomi",
    },
    {
      kode: "DINKES",
      nama: "Dinas Kesehatan Kabupaten Sleman",
      jenisLayanan: "Kesehatan",
    },
    {
      kode: "DP3AP2KB",
      nama: "Dinas Pemberdayaan Perempuan, Perlindungan Anak, dan KB",
      jenisLayanan: "Sosial/Keluarga",
    },
  ];
  const opds: any[] = [];
  for (const o of opdData) {
    opds.push(
      await prisma.opd.upsert({
        where: { kode: o.kode },
        update: {},
        create: o,
      }),
    );
  }

  // ---------------- Jenis Intervensi ----------------
  await prisma.interventionType.createMany({
    data: [
      { kode: "INT-BEASISWA", nama: "Bantuan Beasiswa", opdId: opds[0].id },
      {
        kode: "INT-PELATIHAN",
        nama: "Pelatihan Kerja Orang Tua",
        opdId: opds[1].id,
      },
      {
        kode: "INT-KESEHATAN",
        nama: "Layanan Kesehatan Gratis",
        opdId: opds[2].id,
      },
      { kode: "INT-KONSELING", nama: "Konseling Keluarga", opdId: opds[3].id },
    ],
    skipDuplicates: true,
  });

  // ---------------- Ambil sekolah nyata untuk data demo siswa ----------------
  const demoSchoolSekolah = await prisma.school.findFirst({
    where: { npsn: "20401001" },
  }); // SD Negeri Sambiroto 1 (Kalasan)
  const demoSchoolSiswa2 = await prisma.school.findFirst({
    where: { npsn: "20401092" },
  }); // SMP Negeri 2 Kalasan

  if (!demoSchoolSekolah || !demoSchoolSiswa2) {
    throw new Error(
      "Data sekolah demo tidak ditemukan — cek isi seed-data/schools.json",
    );
  }

  // ---------------- Users (Admin, Dinas: satu akun demo. OPD, Kapanewon & Sekolah:
  // satu akun untuk TIAP OPD (4), TIAP kapanewon (17), dan TIAP sekolah (889)) ----------------
  const hash = (pw: string) => bcrypt.hash(pw, 10);
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

  await prisma.user.upsert({
    where: { email: "admin@sleman.go.id" },
    update: {},
    create: {
      name: "Administrator Sistem",
      email: "admin@sleman.go.id",
      passwordHash: await hash("admin123"),
      role: UserRole.ADMIN,
    },
  });

  // ---- OPD: satu user untuk masing-masing OPD (bukan cuma satu akun demo) ----
  // Perlu 1 akun per OPD supaya alur rujukan multi-OPD bisa diuji end-to-end
  // (tiap OPD login sendiri-sendiri untuk verifikasi/isi intervensi rujukannya).
  const opdPasswordHash = await hash("opd123");
  const opdUsers = opds.map((o) => ({
    name: `Petugas ${o.nama}`,
    email: `opd.${slugify(o.kode)}@sleman.go.id`,
    passwordHash: opdPasswordHash,
    role: UserRole.OPD,
    opdId: o.id,
  }));
  await prisma.user.createMany({ data: opdUsers, skipDuplicates: true });
  console.log(
    `Users OPD: ${opdUsers.length} akun tersimpan (1 per OPD, password: opd123).`,
  );

  await prisma.user.upsert({
    where: { email: "dinas@sleman.go.id" },
    update: {},
    create: {
      name: "Petugas Dinas Pendidikan",
      email: "dinas@sleman.go.id",
      passwordHash: await hash("dinas123"),
      role: UserRole.DINAS_PENDIDIKAN,
    },
  });

  // ---- Kapanewon: satu user untuk masing-masing 17 kapanewon ----
  const allWilayah = await prisma.wilayah.findMany();
  const wilayahIdByKapanewon = new Map<string, number>();
  for (const w of allWilayah) {
    if (!wilayahIdByKapanewon.has(w.kapanewon))
      wilayahIdByKapanewon.set(w.kapanewon, w.id);
  }

  const kapanewonPasswordHash = await hash("kapanewon123");
  const kapanewonUsers = Array.from(wilayahIdByKapanewon.entries()).map(
    ([kapanewon, wilayahId]) => ({
      name: `Petugas Kapanewon ${kapanewon}`,
      email: `kapanewon.${slugify(kapanewon)}@sleman.go.id`,
      passwordHash: kapanewonPasswordHash,
      role: UserRole.KAPANEWON,
      wilayahId,
    }),
  );
  await prisma.user.createMany({ data: kapanewonUsers, skipDuplicates: true });
  console.log(
    `Users Kapanewon: ${kapanewonUsers.length} akun tersimpan (1 per kapanewon).`,
  );

  // ---- Sekolah: satu user untuk masing-masing 889 sekolah ----
  const allSchools = await prisma.school.findMany();
  const sekolahPasswordHash = await hash("sekolah123");
  const sekolahUsers = allSchools.map((s) => ({
    name: `Operator ${s.nama}`,
    email: `sekolah.${s.npsn}@sleman.go.id`,
    passwordHash: sekolahPasswordHash,
    role: UserRole.SEKOLAH,
    schoolId: s.id,
  }));
  await prisma.user.createMany({ data: sekolahUsers, skipDuplicates: true });
  console.log(
    `Users Sekolah: ${sekolahUsers.length} akun tersimpan (1 per sekolah).`,
  );

  const demoWilayahDepok = wilayahIdByKapanewon.get("Depok");
  const demoKapanewonEmail = demoWilayahDepok
    ? `kapanewon.${slugify("Depok")}@sleman.go.id`
    : null;
  const demoSekolahEmail = `sekolah.${demoSchoolSekolah.npsn}@sleman.go.id`;

  // ---------------- Contoh Siswa (dikaitkan ke sekolah nyata di atas) ----------------
  await prisma.student.createMany({
    data: [
      {
        nisn: "0051234567",
        nik: "3404011234560001",
        nama: "Ahmad Fauzi",
        jenisKelamin: "L",
        kelas: "6",
        schoolId: demoSchoolSekolah.id,
        numerasi: 55,
        kodePendidikanAyah: 2,
        kodePendidikanIbu: 2,
        kodePenghasilanAyah: 1,
        kodePenghasilanIbu: 0,
      },
      {
        nisn: "0051234568",
        nik: "3404011234560002",
        nama: "Siti Rahma",
        jenisKelamin: "P",
        kelas: "8",
        schoolId: demoSchoolSiswa2.id,
        numerasi: 78,
        kodePendidikanAyah: 5,
        kodePendidikanIbu: 4,
        kodePenghasilanAyah: 4,
        kodePenghasilanIbu: 2,
      },
    ].map(encryptNikFields),
    skipDuplicates: true,
  });

  // ---------------- Siswa Putus Sekolah (DO) — data riil Dapodik/ATS Kab. Sleman ----------------
  // Sumber: "16_Apr_26_-_Olah_Data_siswa_do_dan_ltm_sleman" (kolom alasan_approval_id dipetakan
  // ke RiskFactor.kode = `k_${alasan_approval_id}`; 0 berarti tidak ada alasan tercatat).
  interface DoStudentSeed {
    nisn: string;
    nik: string;
    nama: string;
    jenisKelamin: string | null;
    tanggalLahir: string | null;
    namaOrtu: string | null;
    alamat: string | null;
    kelas: string | null;
    npsn: string | null;
    alasanDoRiskFactorKode: string | null;
    alasanDoKeterangan: string | null;
  }
  const doStudentsData = loadJson<DoStudentSeed[]>("students-do.json");

  const schoolIdByNpsn = new Map<string, number>();
  for (const s of allSchools) schoolIdByNpsn.set(s.npsn, s.id);

  const riskFactorIdByKode = new Map<string, number>();
  for (const rf of await prisma.riskFactor.findMany()) {
    riskFactorIdByKode.set(rf.kode, rf.id);
  }

  const doStudentsToCreate = doStudentsData.map((r) => ({
    nisn: r.nisn,
    nik: r.nik,
    nama: r.nama,
    jenisKelamin: r.jenisKelamin ?? undefined,
    tanggalLahir: r.tanggalLahir ? new Date(r.tanggalLahir) : undefined,
    namaOrtu: r.namaOrtu ?? undefined,
    alamat: r.alamat ?? undefined,
    kelas: r.kelas ?? undefined,
    schoolId: r.npsn ? schoolIdByNpsn.get(r.npsn) : undefined,
    status: "PUTUS_SEKOLAH" as const,
    alasanDoRiskFactorId: r.alasanDoRiskFactorKode
      ? riskFactorIdByKode.get(r.alasanDoRiskFactorKode)
      : undefined,
    alasanDoKeterangan: r.alasanDoKeterangan ?? undefined,
  }));

  await prisma.student.createMany({
    data: doStudentsToCreate.map(encryptNikFields),
    skipDuplicates: true, // NISN/NIK unik — lewati bila sudah ada (idempotent re-seed)
  });
  const withSchool = doStudentsToCreate.filter((d) => d.schoolId).length;
  console.log(
    `Siswa Putus Sekolah (DO): ${doStudentsToCreate.length} siswa tersimpan ` +
      `(${withSchool} terhubung ke sekolah, ${doStudentsToCreate.length - withSchool} tanpa schoolId — ` +
      `umumnya SMA/SMK kewenangan provinsi, di luar seed-data/schools.json).`,
  );

  // ---------------- Siswa Aktif — mastering dari "Data Siswa Aktif" (Dapodik, Kec. Gamping) ----------------
  interface StudentAktifSeed {
    npsn: string;
    nisn: string;
    nik: string;
    nama: string | null;
    jenisKelamin: string | null;
    tanggalLahir: string | null;
    tempatLahir: string | null;
    kelas: string | null;
    agamaNama: string | null;
    kebutuhanKhususNama: string | null;
    alamatJalan: string | null;
    rt: string | null;
    rw: string | null;
    namaDusun: string | null;
    desaKelurahan: string | null;
    kecamatan: string | null;
    kabupaten: string | null;
    provinsi: string | null;
    jenisTinggalNama: string | null;
    alatTransportasiNama: string | null;
    nikAyah: string | null;
    nikIbu: string | null;
    anakKeberapa: number | null;
    penerimaKps: boolean | null;
    noKps: string | null;
    layakPip: boolean | null;
    penerimaKip: boolean | null;
    noKip: string | null;
    namaKip: string | null;
    noKks: string | null;
    regAktaLahir: string | null;
    namaAyah: string | null;
    tahunLahirAyah: number | null;
    pendidikanAyahNama: string | null;
    pekerjaanAyahNama: string | null;
    penghasilanAyahNama: string | null;
    kebutuhanKhususAyahNama: string | null;
    namaIbu: string | null;
    tahunLahirIbu: number | null;
    pendidikanIbuNama: string | null;
    pekerjaanIbuNama: string | null;
    penghasilanIbuNama: string | null;
    kebutuhanKhususIbuNama: string | null;
    namaOrtu: string | null;
  }
  const studentsAktifData = loadJson<StudentAktifSeed[]>("students-aktif.json");

  // Lookup maps nama -> id untuk semua master mastering data
  const agamaIdByNama = new Map(
    (await prisma.agama.findMany()).map((x) => [x.nama, x.id]),
  );
  const kebutuhanKhususIdByNama = new Map(
    (await prisma.kebutuhanKhusus.findMany()).map((x) => [x.nama, x.id]),
  );
  const jenisTinggalIdByNama = new Map(
    (await prisma.jenisTinggal.findMany()).map((x) => [x.nama, x.id]),
  );
  const alatTransportasiIdByNama = new Map(
    (await prisma.alatTransportasi.findMany()).map((x) => [x.nama, x.id]),
  );
  const pekerjaanOrtuIdByNama = new Map(
    (await prisma.pekerjaanOrtu.findMany()).map((x) => [x.nama, x.id]),
  );
  const pendidikanOrtuByNama = new Map(
    (await prisma.pendidikanOrtu.findMany()).map((x) => [x.nama, x]),
  );
  const penghasilanOrtuByNama = new Map(
    (await prisma.penghasilanOrtu.findMany()).map((x) => [x.nama, x]),
  );

  let skippedNoSchool = 0;
  const studentsAktifToCreate = studentsAktifData.map((r) => {
    const schoolId = schoolIdByNpsn.get(r.npsn);
    if (!schoolId) skippedNoSchool++;
    const pendAyah = r.pendidikanAyahNama
      ? pendidikanOrtuByNama.get(r.pendidikanAyahNama)
      : undefined;
    const pendIbu = r.pendidikanIbuNama
      ? pendidikanOrtuByNama.get(r.pendidikanIbuNama)
      : undefined;
    const pengAyah = r.penghasilanAyahNama
      ? penghasilanOrtuByNama.get(r.penghasilanAyahNama)
      : undefined;
    const pengIbu = r.penghasilanIbuNama
      ? penghasilanOrtuByNama.get(r.penghasilanIbuNama)
      : undefined;

    return {
      nisn: r.nisn,
      nik: r.nik,
      nama: r.nama ?? "-",
      jenisKelamin: r.jenisKelamin ?? undefined,
      tanggalLahir: r.tanggalLahir ? new Date(r.tanggalLahir) : undefined,
      tempatLahir: r.tempatLahir ?? undefined,
      kelas: r.kelas ?? undefined,
      alamat: r.alamatJalan ?? undefined,
      namaOrtu: r.namaOrtu ?? undefined,
      status: "AKTIF" as const,
      schoolId,

      agamaId: r.agamaNama ? agamaIdByNama.get(r.agamaNama) : undefined,
      kebutuhanKhususId: r.kebutuhanKhususNama
        ? kebutuhanKhususIdByNama.get(r.kebutuhanKhususNama)
        : undefined,

      alamatJalan: r.alamatJalan ?? undefined,
      rt: r.rt ?? undefined,
      rw: r.rw ?? undefined,
      namaDusun: r.namaDusun ?? undefined,
      desaKelurahan: r.desaKelurahan ?? undefined,
      kecamatan: r.kecamatan ?? undefined,
      kabupaten: r.kabupaten ?? undefined,
      provinsi: r.provinsi ?? undefined,

      jenisTinggalId: r.jenisTinggalNama
        ? jenisTinggalIdByNama.get(r.jenisTinggalNama)
        : undefined,
      alatTransportasiId: r.alatTransportasiNama
        ? alatTransportasiIdByNama.get(r.alatTransportasiNama)
        : undefined,

      nikAyah: r.nikAyah ?? undefined,
      nikIbu: r.nikIbu ?? undefined,
      anakKeberapa: r.anakKeberapa ?? undefined,
      penerimaKps: r.penerimaKps ?? undefined,
      noKps: r.noKps ?? undefined,
      layakPip: r.layakPip ?? undefined,
      penerimaKip: r.penerimaKip ?? undefined,
      noKip: r.noKip ?? undefined,
      namaKip: r.namaKip ?? undefined,
      noKks: r.noKks ?? undefined,
      regAktaLahir: r.regAktaLahir ?? undefined,

      namaAyah: r.namaAyah ?? undefined,
      tahunLahirAyah: r.tahunLahirAyah ?? undefined,
      pendidikanAyahId: pendAyah?.id,
      pekerjaanAyahId: r.pekerjaanAyahNama
        ? pekerjaanOrtuIdByNama.get(r.pekerjaanAyahNama)
        : undefined,
      penghasilanAyahId: pengAyah?.id,
      kebutuhanKhususAyahId: r.kebutuhanKhususAyahNama
        ? kebutuhanKhususIdByNama.get(r.kebutuhanKhususAyahNama)
        : undefined,
      // Sinkron otomatis ke fitur ML lama (ordinal), sama seperti StudentsService.syncOrdinalCodes
      kodePendidikanAyah: pendAyah?.kodeOrdinal,
      kodePenghasilanAyah: pengAyah?.kodeOrdinal,

      namaIbu: r.namaIbu ?? undefined,
      tahunLahirIbu: r.tahunLahirIbu ?? undefined,
      pendidikanIbuId: pendIbu?.id,
      pekerjaanIbuId: r.pekerjaanIbuNama
        ? pekerjaanOrtuIdByNama.get(r.pekerjaanIbuNama)
        : undefined,
      penghasilanIbuId: pengIbu?.id,
      kebutuhanKhususIbuId: r.kebutuhanKhususIbuNama
        ? kebutuhanKhususIdByNama.get(r.kebutuhanKhususIbuNama)
        : undefined,
      kodePendidikanIbu: pendIbu?.kodeOrdinal,
      kodePenghasilanIbu: pengIbu?.kodeOrdinal,
    };
  });
  // BR: siswa tanpa sekolah valid tetap disimpan (schoolId undefined) supaya data tidak hilang,
  // hanya dicatat di log untuk ditindaklanjuti Admin.
  await prisma.student.createMany({
    data: studentsAktifToCreate.map(encryptNikFields),
    skipDuplicates: true, // NISN/NIK unik — idempotent re-seed
  });
  console.log(
    `Siswa Aktif (Data Siswa Aktif / Dapodik): ${studentsAktifToCreate.length} siswa tersimpan ` +
      `(${skippedNoSchool} tanpa schoolId — npsn tidak ditemukan di master sekolah).`,
  );

  console.log("Seed selesai.");
  console.log("Login demo:");
  console.log("  admin@sleman.go.id / admin123");
  console.log("  opd@sleman.go.id / opd123");
  console.log("  dinas@sleman.go.id / dinas123");
  console.log("");
  console.log(
    `  Kapanewon: 1 akun per kapanewon (17 akun), password sama: kapanewon123`,
  );
  console.log(`    contoh -> ${demoKapanewonEmail} / kapanewon123`);
  console.log(
    `    pola email: kapanewon.<nama-kapanewon-slug>@sleman.go.id (mis. kapanewon.ngaglik@sleman.go.id)`,
  );
  console.log("");
  console.log(
    `  Sekolah: 1 akun per sekolah (889 akun), password sama: sekolah123`,
  );
  console.log(`    contoh -> ${demoSekolahEmail} / sekolah123`);
  console.log(`    pola email: sekolah.<npsn>@sleman.go.id`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
