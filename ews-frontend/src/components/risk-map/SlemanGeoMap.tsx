import { useState } from "react";
import EwsRiskMap from "../maps/EwsRiskMap";

export default function SlemanGeoMap() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regions = [
    { id: "tempel", name: "Tempel" },
    { id: "turi", name: "Turi" },
    { id: "pakem", name: "Pakem" },
    { id: "cangkringan", name: "Cangkringan" },
    { id: "minggir", name: "Minggir" },
    { id: "seyegan", name: "Seyegan" },
    { id: "sleman", name: "Sleman" },
    { id: "ngaglik", name: "Ngaglik" },
    { id: "ngemplak", name: "Ngemplak" },
    { id: "moyudan", name: "Moyudan" },
    { id: "godean", name: "Godean" },
    { id: "mlati", name: "Mlati" },
    { id: "depok", name: "Depok" },
    { id: "kalasan", name: "Kalasan" },
    { id: "gamping", name: "Gamping" },
    { id: "berbah", name: "Berbah" },
    { id: "prambanan", name: "Prambanan" },
  ];

  const regionMap: any = {
    Godean: "godean",
    Ngaglik: "ngaglik",
    Tempel: "tempel",
    Turi: "turi",
    Pakem: "pakem",
    Cangkringan: "cangkringan",
    Minggir: "minggir",
    Seyegan: "seyegan",
    Sleman: "sleman",
    Ngemplak: "ngemplak",
    Moyudan: "moyudan",
    Mlati: "mlati",
    Depok: "depok",
    Kalasan: "kalasan",
    Gamping: "gamping",
    Berbah: "berbah",
    Prambanan: "prambanan",
  };

  const schoolData: Record<
    string,
    { name: string; risk: number; status: string }[]
  > = {
    tempel: [{ name: "SMP Negeri 1 Tempel", risk: 72, status: "Tinggi" }],
    turi: [{ name: "SD Negeri Turi", risk: 65, status: "Tinggi" }],
    pakem: [{ name: "SMA Negeri Pakem", risk: 88, status: "Sangat Tinggi" }],
    cangkringan: [{ name: "SMK Cangkringan", risk: 55, status: "Sedang" }],
    minggir: [{ name: "SD Negeri Minggir", risk: 35, status: "Rendah" }],
    seyegan: [{ name: "SMP Negeri Seyegan", risk: 48, status: "Sedang" }],
    sleman: [{ name: "SMA Negeri Sleman", risk: 74, status: "Tinggi" }],
    ngaglik: [{ name: "SMK Ngaglik", risk: 93, status: "Kritis" }],
    ngemplak: [{ name: "SMP Negeri Ngemplak", risk: 58, status: "Sedang" }],
    moyudan: [{ name: "SD Negeri Moyudan", risk: 40, status: "Rendah" }],
    godean: [
      { name: "SMP Negeri 1 Godean", risk: 92, status: "Kritis" },
      { name: "SD Negeri Sidomoyo", risk: 68, status: "Tinggi" },
      { name: "SMK Muhammadiyah Godean", risk: 40, status: "Rendah" },
    ],
    mlati: [{ name: "SMK Negeri Mlati", risk: 91, status: "Kritis" }],
    depok: [
      { name: "SMA Negeri 1 Depok", risk: 97, status: "Kritis" },
      { name: "SMP Negeri 2 Depok", risk: 80, status: "Sangat Tinggi" },
    ],
    kalasan: [{ name: "SMK Kalasan", risk: 62, status: "Tinggi" }],
    gamping: [{ name: "SMA Gamping", risk: 81, status: "Sangat Tinggi" }],
    berbah: [{ name: "SMP Negeri Berbah", risk: 50, status: "Sedang" }],
    prambanan: [{ name: "SMK Prambanan", risk: 45, status: "Sedang" }],
  };

  const getColor = (value: number) => {
    if (value >= 90) return "#EF4444";
    if (value >= 75) return "#FB923C";
    if (value >= 60) return "#FDE047";
    if (value >= 45) return "#86EFAC";
    return "#4ADE80";
  };

  const selectedSchools = selectedRegion
    ? schoolData[selectedRegion] || []
    : [];

  return (
    <div className="space-y-6">
      {/* MAP */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 overflow-hidden shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Heatmap Kepanewon
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Klik wilayah untuk melihat sekolah
          </p>
        </div>

        <div className="w-full overflow-auto">
          <EwsRiskMap
            onRegionClick={(regionId) => {
              setSelectedRegion(regionId);
            }}
          />
          <div className="flex flex-wrap items-center gap-6 mt-6 px-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm text-slate-600 font-medium">
                Kritis (90+)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-400" />
              <span className="text-sm text-slate-600 font-medium">
                Tinggi (75-89)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-300" />
              <span className="text-sm text-slate-600 font-medium">
                Sedang (60-74)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-300" />
              <span className="text-sm text-slate-600 font-medium">
                Rendah (45-59)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm text-slate-600 font-medium">
                Sangat Rendah (&lt;45)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      {selectedRegion && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="mb-5">
            <h3 className="text-2xl font-bold text-slate-800">
              Data Sekolah -{" "}
              {regions.find((r) => r.id === selectedRegion)?.name}
            </h3>

            <p className="text-slate-500 mt-1">
              Total sekolah: {selectedSchools.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="px-4 py-3 text-left rounded-l-2xl">
                    Nama Sekolah
                  </th>
                  <th className="px-4 py-3 text-left">Risiko</th>
                  <th className="px-4 py-3 text-left rounded-r-2xl">Status</th>
                </tr>
              </thead>

              <tbody>
                {selectedSchools.map((school, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-medium text-slate-800">
                      {school.name}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">
                      {school.risk}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                        {school.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedSchools.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                Tidak ada data sekolah
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
