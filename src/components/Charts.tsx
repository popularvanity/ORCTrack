import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useData } from '../context/DataContext';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/95 px-4 py-3 shadow-xl backdrop-blur-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export function GrowthChart() {
  const { monthlyGrowth } = useData();
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={monthlyGrowth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="playerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revivalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="players"
          name="Est. Players"
          stroke="#06b6d4"
          strokeWidth={2}
          fill="url(#playerGrad)"
        />
        <Area
          type="monotone"
          dataKey="revivals"
          name="Total Revivals"
          stroke="#a855f7"
          strokeWidth={2}
          fill="url(#revivalGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart() {
  const { statusDistribution } = useData();
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={statusDistribution}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {statusDistribution.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="rounded-xl border border-white/10 bg-gray-900/95 px-4 py-2 shadow-xl backdrop-blur-xl">
                <p className="text-sm font-semibold" style={{ color: d.color }}>{d.name}: {d.value}</p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EraBarChart() {
  const { eraDistribution } = useData();
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={eraDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <XAxis dataKey="era" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <Bar dataKey="count" name="Revivals" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusLegend() {
  const { statusDistribution } = useData();
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {statusDistribution.map(s => (
        <div key={s.name} className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
          <span className="text-xs text-gray-400">{s.name} ({s.value})</span>
        </div>
      ))}
    </div>
  );
}
