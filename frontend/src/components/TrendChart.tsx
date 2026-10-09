import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface TrendChartProps {
  data: any[];
  dataKey: string;
  label: string;
  color: string;
  unit: string;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 border border-gray-100 rounded-xl shadow-xl">
        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-black text-gray-800">
          {payload[0].value.toFixed(1)}{unit}
        </p>
      </div>
    );
  }
  return null;
};

export function TrendChart({ data, dataKey, label, color, unit }: TrendChartProps) {
  // Transform data for recharts
  const chartData = data.map((d, i) => ({
    name: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: d[dataKey],
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm font-medium">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            minTickGap={20}
          />
          <YAxis 
            hide 
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3}
            fillOpacity={1} 
            fill={`url(#gradient-${dataKey})`}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
