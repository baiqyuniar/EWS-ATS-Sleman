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
    <div className="bg-[#0F2D59] rounded-2xl p-6 text-white shadow-lg">
      <h3 className="text-lg font-semibold mb-6">{title}</h3>

      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-2">
              <span>{item.label}</span>
              <span className="font-semibold">{item.value}%</span>
            </div>

            <div className="w-full h-2 rounded-full bg-blue-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{
                  width: `${item.value}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}