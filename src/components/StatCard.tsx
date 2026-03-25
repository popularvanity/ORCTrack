import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: string;
  delay?: number;
}

export default function StatCard({ label, value, icon: Icon, trend, color, delay = 0 }: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/10' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', glow: 'shadow-green-500/10' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-500/10' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'shadow-red-500/10' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-blue-500/10' },
  };

  const c = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-2xl border ${c.border} ${c.bg} p-5 backdrop-blur-xl shadow-lg ${c.glow} hover:shadow-xl transition-all duration-300`}
    >
      <div className="absolute -top-4 -right-4 opacity-5">
        <Icon size={80} />
      </div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${c.text}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className="mt-1 text-xs text-gray-500">{trend}</p>
          )}
        </div>
        <div className={`rounded-xl ${c.bg} p-2.5`}>
          <Icon className={c.text} size={20} />
        </div>
      </div>
    </motion.div>
  );
}
