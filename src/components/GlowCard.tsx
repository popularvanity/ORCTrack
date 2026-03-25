import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}

export default function GlowCard({ children, className = '', glowColor = 'cyan', delay = 0 }: GlowCardProps) {
  const glowMap: Record<string, string> = {
    cyan: 'shadow-cyan-500/20 hover:shadow-cyan-500/40',
    purple: 'shadow-purple-500/20 hover:shadow-purple-500/40',
    green: 'shadow-green-500/20 hover:shadow-green-500/40',
    amber: 'shadow-amber-500/20 hover:shadow-amber-500/40',
    red: 'shadow-red-500/20 hover:shadow-red-500/40',
    blue: 'shadow-blue-500/20 hover:shadow-blue-500/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`
        relative rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-950/90
        backdrop-blur-xl shadow-2xl ${glowMap[glowColor] || glowMap.cyan}
        transition-shadow duration-500 ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
