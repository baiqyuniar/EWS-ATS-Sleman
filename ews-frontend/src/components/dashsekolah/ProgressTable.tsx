import {
  Target,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface ProgressItem {
  label: string;
  value: number;
}

interface ProgressCardProps {
  title: string;
  items: ProgressItem[];
}

export default function ProgressCard({
  title,
  items,
}: ProgressCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}

      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">

        <div>

          <h3 className="font-bold text-lg text-slate-800">
            {title}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Progres pelaksanaan intervensi sekolah
          </p>

        </div>

        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">

          <Target
            size={22}
            className="text-blue-600"
          />

        </div>

      </div>

      {/* Body */}

      <div className="p-6 space-y-6">

        {items.map((item, index) => {
          let barColor = "bg-blue-500";
          let badgeColor =
            "bg-blue-100 text-blue-700";

          if (item.value >= 90) {
            barColor = "bg-emerald-500";
            badgeColor =
              "bg-emerald-100 text-emerald-700";
          } else if (item.value >= 70) {
            barColor = "bg-sky-500";
            badgeColor =
              "bg-sky-100 text-sky-700";
          } else if (item.value >= 50) {
            barColor = "bg-amber-500";
            badgeColor =
              "bg-amber-100 text-amber-700";
          } else {
            barColor = "bg-red-500";
            badgeColor =
              "bg-red-100 text-red-700";
          }

          return (
            <div key={index}>

              {/* Judul */}

              <div className="flex justify-between items-center mb-3">

                <div className="flex items-center gap-2">

                  <TrendingUp
                    size={18}
                    className="text-slate-400"
                  />

                  <span className="font-medium text-slate-700">
                    {item.label}
                  </span>

                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
                >
                  {item.value}%
                </span>

              </div>

              {/* Progress */}

              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">

                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{
                    width: `${item.value}%`,
                  }}
                />

              </div>

              {/* Status */}

              <div className="flex justify-between mt-2">

                <span className="text-xs text-slate-400">
                  Target
                </span>

                <div className="flex items-center gap-1 text-xs text-slate-500">

                  <CheckCircle2
                    size={14}
                    className="text-emerald-500"
                  />

                  {item.value >= 90
                    ? "Sangat Baik"
                    : item.value >= 70
                    ? "Baik"
                    : item.value >= 50
                    ? "Cukup"
                    : "Perlu Perhatian"}

                </div>

              </div>

            </div>
          );
        })}

      </div>

      {/* Footer */}

      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">

        <div className="flex items-center justify-between">

          <span className="text-sm text-slate-500">
            Rata-rata Progress
          </span>

          <span className="text-lg font-bold text-blue-600">
            {Math.round(
              items.reduce(
                (sum, item) => sum + item.value,
                0
              ) / items.length
            )}
            %
          </span>

        </div>

      </div>

    </div>
  );
}