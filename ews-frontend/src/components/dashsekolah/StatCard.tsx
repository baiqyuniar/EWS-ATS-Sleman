import {
  CheckCircle2,
  AlertTriangle,
  Home,
  ClipboardCheck,
  Clock3,
} from "lucide-react";

const activities = [
  {
    title: "Home Visit Berhasil",
    description: "Kunjungan ke rumah siswa Ahmad Fauzi kelas XI IPA 2.",
    time: "10 menit lalu",
    color: "emerald",
    icon: Home,
  },
  {
    title: "Intervensi Disetujui",
    description: "Pengajuan bantuan pendidikan telah disetujui.",
    time: "1 jam lalu",
    color: "blue",
    icon: ClipboardCheck,
  },
  {
    title: "Risiko Tinggi Terdeteksi",
    description: "2 siswa masuk kategori risiko tinggi.",
    time: "Hari ini",
    color: "red",
    icon: AlertTriangle,
  },
  {
    title: "Monitoring Selesai",
    description: "Guru BK memperbarui hasil monitoring mingguan.",
    time: "Kemarin",
    color: "green",
    icon: CheckCircle2,
  },
];

export default function StatusCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">

      {/* Header */}

      <div className="flex items-center justify-between px-6 pt-6">

        <div>

          <h3 className="text-lg font-bold text-slate-800">
            Timeline Aktivitas
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Aktivitas terbaru sekolah
          </p>

        </div>

        <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">

          <Clock3
            size={20}
            className="text-blue-600"
          />

        </div>

      </div>

      {/* Timeline */}

      <div className="relative mt-8 px-6 pb-6">

        {/* Garis Timeline */}

        <div className="absolute left-[35px] top-0 bottom-0 w-[2px] bg-slate-200" />

        <div className="space-y-8">

          {activities.map((item, index) => {
            const Icon = item.icon;

            const bg =
              item.color === "green"
                ? "bg-green-100 text-green-600"
                : item.color === "blue"
                ? "bg-blue-100 text-blue-600"
                : item.color === "red"
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-600";

            return (
              <div
                key={index}
                className="relative flex gap-5"
              >
                {/* Icon */}

                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${bg}`}
                >
                  <Icon size={18} />
                </div>

                {/* Content */}

                <div className="flex-1 pb-2">

                  <div className="flex justify-between items-start gap-3">

                    <h4 className="font-semibold text-slate-800">
                      {item.title}
                    </h4>

                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {item.time}
                    </span>

                  </div>

                  <p className="text-sm text-slate-500 mt-1 leading-6">
                    {item.description}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}