interface SummaryCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
  subtitle?: string;
  change?: string;
  changeColor?: string;
  iconBg?: string;
}

export default function SummaryCard({
  title,
  value,
  icon,
  color = "text-slate-700",
  className = "",
  subtitle,
  change,
  changeColor = "text-slate-500",
  iconBg,
}: SummaryCardProps) {
  return (
    <div
      className={`
        bg-white
        rounded-3xl
        border
        border-slate-200
        p-5
        shadow-sm
        ${className}
      `}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <div className="flex items-baseline gap-2 mt-2">
            <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
            {change && <span className={`text-xs font-semibold ${changeColor}`}>{change}</span>}
          </div>

          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>

        <div className={iconBg ? `p-2.5 rounded-xl ${iconBg}` : color}>{icon}</div>
      </div>
    </div>
  );
}
