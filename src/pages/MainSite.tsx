import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Users, Server, Skull, Shield, Wrench, Rocket,
  Search, Filter, ExternalLink, TrendingUp, Clock, BarChart3,
  Globe, Zap, ChevronDown, Star, Terminal, UserPlus, LogIn,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Revival, RevivalStatus } from '../data/revivals';
import StatCard from '../components/StatCard';
import GlowCard from '../components/GlowCard';
import RevivalCard from '../components/RevivalCard';
import RevivalModal from '../components/RevivalModal';
import Timeline from '../components/Timeline';
import { GrowthChart, StatusPieChart, EraBarChart, StatusLegend } from '../components/Charts';

type Tab = 'dashboard' | 'revivals' | 'timeline';

const statusFilters: { key: RevivalStatus | 'all'; label: string; icon: typeof Activity }[] = [
  { key: 'all', label: 'All', icon: Globe },
  { key: 'active', label: 'Active', icon: Rocket },
  { key: 'launcher', label: 'Launchers', icon: Zap },
  { key: 'private', label: 'Private', icon: Shield },
  { key: 'wip', label: 'WIP', icon: Wrench },
  { key: 'dead', label: 'Dead', icon: Skull },
];

export default function MainSite() {
  const { revivals, communityStats, siteSettings } = useData();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RevivalStatus | 'all'>('all');
  const [selectedRevival, setSelectedRevival] = useState<Revival | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Press 'i' to go to admin auth
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'i' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        navigate(isAuthenticated ? '/admin' : '/auth');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, isAuthenticated]);

  const filteredRevivals = useMemo(() => {
    return revivals.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.years.includes(search);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, revivals]);

  const featuredRevivals = revivals.filter(r => r.featured);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/3 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/30 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Zap size={20} className="text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[#0a0a0f] animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  <span className="text-cyan-400">{siteSettings.siteName}</span>{' '}
                  <span className="text-white">Tracker</span>
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">{siteSettings.siteTagline}</p>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="hidden sm:flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/5">
              {([
                { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { key: 'revivals', label: 'Revivals', icon: Server },
                { key: 'timeline', label: 'Timeline', icon: Clock },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    tab === t.key
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:from-cyan-500 hover:to-violet-500 transition-all shadow-lg shadow-cyan-500/20"
                >
                  <Shield size={12} />
                  Admin Panel
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/auth')}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <LogIn size={12} />
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/auth?mode=register')}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:from-cyan-500 hover:to-violet-500 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <UserPlus size={12} />
                    Register
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <div className="sm:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
            {([
              { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { key: 'revivals', label: 'Revivals', icon: Server },
              { key: 'timeline', label: 'Timeline', icon: Clock },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                  tab === t.key
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {/* ===== DASHBOARD TAB ===== */}
            {tab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hero Banner */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mb-8 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-r from-cyan-950/50 via-gray-900/50 to-purple-950/50 p-6 sm:p-8"
                >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-green-400 font-medium">LIVE DATA · PROTOTYPE</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                      {siteSettings.heroTitle}{' '}
                      <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {siteSettings.heroHighlight}
                      </span>
                    </h2>
                    <p className="text-sm text-gray-400 max-w-2xl leading-relaxed mb-4">
                      {siteSettings.heroDescription}
                    </p>
                    {/* Register CTA in hero */}
                    {!isAuthenticated && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => navigate('/auth?mode=register')}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-cyan-400 hover:to-violet-400 transition-all shadow-lg shadow-cyan-500/20"
                        >
                          <UserPlus size={14} />
                          Create Account
                        </button>
                        <button
                          onClick={() => navigate('/auth')}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition-all"
                        >
                          <LogIn size={14} />
                          Sign In
                        </button>
                        <span className="text-xs text-gray-600">Get admin access to customize everything</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                  <StatCard label="Total Revivals" value={communityStats.totalRevivals} icon={Server} color="cyan" trend="All-time tracked" delay={0.1} />
                  <StatCard label="Active Now" value={communityStats.activeRevivals} icon={Activity} color="green" trend="Public & playable" delay={0.15} />
                  <StatCard label="Est. Players" value={communityStats.totalEstimatedPlayers} icon={Users} color="purple" trend="Across all revivals" delay={0.2} />
                  <StatCard label="Subreddit" value={communityStats.subredditMembers.toLocaleString()} icon={TrendingUp} color="amber" trend={communityStats.subredditName} delay={0.25} />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                  <GlowCard className="lg:col-span-2 p-5" glowColor="cyan" delay={0.3}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-sm">Community Growth</h3>
                        <p className="text-xs text-gray-500">Est. players & revival count over time</p>
                      </div>
                      <TrendingUp size={16} className="text-cyan-400" />
                    </div>
                    <GrowthChart />
                  </GlowCard>

                  <GlowCard className="p-5" glowColor="purple" delay={0.35}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-sm">Status Breakdown</h3>
                        <p className="text-xs text-gray-500">{communityStats.totalRevivals} total revivals</p>
                      </div>
                    </div>
                    <StatusPieChart />
                    <StatusLegend />
                  </GlowCard>
                </div>

                {/* Era Distribution + Featured */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                  <GlowCard className="p-5" glowColor="blue" delay={0.4}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-sm">Era Distribution</h3>
                        <p className="text-xs text-gray-500">Most revivals target {communityStats.mostPopularEra}</p>
                      </div>
                      <BarChart3 size={16} className="text-blue-400" />
                    </div>
                    <EraBarChart />
                  </GlowCard>

                  <GlowCard className="lg:col-span-2 p-5" glowColor="amber" delay={0.45}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                          <Star size={14} className="text-amber-400" />
                          Featured Revivals
                        </h3>
                        <p className="text-xs text-gray-500">Most notable projects in the ORC</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {featuredRevivals.map((r, i) => (
                        <motion.button
                          key={r.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.05 }}
                          onClick={() => setSelectedRevival(r)}
                          className="w-full flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 p-3 hover:bg-white/[0.06] transition-all text-left"
                        >
                          {r.thumbnail ? (
                            <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={r.thumbnail} alt={r.name} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                          ) : (
                            <span className="text-xl">{r.logoEmoji}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{r.name}</span>
                              <span className={`text-[10px] font-bold uppercase ${
                                r.status === 'active' ? 'text-green-400' :
                                r.status === 'dead' ? 'text-red-400' :
                                r.status === 'launcher' ? 'text-blue-400' : 'text-gray-400'
                              }`}>{r.status}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{r.years} · {r.users?.toLocaleString()} users</p>
                          </div>
                          {r.rating && r.rating > 0 && (
                            <span className="text-xs text-amber-400 font-mono">{r.rating}★</span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </GlowCard>
                </div>

                {/* Quick links */}
                <GlowCard className="p-5" glowColor="cyan" delay={0.5}>
                  <h3 className="font-semibold text-white text-sm mb-3">🔗 Quick Links & Sources</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <a href="https://www.reddit.com/r/oldrobloxrevivals/" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-orange-500/5 border border-orange-500/10 px-3 py-2.5 text-sm hover:bg-orange-500/10 transition-all">
                      <ExternalLink size={12} className="text-orange-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">r/oldrobloxrevivals</p>
                        <p className="text-[10px] text-gray-500">{communityStats.subredditMembers.toLocaleString()} members</p>
                      </div>
                    </a>
                    <a href="https://revival-list.com" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10 px-3 py-2.5 text-sm hover:bg-cyan-500/10 transition-all">
                      <ExternalLink size={12} className="text-cyan-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">Revival List</p>
                        <p className="text-[10px] text-gray-500">Complete database</p>
                      </div>
                    </a>
                    <a href="https://bitl.itch.io/novetus" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-green-500/5 border border-green-500/10 px-3 py-2.5 text-sm hover:bg-green-500/10 transition-all">
                      <ExternalLink size={12} className="text-green-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">Novetus (itch.io)</p>
                        <p className="text-[10px] text-gray-500">4.8★ launcher</p>
                      </div>
                    </a>
                    <a href="https://all-roblox-revivals.fandom.com" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-purple-500/5 border border-purple-500/10 px-3 py-2.5 text-sm hover:bg-purple-500/10 transition-all">
                      <ExternalLink size={12} className="text-purple-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">ORC Fandom Wiki</p>
                        <p className="text-[10px] text-gray-500">Community wiki</p>
                      </div>
                    </a>
                  </div>
                </GlowCard>

                {/* Registration CTA Banner */}
                {!isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-fuchsia-950/30 to-cyan-950/40 p-6 sm:p-8"
                  >
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500 rounded-full blur-[150px]" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield size={14} className="text-violet-400" />
                          <span className="text-[10px] text-violet-400 font-mono uppercase tracking-wider">Admin Access Available</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                          Manage & Customize <span className="text-violet-400">Everything</span>
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Create an account to access the admin panel — edit revivals, customize the entire website, manage users, run database queries, and 50+ more tools.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-shrink-0">
                        <button
                          onClick={() => navigate('/auth?mode=register')}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/25"
                        >
                          <UserPlus size={16} />
                          Create Free Account
                        </button>
                        <button
                          onClick={() => navigate('/auth')}
                          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                        >
                          <LogIn size={16} />
                          Sign In
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ===== REVIVALS TAB ===== */}
            {tab === 'revivals' && (
              <motion.div
                key="revivals"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Search & Filter Bar */}
                <div className="mb-6 space-y-3">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search revivals by name, era, or keyword..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all backdrop-blur-xl"
                      />
                    </div>
                    <button
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                      className="sm:hidden flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-gray-400"
                    >
                      <Filter size={14} />
                      <ChevronDown size={14} className={`transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Desktop filters */}
                  <div className="hidden sm:flex flex-wrap gap-2">
                    {statusFilters.map(f => (
                      <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                          statusFilter === f.key
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/[0.03] text-gray-400 border border-white/5 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <f.icon size={12} />
                        {f.label}
                        {f.key !== 'all' && (
                          <span className="ml-1 text-[10px] opacity-60">
                            ({revivals.filter(r => r.status === f.key).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Mobile filters */}
                  <AnimatePresence>
                    {showMobileFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="sm:hidden flex flex-wrap gap-2 overflow-hidden"
                      >
                        {statusFilters.map(f => (
                          <button
                            key={f.key}
                            onClick={() => { setStatusFilter(f.key); setShowMobileFilters(false); }}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                              statusFilter === f.key
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-white/[0.03] text-gray-400 border border-white/5'
                            }`}
                          >
                            <f.icon size={12} />
                            {f.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Results count */}
                  <p className="text-xs text-gray-500">
                    Showing {filteredRevivals.length} of {revivals.length} tracked revivals
                  </p>
                </div>

                {/* Revival Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredRevivals.map((r, i) => (
                    <RevivalCard key={r.id} revival={r} index={i} onClick={setSelectedRevival} />
                  ))}
                </div>

                {filteredRevivals.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-gray-500 text-sm">No revivals match your search.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== TIMELINE TAB ===== */}
            {tab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-w-2xl mx-auto">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">
                      <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        ORC Timeline
                      </span>
                    </h2>
                    <p className="text-sm text-gray-400">
                      The rise, peak, and evolution of the Old Roblox Community — from Graphictoria to today.
                    </p>
                  </div>
                  <Timeline />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Zap size={12} className="text-white" />
                </div>
                <span className="text-xs text-gray-500">{siteSettings.siteName} Tracker · Prototype Build</span>
              </div>
              <p className="text-[10px] text-gray-600 text-center">
                {siteSettings.footerText}
              </p>
              <div className="flex items-center gap-3">
                <a href="https://www.reddit.com/r/oldrobloxrevivals/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-orange-400 transition-colors">Reddit</a>
                <a href="https://revival-list.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">Revival List</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Modal */}
      {selectedRevival && (
        <RevivalModal revival={selectedRevival} onClose={() => setSelectedRevival(null)} />
      )}

      {/* Floating admin access button */}
      <div className="fixed bottom-4 right-4 z-[100]">
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => navigate(isAuthenticated ? '/admin' : '/auth')}
          className="group relative h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all"
          title="Press 'i' to open Admin Panel"
        >
          <Terminal size={16} className="text-white" />
          <span className="absolute -top-8 right-0 bg-gray-900 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Press <kbd className="text-violet-400 font-mono">i</kbd> for admin
          </span>
        </motion.button>
      </div>
    </div>
  );
}
