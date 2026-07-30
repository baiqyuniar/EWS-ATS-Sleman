import { Loader2} from "lucide-react";
import type { StudentAnalytics, LabelCount } from "../../types/api";

// Panel "Analisis Otomatis" — menampilkan agregasi mastering data siswa
// (agama, kondisi ekonomi/pendidikan ortu, kebutuhan khusus, jenis tinggal,
// alat transportasi, bantuan sosial, & sebaran risiko ML) untuk satu sekolah
// atau gabungan satu kapanewon. Dipakai di DashboardSchool & DashboardKapanewon.

function BreakdownList({ title, data, emptyText = "Belum ada data" }: { title: string; data: LabelCount[]; emptyText?: string }) {
  const total = data.reduce((sum, d) => sum + d.jumlah, 0) || 1;
  const top = [...data].sort((a, b) => b.jumlah - a.jumlah).slice(0, 8);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {top.length === 0 ? (
        <p className="text-xs text-slate-400">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {top.map((d) => (
            <div key={d.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 truncate pr-2">{d.label}</span>
                <span className="font-semibold text-slate-800 shrink-0">{d.jumlah}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.max(4, (d.jumlah / total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPanel({
  data,
  isLoading,
  scopeLabel,
}: {
  data?: StudentAnalytics;
  isLoading: boolean;
  scopeLabel: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Memuat analisis otomatis...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        Data analisis belum tersedia untuk {scopeLabel}.
      </div>
    );
  }

  // const { sebaranRisiko, bantuanSosial } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Analisis Otomatis — Mastering Data</h2>
        <p className="text-sm text-slate-500">
          Diagregasi otomatis dari data siswa aktif {scopeLabel} (total {data.totalSiswa} siswa).
        </p>
      </div>

      {/* Ringkasan risiko & bantuan sosial
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
       
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600"><Users size={18} /></div>
          <div>
            <p className="text-xl font-bold text-slate-800">{sebaranRisiko.belumDiprediksi}</p>
            <p className="text-xs text-slate-500">Belum Diprediksi</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-100 text-green-600"><HandCoins size={18} /></div>
          <div>
            <p className="text-xl font-bold text-slate-800">
              {bantuanSosial.penerimaKip + bantuanSosial.penerimaKps}
            </p>
            <p className="text-xs text-slate-500">Penerima KIP/KPS</p>
          </div>
        </div>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <BreakdownList title="Sebaran Agama" data={data.sebaranAgama} />
        <BreakdownList title="Kebutuhan Khusus" data={data.sebaranKebutuhanKhusus} emptyText="Tidak ada siswa berkebutuhan khusus" />
        <BreakdownList title="Jenis Tinggal" data={data.sebaranJenisTinggal} />
        <BreakdownList title="Alat Transportasi" data={data.sebaranAlatTransportasi} />
        <BreakdownList title="Penghasilan Ayah" data={data.sebaranPenghasilanAyah} />
        <BreakdownList title="Penghasilan Ibu" data={data.sebaranPenghasilanIbu} />
        <BreakdownList title="Pendidikan Ayah" data={data.sebaranPendidikanAyah} />
        <BreakdownList title="Pendidikan Ibu" data={data.sebaranPendidikanIbu} />
        <BreakdownList title="Pekerjaan Ayah" data={data.sebaranPekerjaanAyah} />
        <BreakdownList title="Pekerjaan Ibu" data={data.sebaranPekerjaanIbu} />
      </div>
    </div>
  );
}
