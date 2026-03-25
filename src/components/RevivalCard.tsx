import { motion } from 'framer-motion';
import { ExternalLink, Users, MessageCircle, Star, Shield, Wrench, Rocket, Skull } from 'lucide-react';
import type { Revival } from '../data/revivals';

interface RevivalCardProps {
  revival: Revival;
  index: number;
  onClick: (r: Revival) => void;
}

const statusConfig = {
  active: { label: 'ACTIVE', color: 'bg-green-500', textColor: 'text-green-400', borderColor: 'border-green-500/30', icon: Rocket },
  private: { label: 'PRIVATE', color: 'bg-amber-500', textColor: 'text-amber-400', borderColor: 'border-amber-500/30', icon: Shield },
  wip: { label: 'WIP', color: 'bg-purple-500', textColor: 'text-purple-400', borderColor: 'border-purple-500/30', icon: Wrench },
  launcher: { label: 'LAUNCHER', color: 'bg-blue-500', textColor: 'text-blue-400', borderColor: 'border-blue-500/30', icon: Rocket },
  dead: { label: 'DEAD', color: 'bg-red-500', textColor: 'text-red-400', borderColor: 'border-red-500/30', icon: Skull },
};

export default function RevivalCard({ revival, index, onClick }: RevivalCardProps) {
  const config = statusConfig[revival.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={() => onClick(revival)}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border ${config.borderColor} bg-gradient-to-br from-gray-900/90 to-gray-950 backdrop-blur-xl transition-all duration-300 hover:border-white/20`}
    >
      {/* Thumbnail */}
      {revival.thumbnail && (
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={revival.thumbnail}
            alt={revival.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
          {/* Status badge overlaid on thumbnail */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1">
            <div className={`h-2 w-2 rounded-full ${config.color} ${revival.status === 'active' ? 'animate-pulse' : ''}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${config.textColor}`}>{config.label}</span>
          </div>
        </div>
      )}

      <div className={`relative z-10 p-5 ${revival.thumbnail ? 'pt-3' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{revival.logoEmoji}</span>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">{revival.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Est. {revival.createdYear}</p>
            </div>
          </div>
          {!revival.thumbnail && (
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${config.color} ${revival.status === 'active' ? 'animate-pulse' : ''}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${config.textColor}`}>{config.label}</span>
            </div>
          )}
        </div>

        {/* Era badge */}
        <div className="mb-3">
          <span className="inline-flex items-center rounded-lg bg-white/5 px-2.5 py-1 text-xs font-mono text-gray-300 border border-white/5">
            📅 {revival.years}
          </span>
          {revival.featured && (
            <span className="inline-flex items-center ml-2 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/20">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4">
          {revival.description}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {revival.users !== undefined && revival.users > 0 && (
            <div className="flex items-center gap-1">
              <Users size={12} className="text-gray-400" />
              <span>{revival.users.toLocaleString()}</span>
            </div>
          )}
          {revival.discordMembers !== undefined && revival.discordMembers > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle size={12} className="text-gray-400" />
              <span>{revival.discordMembers.toLocaleString()}</span>
            </div>
          )}
          {revival.rating !== undefined && revival.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={12} className="text-amber-400" />
              <span className="text-amber-400">{revival.rating}</span>
            </div>
          )}
          {revival.platforms.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              {revival.platforms.map(p => (
                <span key={p} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">{p}</span>
              ))}
            </div>
          )}
        </div>

        {/* URL */}
        {revival.url && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <a
              href={revival.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ExternalLink size={12} />
              {revival.url.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
