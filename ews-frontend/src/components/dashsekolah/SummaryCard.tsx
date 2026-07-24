import type { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ReactNode;
  iconBg?: string;
  change?: string;
  changeColor?: string;
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = "bg-blue-100 text-blue-600",
  change,
  changeColor = "text-slate-500",
}: SummaryCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-4xl font-bold text-slate-800">
              {value}
            </h2>
            {change && (
              <span className={`text-xs font-semibold ${changeColor}`}>{change}</span>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-2">
            {subtitle}
          </p>
        </div>

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}