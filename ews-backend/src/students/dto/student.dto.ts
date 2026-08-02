import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { PaginationDto } from '../../common/pagination.dto';

// Mastering data: NIK selalu 16 digit angka, NISN selalu 10 digit angka (standar
// Dapodik/Dukcapil). Divalidasi di sini (bukan hanya di frontend) supaya data yang
// masuk lewat API mana pun (form, bulk-upload, dsb.) tetap konsisten.
const NIK_REGEX = /^\d{16}$/;
const NIK_MESSAGE = 'NIK harus tepat 16 digit angka';
const NISN_REGEX = /^\d{10}$/;
const NISN_MESSAGE = 'NISN harus tepat 10 digit angka';

// `status`: filter persis (mis. "PUTUS_SEKOLAH" untuk halaman Siswa DO).
// `excludeStatus`: filter tidak-sama-dengan (dipakai daftar siswa aktif untuk menyembunyikan DO).
export class FindStudentsQueryDto extends PaginationDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() excludeStatus?: string;
}

// Field mastering data (Excel "Data Siswa Aktif") — dipakai bersama oleh Create & Update.
// Semua opsional supaya input manual (tanpa Excel) tetap ringan seperti sebelumnya.
class MasteringDataFields {
  @IsOptional() @IsString() tempatLahir?: string;
  @IsOptional() @IsInt() agamaId?: number;
  @IsOptional() @IsInt() kebutuhanKhususId?: number;
  @IsOptional() @IsString() kebutuhanKhususKeterangan?: string;

  @IsOptional() @IsString() alamatJalan?: string;
  @IsOptional() @IsString() rt?: string;
  @IsOptional() @IsString() rw?: string;
  @IsOptional() @IsString() namaDusun?: string;
  @IsOptional() @IsString() desaKelurahan?: string;
  @IsOptional() @IsString() kecamatan?: string;
  @IsOptional() @IsString() kabupaten?: string;
  @IsOptional() @IsString() provinsi?: string;

  @IsOptional() @IsInt() jenisTinggalId?: number;
  @IsOptional() @IsInt() alatTransportasiId?: number;

  @IsOptional() @Matches(NIK_REGEX, { message: `Ayah: ${NIK_MESSAGE}` }) nikAyah?: string;
  @IsOptional() @Matches(NIK_REGEX, { message: `Ibu: ${NIK_MESSAGE}` }) nikIbu?: string;
  @IsOptional() @IsInt() anakKeberapa?: number;
  @IsOptional() penerimaKps?: boolean;
  @IsOptional() @IsString() noKps?: string;
  @IsOptional() layakPip?: boolean;
  @IsOptional() penerimaKip?: boolean;
  @IsOptional() @IsString() noKip?: string;
  @IsOptional() @IsString() namaKip?: string;
  @IsOptional() @IsString() noKks?: string;
  @IsOptional() @IsString() regAktaLahir?: string;

  @IsOptional() @IsString() namaAyah?: string;
  @IsOptional() @IsInt() tahunLahirAyah?: number;
  @IsOptional() @IsInt() pendidikanAyahId?: number;
  @IsOptional() @IsInt() pekerjaanAyahId?: number;
  @IsOptional() @IsInt() penghasilanAyahId?: number;
  @IsOptional() @IsInt() kebutuhanKhususAyahId?: number;

  @IsOptional() @IsString() namaIbu?: string;
  @IsOptional() @IsInt() tahunLahirIbu?: number;
  @IsOptional() @IsInt() pendidikanIbuId?: number;
  @IsOptional() @IsInt() pekerjaanIbuId?: number;
  @IsOptional() @IsInt() penghasilanIbuId?: number;
  @IsOptional() @IsInt() kebutuhanKhususIbuId?: number;
}

export class CreateStudentDto extends MasteringDataFields {
  @IsNotEmpty() @Matches(NISN_REGEX, { message: NISN_MESSAGE }) nisn: string;
  @IsNotEmpty() @Matches(NIK_REGEX, { message: NIK_MESSAGE }) nik: string;
  @IsNotEmpty() nama: string;
  @IsOptional() @IsDateString() tanggalLahir?: string;
  @IsOptional() jenisKelamin?: string; // 'L' | 'P'
  @IsOptional() kelas?: string;
  @IsOptional() alamat?: string;
  @IsOptional() namaOrtu?: string;
  @IsOptional() kontakOrtu?: string;
  @IsOptional() schoolId?: number;

  // Fitur prediktor model ML (docs/CODEBOOK.md, repo ewsDropOut) — opsional saat
  // pembuatan data siswa, bisa dilengkapi belakangan lewat update atau bulk-upload.
  // Jika pendidikanAyahId/IbuId & penghasilanAyahId/IbuId (mastering data) diisi,
  // nilai berikut disinkronkan otomatis dari master (lih. StudentsService) — namun
  // tetap bisa diisi manual langsung seperti sebelumnya.
  @IsOptional() @IsNumber() @Min(0) @Max(100) numerasi?: number;
  @IsOptional() @IsInt() @Min(0) @Max(8) kodePendidikanAyah?: number;
  @IsOptional() @IsInt() @Min(0) @Max(8) kodePendidikanIbu?: number;
  @IsOptional() @IsInt() @Min(0) @Max(6) kodePenghasilanAyah?: number;
  @IsOptional() @IsInt() @Min(0) @Max(6) kodePenghasilanIbu?: number;
}

export class UpdateStudentDto extends MasteringDataFields {
  @IsOptional() nama?: string;
  @IsOptional() @IsDateString() tanggalLahir?: string;
  @IsOptional() jenisKelamin?: string;
  @IsOptional() kelas?: string;
  @IsOptional() alamat?: string;
  @IsOptional() namaOrtu?: string;
  @IsOptional() kontakOrtu?: string;
  @IsOptional() schoolId?: number;
  @IsOptional() @IsString() status?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(100) numerasi?: number;
  @IsOptional() @IsInt() @Min(0) @Max(8) kodePendidikanAyah?: number;
  @IsOptional() @IsInt() @Min(0) @Max(8) kodePendidikanIbu?: number;
  @IsOptional() @IsInt() @Min(0) @Max(6) kodePenghasilanAyah?: number;
  @IsOptional() @IsInt() @Min(0) @Max(6) kodePenghasilanIbu?: number;
}
