import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';

const typeConfig: Record<string, { color: string; ring: string; text: string }> = {
  milestone: { color: 'bg-cyan-500', ring: 'ring-cyan-500/30', text: 'text-cyan-400' },
  growth: { color: 'bg-green-500', ring: 'ring-green-500/30', text: 'text-green-400' },
  peak: { color: 'bg-amber-500', ring: 'ring-amber-500/30', text: 'text-amber-400' },
  decline: { color: 'bg-red-500', ring: 'ring-red-500/30', text: 'text-red-400' },
};

export default function Timeline() {
  const { timelineEvents } = useData();

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/30 to-transparent" />

      <div className="space-y-6">
        {timelineEvents.map((event, i) => {
          const config = typeConfig[event.type] || typeConfig.milestone;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="relative flex items-start gap-4 pl-2"
            >
              {/* Dot */}
              <div className={`relative z-10 mt-1 h-5 w-5 flex-shrink-0 rounded-full ${config.color} ring-4 ${config.ring}`}>
                <div className={`absolute inset-0 rounded-full ${config.color} animate-ping opacity-20`} />
              </div>

              {/* Content */}
              <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${config.text} font-mono`}>{event.year}</span>
                  <span className={`text-[10px] uppercase tracking-widest ${config.text} opacity-60`}>{event.type}</span>
                </div>
                <p className="text-sm text-gray-300">{event.event}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
