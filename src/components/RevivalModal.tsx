import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Users, MessageCircle, Star, Calendar, Monitor, Globe } from 'lucide-react';
import type { Revival } from '../data/revivals';

interface RevivalModalProps {
  revival: Revival | null;
  onClose: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-green-400' },
  private: { label: 'Private', color: 'text-amber-400' },
  wip: { label: 'Work in Progress', color: 'text-purple-400' },
  launcher: { label: 'Launcher', color: 'text-blue-400' },
  dead: { label: 'Shut Down', color: 'text-red-400' },
};

export default function RevivalModal({ revival, onClose }: RevivalModalProps) {
  if (!revival) return null;

  const status = statusLabels[revival.status];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          {/* Thumbnail hero */}
          {revival.thumbnail && (
            <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
              <img
                src={revival.thumbnail}
                alt={revival.name}
                className="h-full w-full object-cover"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
            </div>
          )}

          <div className={`p-8 ${revival.thumbnail ? 'pt-4' : ''}`}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-xl p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl">{revival.logoEmoji}</span>
              <div>
                <h2 className="text-2xl font-bold text-white">{revival.name}</h2>
                <p className={`text-sm font-semibold ${status.color}`}>{status.label}</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Calendar size={12} />
                  <span>Era</span>
                </div>
                <p className="text-white font-semibold text-sm">{revival.years}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Calendar size={12} />
                  <span>Created</span>
                </div>
                <p className="text-white font-semibold text-sm">{revival.createdYear}</p>
              </div>
              {revival.users !== undefined && revival.users > 0 && (
                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Users size={12} />
                    <span>Users</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{revival.users.toLocaleString()}</p>
                </div>
              )}
              {revival.discordMembers !== undefined && revival.discordMembers > 0 && (
                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <MessageCircle size={12} />
                    <span>Discord</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{revival.discordMembers.toLocaleString()}</p>
                </div>
              )}
              {revival.rating !== undefined && revival.rating > 0 && (
                <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Star size={12} />
                    <span>Rating</span>
                  </div>
                  <p className="text-amber-400 font-semibold text-sm">{revival.rating} / 5.0</p>
                </div>
              )}
              <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Monitor size={12} />
                  <span>Platforms</span>
                </div>
                <p className="text-white font-semibold text-sm">{revival.platforms.join(', ')}</p>
              </div>
            </div>

            {/* Owner */}
            {revival.owner && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Owner / Team</p>
                <p className="text-sm text-gray-300">{revival.owner}</p>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">About</p>
              <p className="text-sm text-gray-300 leading-relaxed">{revival.description}</p>
            </div>

            {/* Links */}
            <div className="space-y-2">
              {revival.url && (
                <a
                  href={revival.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-3 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-all"
                >
                  <Globe size={16} />
                  Visit {revival.name}
                  <ExternalLink size={14} />
                </a>
              )}
              {revival.discord && (
                <a
                  href={revival.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-all"
                >
                  💬 Join Discord
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
