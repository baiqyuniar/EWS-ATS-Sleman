import { Printer, X, FileText } from "lucide-react";
import type { Case, HomeVisitResult } from "../../types/api";
import logoSleman from "../../assets/logo-sleman.png";

const HOME_VISIT_LABEL: Record<HomeVisitResult, string> = {
  KEMBALI_SEKOLAH: "Kembali Bersekolah (Berhasil)",
  TIDAK_KEMBALI: "Belum/Tidak Kembali Bersekolah",
  BELUM_SELESAI: "Belum Selesai (Perlu Kunjungan Lanjutan)",
};

interface Props {
  kase: Case;
  onClose: () => void;
}

export default function CasePdfReportModal({ kase, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const isResolved =
    kase.status === "SELESAI_PENCEGAHAN" || kase.status === "CLOSED_CASE";

  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      {/* Container Preview Dialog (Hidden saat print asli dijalankan) */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto print:max-w-none print:w-full print:h-auto print:max-h-none print:shadow-none print:rounded-none print:m-0">
        {/* Top Action Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Laporan Kasus: {kase.nomorKasus}
              </h3>
              <p className="text-xs text-slate-500">
                Pratinjau Dokumen Resmi Penanganan Siswa EWS-APS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              <Printer size={15} /> Cetak / Unduh PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Area */}
        <div className="overflow-y-auto p-6 md:p-10 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          {/* Halaman Kertas A4 Dokumen Resmi */}
          <div
            id="printable-case-report"
            className="bg-white mx-auto shadow-sm border border-slate-200 print:border-none print:shadow-none p-8 md:p-12 text-slate-900 text-xs leading-relaxed max-w-[210mm] min-h-[297mm] font-serif"
          >
            {/* ================= KOP SURAT RESMI ================= */}
            <div className="flex items-center gap-5 pb-3 border-b-2 border-slate-900">
              <img
                src={logoSleman}
                alt="Logo Sleman"
                className="w-20 h-20 object-contain shrink-0"
              />
              <div className="text-center flex-1">
                <h3 className="font-bold text-sm tracking-wider uppercase font-sans">
                  Pemerintah Kabupaten Sleman
                </h3>
                <h2 className="font-extrabold text-base tracking-wider uppercase font-sans text-slate-950">
                  Dinas Pendidikan
                </h2>
                <h4 className="font-bold text-xs tracking-wide uppercase font-sans text-blue-900">
                  Early Warning System Anak Putus Sekolah (EWS-APS)
                </h4>
                <p className="text-[10px] text-slate-600 font-sans mt-0.5">
                  Jl. Parasamya No. 1, Beran, Tridadi, Sleman, Daerah Istimewa Yogyakarta 55511
                </p>
                <p className="text-[10px] text-slate-600 font-sans">
                  Laman: https://gandheng-ats.slemankab.go.id &middot; Email: disdik@slemankab.go.id
                </p>
              </div>
            </div>
            {/* Garis Ganda Kop Surat */}
            <div className="border-b border-slate-900 mt-0.5 mb-5"></div>

            {/* ================= JUDUL LAPORAN ================= */}
            <div className="text-center mb-6">
              <h1 className="text-sm font-extrabold uppercase tracking-wide underline font-sans text-slate-950">
                Lembar Laporan Riwayat Penanganan Kasus Siswa
              </h1>
              <p className="font-mono text-xs font-bold text-slate-700 mt-1">
                NOMOR REGISTER: {kase.nomorKasus}
              </p>
            </div>

            {/* ================= 1. IDENTITAS SISWA ================= */}
            <div className="mb-5">
              <h4 className="font-sans font-bold text-xs uppercase bg-slate-100 border-l-4 border-blue-700 px-2.5 py-1 mb-2 text-slate-800">
                I. Identitas Siswa
              </h4>
              <table className="w-full text-xs font-sans border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="w-40 py-1 text-slate-600 font-medium">Nama Lengkap Siswa</td>
                    <td className="w-4 py-1 text-center">:</td>
                    <td className="py-1 font-bold text-slate-900 uppercase">
                      {kase.student?.nama}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600 font-medium">NISN / NIK</td>
                    <td className="py-1 text-center">:</td>
                    <td className="py-1 font-mono">
                      {kase.student?.nisn || "-"} / {kase.student?.nik || "-"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600 font-medium">Asal Sekolah / Kelas</td>
                    <td className="py-1 text-center">:</td>
                    <td className="py-1 uppercase">
                      {kase.student?.school?.nama || "-"} (Kelas: {kase.student?.kelas || "-"})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600 font-medium">Jenis Kelamin / Tgl Lahir</td>
                    <td className="py-1 text-center">:</td>
                    <td className="py-1">
                      {kase.student?.jenisKelamin === "L" ? "Laki-laki" : kase.student?.jenisKelamin === "P" ? "Perempuan" : "-"}{" "}
                      / {" "}
                      {kase.student?.tanggalLahir
                        ? new Date(kase.student.tanggalLahir).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600 font-medium">Nama Orang Tua / Kontak</td>
                    <td className="py-1 text-center">:</td>
                    <td className="py-1">
                      {kase.student?.namaOrtu || "-"} ({kase.student?.kontakOrtu || "-"})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium">Alamat Tempat Tinggal</td>
                    <td className="py-1 text-center">:</td>
                    <td className="py-1">
                      {kase.student?.alamat || "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ================= 2. INFORMASI AWAL KASUS ================= */}
            <div className="mb-5">
              <h4 className="font-sans font-bold text-xs uppercase bg-slate-100 border-l-4 border-blue-700 px-2.5 py-1 mb-2 text-slate-800">
                II. Data &amp; Laporan Awal Kasus
              </h4>
              <table className="w-full text-xs font-sans border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="w-40 py-1 text-slate-600 font-medium">Sumber Laporan</td>
                    <td className="w-4 py-1 text-center">:</td>
                    <td className="py-1 font-semibold">
                      {kase.source === "PELAPORAN_SEKOLAH"
                        ? "Pelaporan oleh Pihak Sekolah (Pencegahan)"
                        : "Pengaduan oleh Masyarakat (Penanganan)"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600 font-medium">Tanggal Registrasi Kasus</td>
                    <td className="py-1 text-center">:</td>
                    <td className="py-1 font-mono">
                      {new Date(kase.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-600 font-medium">Status Penanganan Terakhir</td>
                    <td className="py-1 text-center">:</td>
                    <td className="py-1 font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-sans ${
                          isResolved
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {kase.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600 font-medium align-top">Isi / Kronologi Laporan</td>
                    <td className="py-1 text-center align-top">:</td>
                    <td className="py-1 italic text-slate-800 bg-slate-50 p-2 rounded">
                      "{kase.report?.isiLaporan || kase.catatan || "Tidak ada catatan pengantar"}"
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ================= 3. RIWAYAT TINDAKAN & INTERVENSI ================= */}
            <div className="mb-5">
              <h4 className="font-sans font-bold text-xs uppercase bg-slate-100 border-l-4 border-blue-700 px-2.5 py-1 mb-2 text-slate-800">
                III. Riwayat Tindakan &amp; Intervensi yang Dilakukan
              </h4>

              {/* 3.1 Verifikasi Data */}
              <div className="mb-3 pl-2 border-l-2 border-slate-300">
                <p className="font-sans font-bold text-slate-800 text-[11px]">
                  1. Verifikasi Data Siswa &amp; Identitas
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Status Verifikasi:{" "}
                  <span className="font-semibold text-slate-900">
                    {kase.report?.nikVerified
                      ? "Terverifikasi Valid di Pusdatin"
                      : kase.report?.validasiIdentitas
                      ? "Identitas Valid (Divalidasi Kapanewon)"
                      : "Belum Verifikasi Lengkap"}
                  </span>
                  {kase.report?.koordinasiSekolah
                    ? ` (Catatan Koordinasi: ${kase.report.koordinasiSekolah})`
                    : ""}
                </p>
              </div>

              {/* 3.2 Kunjungan Rumah (Home Visit) */}
              <div className="mb-3 pl-2 border-l-2 border-slate-300">
                <p className="font-sans font-bold text-slate-800 text-[11px] mb-1">
                  2. Riwayat Kunjungan ke Rumah (Home Visit)
                </p>
                {(kase.homeVisits?.length ?? 0) === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    Belum ada rekaman kunjungan rumah untuk kasus ini.
                  </p>
                ) : (
                  <table className="w-full text-[11px] font-sans border border-slate-200 mt-1">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="border border-slate-200 px-2 py-1 text-center w-10">Ke</th>
                        <th className="border border-slate-200 px-2 py-1 text-left w-24">Tanggal</th>
                        <th className="border border-slate-200 px-2 py-1 text-left w-36">Hasil Kunjungan</th>
                        <th className="border border-slate-200 px-2 py-1 text-left">Catatan / Temuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kase.homeVisits?.map((hv) => (
                        <tr key={hv.id} className="border-b border-slate-200">
                          <td className="border border-slate-200 px-2 py-1 text-center font-bold">
                            #{hv.visitNumber}
                          </td>
                          <td className="border border-slate-200 px-2 py-1">
                            {new Date(hv.tanggal).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="border border-slate-200 px-2 py-1 font-semibold">
                            {HOME_VISIT_LABEL[hv.hasil] || hv.hasil}
                          </td>
                          <td className="border border-slate-200 px-2 py-1">
                            {hv.catatan || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 3.3 Rujukan & Intervensi OPD */}
              <div className="mb-3 pl-2 border-l-2 border-slate-300">
                <p className="font-sans font-bold text-slate-800 text-[11px] mb-1">
                  3. Rujukan &amp; Tindakan Intervensi Lintas OPD
                </p>
                {(kase.referrals?.length ?? 0) === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    Kasus tidak memerlukan rujukan ke OPD (selesai di tingkat sekolah/kunjungan).
                  </p>
                ) : (
                  <div className="space-y-2 mt-1">
                    {kase.referrals?.map((ref, idx) => (
                      <div
                        key={ref.id}
                        className="border border-slate-200 rounded p-2 bg-slate-50 text-[11px] font-sans"
                      >
                        <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-1.5 font-bold">
                          <span>
                            Rujukan #{idx + 1}: {ref.opd?.nama || "OPD Terkait"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            Status: {ref.status}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-1">
                          Faktor Risiko:{" "}
                          <span className="font-semibold text-slate-800">
                            {ref.riskFactor?.nama || "-"}
                          </span>{" "}
                          (Tingkat: {ref.tingkatRisiko})
                        </p>
                        {ref.catatan && (
                          <p className="text-slate-600 mb-1.5 italic">
                            Catatan Rujukan: {ref.catatan}
                          </p>
                        )}

                        {/* Rincian Intervensi OPD */}
                        <div className="mt-1 pl-2 border-l-2 border-blue-400 bg-white p-1.5 rounded">
                          <p className="font-semibold text-slate-800 mb-1">
                            Pelaksanaan Intervensi oleh OPD:
                          </p>
                          {(ref.interventions?.length ?? 0) === 0 ? (
                            <p className="text-slate-500 italic">
                              Belum ada catatan intervensi yang diinput oleh OPD.
                            </p>
                          ) : (
                            <ul className="list-disc list-inside space-y-1">
                              {ref.interventions?.map((inv) => (
                                <li key={inv.id} className="text-slate-700">
                                  <span className="font-bold">
                                    {inv.interventionType?.nama || "Tindakan Intervensi"}:
                                  </span>{" "}
                                  {inv.deskripsi || "-"}
                                  {inv.hasil && (
                                    <div className="pl-4 text-emerald-700 font-semibold mt-0.5">
                                      ↳ Hasil Intervensi: {inv.hasil}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3.4 Catatan Monitoring Berkala */}
              <div className="mb-2 pl-2 border-l-2 border-slate-300">
                <p className="font-sans font-bold text-slate-800 text-[11px] mb-1">
                  4. Pemantauan Berkala (Monitoring)
                </p>
                {(kase.monitorings?.length ?? 0) === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    Belum ada riwayat catatan monitoring.
                  </p>
                ) : (
                  <ul className="space-y-1 font-sans text-[11px] list-disc list-inside">
                    {kase.monitorings?.map((m) => (
                      <li key={m.id} className="text-slate-700">
                        <span className="font-semibold">
                          {new Date(m.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          :
                        </span>{" "}
                        {m.catatan}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* ================= 4. KESIMPULAN HASIL PENANGANAN ================= */}
            <div className="mb-8 border border-slate-300 rounded p-3 bg-slate-50 font-sans">
              <h4 className="font-bold text-xs uppercase mb-1 text-slate-800">
                IV. Kesimpulan Status Penanganan
              </h4>
              <p className="text-xs text-slate-700">
                Berdasarkan seluruh rangkaian tindakan terpadu yang telah dilaksanakan, kasus
                dengan nomor register <strong className="font-mono">{kase.nomorKasus}</strong> saat ini dinyatakan:{" "}
                <span className="font-bold underline text-slate-950">
                  {kase.status === "SELESAI_PENCEGAHAN"
                    ? "SELESAI (SISWA BERHASIL KEMBALI BERSEKOLAH PADA TAHAP PENCEGAHAN)"
                    : kase.status === "CLOSED_CASE"
                    ? "SELESAI DAN DITUTUP (CLOSED CASE)"
                    : `SEDANG DALAM TAHAP PENANGANAN AKTIF (${kase.status})`}
                </span>
                .
              </p>
            </div>

            {/* ================= KOLOM TANDA TANGAN ================= */}
            <div className="pt-2 font-sans break-inside-avoid">
              <div className="flex justify-between items-start text-center text-xs">
                {/* Pihak Sekolah / Kapanewon */}
                <div className="w-56">
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    Pihak Sekolah / Tim Kapanewon
                  </p>
                  <div className="h-20"></div>
                  <p className="font-bold border-b border-slate-400 pb-0.5 mx-4">
                    ( .................................................. )
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    NIP / Identitas Petugas
                  </p>
                </div>

                {/* Dinas Pendidikan Sleman */}
                <div className="w-64">
                  <p className="text-slate-600">Sleman, {printDate}</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    Dinas Pendidikan Kabupaten Sleman
                  </p>
                  <div className="h-20"></div>
                  <p className="font-bold border-b border-slate-400 pb-0.5 mx-4">
                    ( .................................................. )
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    NIP. Petugas Verifikasi Kasus
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
