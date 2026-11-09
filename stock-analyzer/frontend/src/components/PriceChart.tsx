import React from "react";
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Bar, Line } from "recharts";
import { OHLCVPoint } from "@/lib/types";

interface PriceChartProps {
  data: OHLCVPoint[];
}

const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  const formattedData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    close: d.close,
    volume: d.volume,
  }));

  return (
    <div className="w-full h-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formattedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "#4B5563" }} />
          <YAxis yAxisId="left" orientation="left" tickCount={5} tick={{ fill: "#4B5563" }} domain={["dataMin", "dataMax"]} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#4B5563" }} hide />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }}
            itemStyle={{ color: "#111827" }}
          />
          <Bar yAxisId="right" dataKey="volume" barSize={20} fill="rgba(59,130,246,0.3)" />
          <Line yAxisId="left" type="monotone" dataKey="close" stroke="#3B82F6" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
