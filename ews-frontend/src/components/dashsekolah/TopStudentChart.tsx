import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
  CartesianGrid,
  LabelList,
} from "recharts";

const data = [
  {
    name: "Siti Aisyah",
    risk: 82,
  },
  {
    name: "Mawar Nurul Huda",
    risk: 76,
  },
  {
    name: "Muhammad Rizky",
    risk: 70,
  },
  {
    name: "Fadli Ramadhan",
    risk: 64,
  },
  {
    name: "Tri Andika",
    risk: 58,
  },
];

const getColor = (risk: number) => {
  if (risk >= 80) return "#EF4444"; // merah
  if (risk >= 65) return "#F59E0B"; // kuning
  return "#3B82F6"; // biru
};

export default function TopStudentsChart() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          Siswa dengan Risiko Tertinggi
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Lima siswa dengan skor risiko tertinggi di sekolah
        </p>
      </div>

      <ResponsiveContainer width="100%" height={330}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 10,
            right: 35,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 3"
            stroke="#E2E8F0"
          />

          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "#64748B", fontSize: 12 }}
          />

          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{
              fill: "#334155",
              fontSize: 13,
            }}
          />

          <Tooltip
            cursor={{ fill: "#F8FAFC" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E2E8F0",
              boxShadow: "0 6px 18px rgba(0,0,0,.08)",
            }}
            formatter={(value: number) => [`${value}%`, "Skor Risiko"]}
          />

          <Bar
            dataKey="risk"
            radius={[0, 10, 10, 0]}
            barSize={22}
          >
            <LabelList
              dataKey="risk"
              position="right"
              formatter={(value: number) => `${value}%`}
              style={{
                fill: "#1E293B",
                fontWeight: 600,
                fontSize: 12,
              }}
            />

            {data.map((item, index) => (
              <Cell
                key={index}
                fill={getColor(item.risk)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}