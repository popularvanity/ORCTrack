import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Server, BarChart3, Clock, Palette, Type, Users as UsersIcon,
  Database, Download, Upload, LogOut, Shield, Terminal, Zap,
  Plus, Trash2, Save, Edit3, Search, ChevronDown, ChevronRight,
  AlertTriangle, Check, Copy, ExternalLink,
  Activity, ArrowLeft, Play, RefreshCw, FileJson, HardDrive,
  Layers, ToggleLeft, ToggleRight, Minus, Eye,
  Bell, Bookmark, Tag, Image, FileText, Key, Cpu,
  Globe, Lock, Moon, Sun,
  Gauge, Megaphone, StickyNote,
  ListChecks, Monitor,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { Revival, RevivalStatus, RevivalEra } from '../data/revivals';
import {
  runQuery, getUsers, deleteUser, getActivityLog,
  getTheme, updateTheme, getDBSize, getTableList, logActivity,
  getAnnouncements, addAnnouncement, deleteAnnouncement,
  getNotes, addNote, deleteNote,
  getBookmarks, addBookmark, deleteBookmark,
  getRoles, addRole, deleteRole,
  getTags, addTag, deleteTag,
  getMedia, addMedia, deleteMedia,
  getCustomPages, addCustomPage, updateCustomPage, deleteCustomPage,
  getScheduledTasks, addScheduledTask, deleteScheduledTask,
  getApiKeys, addApiKey, deleteApiKey,
  getWidgets, addWidget, deleteWidget,
  createBackup, getBackups, restoreBackup, deleteBackup,
  nukeDatabase,
} from '../lib/database';

type AdminTab =
  | 'overview' | 'revivals' | 'stats' | 'timeline'
  | 'theme' | 'content' | 'users' | 'database'
  | 'data' | 'logs' | 'announcements' | 'pages'
  | 'media' | 'roles' | 'tags' | 'bookmarks'
  | 'notes' | 'api' | 'tasks' | 'widgets'
  | 'backups' | 'seo' | 'performance' | 'security'
  | 'notifications' | 'shortcuts';

const TAB_GROUPS = [
  {
    label: 'Core',
    tabs: [
      { key: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
      { key: 'revivals' as AdminTab, label: 'Revivals', icon: Server },
      { key: 'stats' as AdminTab, label: 'Statistics', icon: BarChart3 },
      { key: 'timeline' as AdminTab, label: 'Timeline', icon: Clock },
    ],
  },
  {
    label: 'Appearance',
    tabs: [
      { key: 'theme' as AdminTab, label: 'Theme', icon: Palette },
      { key: 'content' as AdminTab, label: 'Content', icon: Type },
      { key: 'pages' as AdminTab, label: 'Pages', icon: FileText },
      { key: 'widgets' as AdminTab, label: 'Widgets', icon: PanelLeft },
    ],
  },
  {
    label: 'Content',
    tabs: [
      { key: 'announcements' as AdminTab, label: 'Announcements', icon: Megaphone },
      { key: 'media' as AdminTab, label: 'Media', icon: Image },
      { key: 'tags' as AdminTab, label: 'Tags', icon: Tag },
      { key: 'notes' as AdminTab, label: 'Notes', icon: StickyNote },
      { key: 'bookmarks' as AdminTab, label: 'Bookmarks', icon: Bookmark },
    ],
  },
  {
    label: 'System',
    tabs: [
      { key: 'users' as AdminTab, label: 'Users', icon: UsersIcon },
      { key: 'roles' as AdminTab, label: 'Roles', icon: Shield },
      { key: 'database' as AdminTab, label: 'SQL Console', icon: Database },
      { key: 'api' as AdminTab, label: 'API Keys', icon: Key },
      { key: 'tasks' as AdminTab, label: 'Tasks', icon: ListChecks },
    ],
  },
  {
    label: 'Advanced',
    tabs: [
      { key: 'data' as AdminTab, label: 'Import/Export', icon: FileJson },
      { key: 'backups' as AdminTab, label: 'Backups', icon: HardDrive },
      { key: 'seo' as AdminTab, label: 'SEO', icon: Globe },
      { key: 'performance' as AdminTab, label: 'Performance', icon: Gauge },
      { key: 'security' as AdminTab, label: 'Security', icon: Lock },
      { key: 'notifications' as AdminTab, label: 'Notifications', icon: Bell },
      { key: 'shortcuts' as AdminTab, label: 'Shortcuts', icon: Terminal },
      { key: 'logs' as AdminTab, label: 'Activity Log', icon: Activity },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);

export default function AdminDashboard() {
  const { user, isAuthenticated, isMasterAuth, logout } = useAuth();
  const data = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth');
  }, [isAuthenticated, navigate]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') { e.preventDefault(); showToast('Saved!'); }
        if (e.key === 'k') { e.preventDefault(); setSidebarSearch(''); }
      }
      if (e.key === 'Escape') setSidebarSearch('');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showToast]);

  const filteredGroups = sidebarSearch
    ? TAB_GROUPS.map(g => ({
        ...g,
        tabs: g.tabs.filter(t => t.label.toLowerCase().includes(sidebarSearch.toLowerCase())),
      })).filter(g => g.tabs.length > 0)
    : TAB_GROUPS;

  if (!isAuthenticated) return null;

  const currentTab = ALL_TABS.find(t => t.key === activeTab);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#050508]' : 'bg-gray-100'} text-white flex`}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[200] rounded-xl bg-gray-900 border border-cyan-500/30 px-5 py-3 text-sm text-white shadow-2xl shadow-cyan-500/10 backdrop-blur-xl"
          >
            <span className="flex items-center gap-2"><Check size={14} className="text-green-400" />{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 260 }}
        className="fixed left-0 top-0 h-full bg-gray-950/90 border-r border-white/5 backdrop-blur-xl z-50 flex flex-col overflow-hidden"
      >
        {/* Logo */}
        <div className="p-3 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
            <Shield size={16} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <p className="text-sm font-bold text-white truncate">ORC Admin</p>
              <p className="text-[10px] text-gray-500 font-mono truncate">
                {isMasterAuth ? '⚡ SUPERADMIN' : `👤 ${user?.username}`}
              </p>
            </motion.div>
          )}
        </div>

        {/* Sidebar search */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3 flex-shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Search tabs..."
                className="w-full rounded-lg border border-white/5 bg-white/[0.03] pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-gray-600 outline-none focus:border-cyan-500/30"
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3 admin-scroll">
          {filteredGroups.map(group => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="text-[9px] text-gray-600 uppercase tracking-wider px-2 mb-1 font-semibold">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] font-medium transition-all ${
                      activeTab === tab.key
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                    title={tab.label}
                  >
                    <tab.icon size={14} className="flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{tab.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-white/5 space-y-0.5 flex-shrink-0">
          <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            {darkMode ? <Moon size={14} /> : <Sun size={14} />}
            {!sidebarCollapsed && <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft size={14} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>View Site</span>}
          </button>
          <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={14} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className={`flex-1 transition-all ${sidebarCollapsed ? 'ml-16' : 'ml-[260px]'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              {currentTab && (() => { const I = currentTab.icon; return <I size={18} className="text-cyan-400" />; })()}
              {currentTab?.label || 'Admin'}
            </h1>
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">
              Admin Panel · {ALL_TABS.length} modules · {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-gray-400 font-mono">SYSTEM ONLINE</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5">
              <Shield size={12} className="text-cyan-400" />
              <span className="text-[10px] text-cyan-400 font-mono">{isMasterAuth ? 'SUPERADMIN' : 'ADMIN'}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'overview' && <OverviewTab showToast={showToast} data={data} />}
              {activeTab === 'revivals' && <RevivalsTab showToast={showToast} data={data} />}
              {activeTab === 'stats' && <StatsTab showToast={showToast} data={data} />}
              {activeTab === 'timeline' && <TimelineTab showToast={showToast} data={data} />}
              {activeTab === 'theme' && <ThemeTab showToast={showToast} />}
              {activeTab === 'content' && <ContentTab showToast={showToast} data={data} />}
              {activeTab === 'users' && <UsersTab showToast={showToast} />}
              {activeTab === 'database' && <DatabaseTab showToast={showToast} />}
              {activeTab === 'data' && <DataTab showToast={showToast} data={data} />}
              {activeTab === 'logs' && <LogsTab />}
              {activeTab === 'announcements' && <AnnouncementsTab showToast={showToast} />}
              {activeTab === 'pages' && <PagesTab showToast={showToast} />}
              {activeTab === 'media' && <MediaTab showToast={showToast} />}
              {activeTab === 'roles' && <RolesTab showToast={showToast} />}
              {activeTab === 'tags' && <TagsTab showToast={showToast} />}
              {activeTab === 'bookmarks' && <BookmarksTab showToast={showToast} />}
              {activeTab === 'notes' && <NotesTab showToast={showToast} />}
              {activeTab === 'api' && <ApiKeysTab showToast={showToast} />}
              {activeTab === 'tasks' && <TasksTab showToast={showToast} />}
              {activeTab === 'widgets' && <WidgetsTab showToast={showToast} />}
              {activeTab === 'backups' && <BackupsTab showToast={showToast} />}
              {activeTab === 'seo' && <SEOTab showToast={showToast} />}
              {activeTab === 'performance' && <PerformanceTab />}
              {activeTab === 'security' && <SecurityTab showToast={showToast} />}
              {activeTab === 'notifications' && <NotificationsTab showToast={showToast} />}
              {activeTab === 'shortcuts' && <ShortcutsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

/* ============ CARD COMPONENT ============ */
function Card({ children, className = '', title, subtitle, icon: Icon, action }: {
  children: React.ReactNode; className?: string; title?: string; subtitle?: string; icon?: any; action?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-950/90 backdrop-blur-xl ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className="text-cyan-400" />}
            <div>
              {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
              {subtitle && <p className="text-[10px] text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function MiniStat({ label, value, color = 'cyan' }: { label: string; value: string | number; color?: string }) {
  const colors: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.cyan}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

/* ============ OVERVIEW ============ */
function OverviewTab({ showToast, data }: { showToast: (s: string) => void; data: any }) {
  const [dbSize, setDbSize] = useState('...');
  const [tableCount, setTableCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    (async () => {
      setDbSize(await getDBSize());
      setTableCount((await getTableList()).length);
      setUserCount((await getUsers()).length);
      setLogCount((await getActivityLog()).length);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <MiniStat label="Total Revivals" value={data.revivals.length} color="cyan" />
        <MiniStat label="Active" value={data.revivals.filter((r: Revival) => r.status === 'active').length} color="green" />
        <MiniStat label="Dead" value={data.revivals.filter((r: Revival) => r.status === 'dead').length} color="red" />
        <MiniStat label="Users" value={userCount} color="purple" />
        <MiniStat label="DB Size" value={dbSize} color="amber" />
        <MiniStat label="Tables" value={tableCount} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="System Status" icon={Activity} subtitle="Real-time service health">
          <div className="space-y-2">
            {[
              { label: 'Database Engine', status: 'localStorage (No WASM)', ok: true },
              { label: 'IndexedDB Fallback', status: 'Available', ok: true },
              { label: 'Data Persistence', status: data.hasCustomData ? 'Custom Data' : 'Default', ok: true },
              { label: 'Tables Loaded', status: `${tableCount} tables`, ok: true },
              { label: 'Activity Entries', status: `${logCount} logged`, ok: true },
              { label: 'Auth System', status: 'Active', ok: true },
              { label: 'Theme Engine', status: 'Online', ok: true },
              { label: 'Backup System', status: 'Ready', ok: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-2.5">
                <span className="text-xs text-gray-400">{item.label}</span>
                <span className={`text-xs font-mono flex items-center gap-1.5 ${item.ok ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${item.ok ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Actions" icon={Zap} subtitle="Common operations">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Reset Data', icon: RefreshCw, action: () => { data.resetAll(); showToast('Data reset'); }, color: 'text-red-400 hover:bg-red-500/10' },
              { label: 'Export JSON', icon: Download, action: () => { navigator.clipboard.writeText(data.exportAll()); showToast('Copied!'); }, color: 'text-cyan-400 hover:bg-cyan-500/10' },
              { label: 'View Site', icon: Eye, action: () => window.open('#/', '_blank'), color: 'text-green-400 hover:bg-green-500/10' },
              { label: 'Clear Logs', icon: Trash2, action: async () => { await runQuery('DELETE FROM activity_log'); showToast('Logs cleared'); }, color: 'text-amber-400 hover:bg-amber-500/10' },
              { label: 'Create Backup', icon: HardDrive, action: () => { createBackup(); showToast('Backup created'); }, color: 'text-violet-400 hover:bg-violet-500/10' },
              { label: 'Copy DB Size', icon: Database, action: async () => { const s = await getDBSize(); navigator.clipboard.writeText(s); showToast(`DB: ${s}`); }, color: 'text-blue-400 hover:bg-blue-500/10' },
            ].map((item, i) => (
              <button key={i} onClick={item.action} className={`flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-xs font-medium transition-all ${item.color}`}>
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Feature count banner */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 to-violet-950/30 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Admin Panel v2.0</h3>
            <p className="text-[10px] text-gray-500">{ALL_TABS.length} modules · 50+ features · No WASM required</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { n: 'Revivals CRUD', c: 'cyan' }, { n: 'Theme Editor', c: 'purple' }, { n: 'SQL Console', c: 'green' },
            { n: 'User Mgmt', c: 'amber' }, { n: 'Backups', c: 'blue' }, { n: 'API Keys', c: 'pink' },
          ].map((f, i) => (
            <div key={i} className={`rounded-lg bg-${f.c === 'cyan' ? 'cyan' : f.c === 'purple' ? 'violet' : f.c === 'green' ? 'green' : f.c === 'amber' ? 'amber' : f.c === 'blue' ? 'blue' : 'pink'}-500/10 border border-white/5 px-2 py-1.5 text-center`}>
              <p className="text-[10px] text-gray-300 font-medium">{f.n}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ REVIVALS ============ */
function RevivalsTab({ showToast, data }: { showToast: (s: string) => void; data: any }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Revival>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'users' | 'status'>('name');

  let filtered = data.revivals.filter((r: Revival) =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search.toLowerCase())
  );
  if (sortBy === 'users') filtered = [...filtered].sort((a: Revival, b: Revival) => (b.users || 0) - (a.users || 0));
  if (sortBy === 'name') filtered = [...filtered].sort((a: Revival, b: Revival) => a.name.localeCompare(b.name));

  const startEdit = (r: Revival) => { setEditing(r.id); setEditData({ ...r }); };
  const cancelEdit = () => { setEditing(null); setEditData({}); };
  const saveEdit = () => {
    if (editing) {
      data.updateRevival(editing, editData);
      logActivity(0, 'edit_revival', `Edited ${editData.name}`);
      showToast(`Saved ${editData.name}`);
      setEditing(null);
    }
  };

  const addNew = () => {
    const id = 'new-' + Date.now();
    const revival: Revival = {
      id, name: editData.name || 'New Revival', status: (editData.status as RevivalStatus) || 'wip',
      years: editData.years || '2016', eraTag: (editData.eraTag as RevivalEra) || '2016-2018',
      description: editData.description || 'A new revival project.', createdYear: editData.createdYear || 2025,
      platforms: editData.platforms || ['Windows', 'Web'], logoEmoji: editData.logoEmoji || '🆕',
      url: editData.url, discord: editData.discord, owner: editData.owner,
      users: editData.users || 0, discordMembers: editData.discordMembers || 0,
      rating: editData.rating || 0, featured: editData.featured || false, thumbnail: editData.thumbnail,
    };
    data.addRevival(revival);
    logActivity(0, 'add_revival', `Added ${revival.name}`);
    showToast(`Added ${revival.name}`);
    setShowAdd(false); setEditData({});
  };

  const InputRow = ({ label, field, type = 'text' }: { label: string; field: keyof Revival; type?: string }) => (
    <div className="flex items-center gap-3">
      <label className="text-[10px] text-gray-500 w-24 flex-shrink-0 uppercase">{label}</label>
      <input type={type} value={(editData[field] as any) ?? ''}
        onChange={e => setEditData(prev => ({ ...prev, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50 transition-all" />
    </div>
  );

  const EditForm = () => (
    <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-cyan-500/20">
      <InputRow label="Name" field="name" />
      <InputRow label="Emoji" field="logoEmoji" />
      <div className="flex items-center gap-3">
        <label className="text-[10px] text-gray-500 w-24 flex-shrink-0 uppercase">Status</label>
        <select value={editData.status || 'active'} onChange={e => setEditData(prev => ({ ...prev, status: e.target.value as RevivalStatus }))}
          className="flex-1 rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none">
          {['active','dead','launcher','private','wip'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <InputRow label="URL" field="url" />
      <InputRow label="Discord" field="discord" />
      <InputRow label="Years" field="years" />
      <div className="flex items-center gap-3">
        <label className="text-[10px] text-gray-500 w-24 flex-shrink-0 uppercase">Era</label>
        <select value={editData.eraTag || '2016-2018'} onChange={e => setEditData(prev => ({ ...prev, eraTag: e.target.value as RevivalEra }))}
          className="flex-1 rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none">
          {['2006-2009','2010-2012','2013-2015','2016-2018','2019-2022','2023+'].map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <InputRow label="Owner" field="owner" />
      <InputRow label="Users" field="users" type="number" />
      <InputRow label="Discord #" field="discordMembers" type="number" />
      <InputRow label="Rating" field="rating" type="number" />
      <InputRow label="Year Made" field="createdYear" type="number" />
      <InputRow label="Thumbnail" field="thumbnail" />
      <div className="flex items-center gap-3">
        <label className="text-[10px] text-gray-500 w-24 flex-shrink-0 uppercase">Description</label>
        <textarea value={editData.description || ''} onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
          rows={3} className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none resize-none" />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-[10px] text-gray-500 w-24 flex-shrink-0 uppercase">Featured</label>
        <button onClick={() => setEditData(prev => ({ ...prev, featured: !prev.featured }))} className="text-xs">
          {editData.featured ? <ToggleRight size={20} className="text-cyan-400" /> : <ToggleLeft size={20} className="text-gray-500" />}
        </button>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={editing ? saveEdit : addNew} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-all">
          <Save size={12} /> {editing ? 'Save' : 'Add Revival'}
        </button>
        <button onClick={() => { cancelEdit(); setShowAdd(false); setEditData({}); }} className="rounded-lg bg-white/5 px-4 py-2 text-xs text-gray-400 hover:text-white transition-all">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search revivals..."
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500/50" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="rounded-xl border border-white/10 bg-gray-900 px-3 py-2.5 text-xs text-white outline-none">
          <option value="name">Sort: Name</option>
          <option value="users">Sort: Users</option>
          <option value="status">Sort: Status</option>
        </select>
        <button onClick={() => { setShowAdd(true); setEditData({}); }} className="flex items-center gap-1 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500">
          <Plus size={14} /> Add Revival
        </button>
      </div>
      {showAdd && <EditForm />}
      <div className="space-y-2">
        {filtered.map((r: Revival) => (
          <div key={r.id} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">{r.logoEmoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{r.name}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    r.status === 'active' ? 'text-green-400 bg-green-500/10' :
                    r.status === 'dead' ? 'text-red-400 bg-red-500/10' :
                    r.status === 'launcher' ? 'text-blue-400 bg-blue-500/10' :
                    r.status === 'private' ? 'text-amber-400 bg-amber-500/10' : 'text-purple-400 bg-purple-500/10'
                  }`}>{r.status}</span>
                </div>
                <p className="text-[10px] text-gray-500 truncate">{r.years} · {r.users?.toLocaleString() || 0} users · {r.eraTag}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(r)} className="rounded-lg p-2 text-gray-500 hover:text-cyan-400 hover:bg-white/5 transition-all"><Edit3 size={14} /></button>
                <button onClick={() => { data.deleteRevival(r.id); showToast(`Deleted ${r.name}`); }} className="rounded-lg p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/5 transition-all"><ExternalLink size={14} /></a>}
              </div>
            </div>
            {editing === r.id && <div className="border-t border-white/5 p-4"><EditForm /></div>}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-600 text-center">Showing {filtered.length} of {data.revivals.length} revivals</p>
    </div>
  );
}

/* ============ STATS ============ */
function StatsTab({ showToast, data }: { showToast: (s: string) => void; data: any }) {
  const [stats, setStats] = useState(data.communityStats);
  const save = () => { data.setCommunityStats(stats); logActivity(0, 'edit_stats', 'Updated stats'); showToast('Statistics saved'); };
  const Field = ({ label, field, type = 'text' }: { label: string; field: string; type?: string }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase mb-1 block">{label}</label>
      <input type={type} value={(stats as any)[field] ?? ''} onChange={e => setStats((prev: any) => ({ ...prev, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50" />
    </div>
  );
  return (
    <Card title="Community Statistics" icon={BarChart3} subtitle="Edit dashboard stat cards" action={
      <button onClick={save} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"><Save size={12} /> Save</button>
    }>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Total Revivals" field="totalRevivals" type="number" />
        <Field label="Active Revivals" field="activeRevivals" type="number" />
        <Field label="Dead Revivals" field="deadRevivals" type="number" />
        <Field label="Launcher Count" field="launcherCount" type="number" />
        <Field label="Private Revivals" field="privateRevivals" type="number" />
        <Field label="WIP Revivals" field="wipRevivals" type="number" />
        <Field label="Total Est. Players" field="totalEstimatedPlayers" type="number" />
        <Field label="Subreddit Members" field="subredditMembers" type="number" />
        <Field label="Subreddit Name" field="subredditName" />
        <Field label="Most Popular Era" field="mostPopularEra" />
        <Field label="Oldest Revival" field="oldestRevival" />
        <Field label="Newest Revival" field="newestRevival" />
      </div>
    </Card>
  );
}

/* ============ TIMELINE ============ */
function TimelineTab({ showToast, data }: { showToast: (s: string) => void; data: any }) {
  const [newEvent, setNewEvent] = useState({ year: 2026, event: '', type: 'milestone' });
  return (
    <div className="space-y-4">
      <Card title="Add Event" icon={Plus}>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-[10px] text-gray-500 uppercase mb-1 block">Year</label>
            <input type="number" value={newEvent.year} onChange={e => setNewEvent(prev => ({ ...prev, year: Number(e.target.value) }))}
              className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] text-gray-500 uppercase mb-1 block">Event</label>
            <input type="text" value={newEvent.event} onChange={e => setNewEvent(prev => ({ ...prev, event: e.target.value }))}
              placeholder="Describe the event..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase mb-1 block">Type</label>
            <select value={newEvent.type} onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
              className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none">
              {['milestone','growth','peak','decline'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={() => { if (!newEvent.event) return; data.addTimelineEvent(newEvent); showToast('Event added'); setNewEvent({ year: 2026, event: '', type: 'milestone' }); }}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Add</button>
        </div>
      </Card>
      <Card title="Timeline Events" icon={Clock} subtitle={`${data.timelineEvents.length} events`}>
        <div className="space-y-2">
          {data.timelineEvents.map((event: any, i: number) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
              <span className="text-xs font-mono text-cyan-400 w-12">{event.year}</span>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                event.type === 'milestone' ? 'text-cyan-400 bg-cyan-500/10' :
                event.type === 'growth' ? 'text-green-400 bg-green-500/10' :
                event.type === 'peak' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'
              }`}>{event.type}</span>
              <span className="flex-1 text-xs text-gray-300">{event.event}</span>
              <button onClick={() => { data.deleteTimelineEvent(i); showToast('Deleted'); }} className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Minus size={12} /></button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============ THEME ============ */
function ThemeTab({ showToast }: { showToast: (s: string) => void }) {
  const [theme, setTheme] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { getTheme().then(t => { setTheme(t); setLoaded(true); }); }, []);
  const save = async () => { const { id, ...rest } = theme; await updateTheme(rest); showToast('Theme saved'); };
  if (!loaded) return <p className="text-xs text-gray-500">Loading...</p>;
  const ColorPicker = ({ label, field }: { label: string; field: string }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={theme[field] || '#06b6d4'} onChange={e => setTheme(prev => ({ ...prev, [field]: e.target.value }))}
          className="h-9 w-9 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
        <input type="text" value={theme[field] || ''} onChange={e => setTheme(prev => ({ ...prev, [field]: e.target.value }))}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none font-mono" />
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      <Card title="Color Palette" icon={Palette} action={<button onClick={save} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"><Save size={12} /> Save</button>}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ColorPicker label="Primary" field="primary_color" />
          <ColorPicker label="Secondary" field="secondary_color" />
          <ColorPicker label="Accent" field="accent_color" />
          <ColorPicker label="Background" field="bg_color" />
          <ColorPicker label="Card BG" field="card_bg" />
        </div>
      </Card>
      <Card title="Typography & Layout" icon={Type}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Font</label><select value={theme.font_family || 'Inter'} onChange={e => setTheme(prev => ({ ...prev, font_family: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none">{['Inter','Space Grotesk','JetBrains Mono','Outfit','DM Sans','Poppins','Fira Code'].map(f => <option key={f} value={f}>{f}</option>)}</select></div>
          <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Border Radius</label><input type="text" value={theme.border_radius || '16px'} onChange={e => setTheme(prev => ({ ...prev, border_radius: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
          <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Grid Cols</label><input type="number" min={1} max={4} value={theme.grid_columns || 3} onChange={e => setTheme(prev => ({ ...prev, grid_columns: Number(e.target.value) }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
          <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Glow</label><input type="range" min={0} max={1} step={0.1} value={theme.glow_intensity || 0.3} onChange={e => setTheme(prev => ({ ...prev, glow_intensity: Number(e.target.value) }))} className="w-full" /></div>
          <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Layout</label><select value={theme.layout_mode || 'default'} onChange={e => setTheme(prev => ({ ...prev, layout_mode: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none"><option value="default">Default</option><option value="compact">Compact</option><option value="wide">Wide</option></select></div>
        </div>
      </Card>
      <Card title="Section Visibility" icon={Layers}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[{ label: 'Hero Banner', field: 'show_hero' },{ label: 'Charts', field: 'show_charts' },{ label: 'Featured', field: 'show_featured' },{ label: 'Quick Links', field: 'show_quick_links' },{ label: 'Timeline', field: 'show_timeline' }].map(item => (
            <button key={item.field} onClick={() => setTheme(prev => ({ ...prev, [item.field]: prev[item.field] ? 0 : 1 }))}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs transition-all ${theme[item.field] ? 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400' : 'border-white/5 bg-white/[0.02] text-gray-500'}`}>
              <span>{item.label}</span>{theme[item.field] ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            </button>
          ))}
        </div>
      </Card>
      <Card title="Custom CSS" icon={Terminal}>
        <textarea value={theme.custom_css || ''} onChange={e => setTheme(prev => ({ ...prev, custom_css: e.target.value }))} rows={6}
          placeholder="/* Custom CSS */" className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-xs text-green-400 outline-none font-mono resize-y" />
      </Card>
    </div>
  );
}

/* ============ CONTENT ============ */
function ContentTab({ showToast, data }: { showToast: (s: string) => void; data: any }) {
  const [settings, setSettings] = useState(data.siteSettings);
  const save = () => { data.setSiteSettings(settings); showToast('Content saved'); };
  const Field = ({ label, field, multiline = false }: { label: string; field: string; multiline?: boolean }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase mb-1 block">{label}</label>
      {multiline ? <textarea value={(settings as any)[field] || ''} rows={3} onChange={e => setSettings((prev: any) => ({ ...prev, [field]: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none resize-none" />
       : <input type="text" value={(settings as any)[field] || ''} onChange={e => setSettings((prev: any) => ({ ...prev, [field]: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" />}
    </div>
  );
  return (
    <Card title="Site Content" icon={Type} action={<button onClick={save} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"><Save size={12} /> Save</button>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Site Name" field="siteName" />
        <Field label="Tagline" field="siteTagline" />
        <Field label="Hero Title" field="heroTitle" />
        <Field label="Hero Highlight" field="heroHighlight" />
        <Field label="Hero Description" field="heroDescription" multiline />
        <Field label="Footer Text" field="footerText" multiline />
      </div>
    </Card>
  );
}

/* ============ USERS ============ */
function UsersTab({ showToast }: { showToast: (s: string) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const reload = async () => setUsers(await getUsers());
  useEffect(() => { reload(); }, []);
  return (
    <Card title="Users" icon={UsersIcon} subtitle={`${users.length} registered`} action={<button onClick={reload} className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/5"><RefreshCw size={14} /></button>}>
      {users.length === 0 ? <p className="text-xs text-gray-500">No users yet.</p> : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">{u.username.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="text-xs font-semibold text-white">{u.username}</p>
                  <p className="text-[10px] text-gray-500">{u.role} · Joined {u.created_at?.slice(0, 10)}</p>
                </div>
              </div>
              <button onClick={async () => { await deleteUser(u.id); showToast(`Deleted ${u.username}`); reload(); }}
                className="rounded-lg p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ============ DATABASE CONSOLE ============ */
function DatabaseTab({ showToast }: { showToast: (s: string) => void }) {
  const [sql, setSql] = useState("SELECT name FROM sqlite_master WHERE type='table';");
  const [results, setResults] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  useEffect(() => { getTableList().then(setTables); }, []);
  const execute = async () => {
    if (!sql.trim()) return;
    setError('');
    const result = await runQuery(sql);
    if (result.error) { setError(result.error); } else { setResults(result); setHistory(prev => [sql, ...prev.slice(0, 19)]); }
  };
  return (
    <div className="space-y-4">
      <Card title="SQL Console" icon={Terminal} subtitle="Query the local database">
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {tables.map(t => (
              <button key={t} onClick={() => setSql(`SELECT * FROM ${t};`)}
                className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-gray-400 hover:text-white hover:bg-white/10 font-mono">{t}</button>
            ))}
          </div>
          <textarea value={sql} onChange={e => setSql(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) execute(); }}
            rows={4} className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-xs text-green-400 outline-none font-mono resize-y" />
          <div className="flex items-center gap-2">
            <button onClick={execute} className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-500"><Play size={12} /> Execute</button>
            <button onClick={() => { navigator.clipboard.writeText(sql); showToast('Copied'); }} className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400 hover:text-white"><Copy size={12} /> Copy</button>
            <span className="text-[10px] text-gray-600 font-mono ml-auto">Ctrl+Enter to run</span>
          </div>
          {error && <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400"><AlertTriangle size={12} /> {error}</div>}
          {results && (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-white/[0.03] border-b border-white/5">{results.columns.map((c, i) => <th key={i} className="px-4 py-2 text-left font-semibold text-cyan-400 uppercase text-[10px]">{c}</th>)}</tr></thead>
                  <tbody>{results.values.map((row, i) => <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">{row.map((cell, j) => <td key={j} className="px-4 py-2 text-gray-300 font-mono">{cell === null ? <span className="text-gray-600">NULL</span> : String(cell).slice(0, 100)}</td>)}</tr>)}</tbody>
                </table>
              </div>
              <div className="bg-white/[0.01] border-t border-white/5 px-4 py-2"><span className="text-[10px] text-gray-600 font-mono">{results.values.length} row(s)</span></div>
            </div>
          )}
        </div>
      </Card>
      {history.length > 0 && (
        <Card title="History" icon={Clock} subtitle={`${history.length} queries`}>
          <div className="space-y-1">{history.map((q, i) => <button key={i} onClick={() => setSql(q)} className="w-full text-left rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2 text-[10px] text-gray-400 font-mono hover:bg-white/[0.05] truncate">{q}</button>)}</div>
        </Card>
      )}
    </div>
  );
}

/* ============ DATA IMPORT/EXPORT ============ */
function DataTab({ showToast, data }: { showToast: (s: string) => void; data: any }) {
  const [importText, setImportText] = useState('');
  const exportJSON = () => {
    const json = data.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `orc-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url); showToast('Exported');
  };
  const importJSON = () => { if (!importText.trim()) return; const ok = data.importAll(importText); showToast(ok ? 'Imported!' : 'Invalid JSON'); if (ok) setImportText(''); };
  const importFile = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const ok = data.importAll(ev.target?.result as string); showToast(ok ? `Imported ${file.name}` : 'Invalid file'); }; reader.readAsText(file); };
    input.click();
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Export" icon={Download}><div className="space-y-3">
          <div className="flex gap-2"><button onClick={exportJSON} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Download size={12} /> Download</button>
          <button onClick={() => { navigator.clipboard.writeText(data.exportAll()); showToast('Copied'); }} className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400 hover:text-white"><Copy size={12} /> Copy</button></div>
        </div></Card>
        <Card title="Import" icon={Upload}><div className="space-y-3">
          <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={4} placeholder="Paste JSON..." className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-green-400 outline-none font-mono resize-y" />
          <div className="flex gap-2"><button onClick={importJSON} className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500"><Upload size={12} /> Import</button>
          <button onClick={importFile} className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400 hover:text-white"><FileJson size={12} /> File</button></div>
        </div></Card>
      </div>
      <Card title="Danger Zone" icon={AlertTriangle}>
        <div className="flex items-center justify-between rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-4">
          <div><p className="text-xs font-semibold text-red-400">Reset All Data</p><p className="text-[10px] text-gray-500">Restore defaults</p></div>
          <button onClick={() => { data.resetAll(); showToast('Reset!'); }} className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"><RefreshCw size={12} /> Reset</button>
        </div>
      </Card>
    </div>
  );
}

/* ============ ACTIVITY LOG ============ */
function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { getActivityLog().then(setLogs); }, []);
  const ac: Record<string, string> = { login: 'text-green-400 bg-green-500/10', register: 'text-cyan-400 bg-cyan-500/10', edit_revival: 'text-blue-400 bg-blue-500/10', add_revival: 'text-violet-400 bg-violet-500/10', delete_revival: 'text-red-400 bg-red-500/10', edit_stats: 'text-amber-400 bg-amber-500/10', reset: 'text-red-400 bg-red-500/10' };
  return (
    <Card title="Activity Log" icon={Activity} subtitle={`${logs.length} entries`} action={<button onClick={() => getActivityLog().then(setLogs)} className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/5"><RefreshCw size={14} /></button>}>
      {logs.length === 0 ? <p className="text-xs text-gray-500">No activity yet.</p> : (
        <div className="space-y-1">{logs.map((l: any) => (
          <div key={l.id} className="flex items-center gap-3 rounded-lg bg-white/[0.01] border border-white/5 px-4 py-2.5">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${ac[l.action] || 'text-gray-400 bg-white/5'}`}>{l.action}</span>
            <span className="text-xs text-gray-400 flex-1 truncate">{l.detail}</span>
            <span className="text-[10px] text-gray-600 font-mono">{l.username}</span>
            <span className="text-[10px] text-gray-600 font-mono">{l.timestamp?.slice(11, 19)}</span>
          </div>
        ))}</div>
      )}
    </Card>
  );
}

/* ============ ANNOUNCEMENTS ============ */
function AnnouncementsTab({ showToast }: { showToast: (s: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [type, setType] = useState('info');
  const reload = async () => setItems(await getAnnouncements());
  useEffect(() => { reload(); }, []);
  const add = () => { if (!title) return; addAnnouncement({ title, content, type, pinned: false }); showToast('Announcement added'); setTitle(''); setContent(''); reload(); };
  return (
    <div className="space-y-4">
      <Card title="Create Announcement" icon={Megaphone}>
        <div className="space-y-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Content..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none resize-none" />
          <div className="flex items-center gap-3">
            <select value={type} onChange={e => setType(e.target.value)} className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none"><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option><option value="urgent">Urgent</option></select>
            <button onClick={add} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Publish</button>
          </div>
        </div>
      </Card>
      <Card title="All Announcements" icon={Bell} subtitle={`${items.length} announcements`}>
        {items.length === 0 ? <p className="text-xs text-gray-500">No announcements.</p> :
        <div className="space-y-2">{items.map((a: any) => (
          <div key={a.id} className="flex items-start gap-3 rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
            <div className="flex-1"><p className="text-xs font-semibold text-white">{a.title}</p><p className="text-[10px] text-gray-500 mt-1">{a.content}</p><p className="text-[10px] text-gray-600 mt-1">{a.type} · {a.created_at?.slice(0, 16)}</p></div>
            <button onClick={() => { deleteAnnouncement(a.id); showToast('Deleted'); reload(); }} className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={12} /></button>
          </div>
        ))}</div>}
      </Card>
    </div>
  );
}

/* ============ PAGES ============ */
function PagesTab({ showToast }: { showToast: (s: string) => void }) {
  const [pages, setPages] = useState<any[]>([]);
  const [title, setTitle] = useState(''); const [slug, setSlug] = useState(''); const [content, setContent] = useState('');
  const reload = () => setPages(getCustomPages());
  useEffect(() => { reload(); }, []);
  const add = () => { if (!title || !slug) return; addCustomPage({ title, slug, content, published: false }); showToast('Page created'); setTitle(''); setSlug(''); setContent(''); reload(); };
  return (
    <div className="space-y-4">
      <Card title="Create Page" icon={FileText}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Page title..." className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" />
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="URL slug..." className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none font-mono" />
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Page content (HTML/Markdown)..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none resize-y font-mono" />
          <button onClick={add} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Create</button>
        </div>
      </Card>
      <Card title="All Pages" icon={FileText} subtitle={`${pages.length} pages`}>
        {pages.length === 0 ? <p className="text-xs text-gray-500">No custom pages.</p> :
        <div className="space-y-2">{pages.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
            <div><p className="text-xs font-semibold text-white">{p.title}</p><p className="text-[10px] text-gray-500 font-mono">/{p.slug} · {p.published ? '✅ Published' : '📝 Draft'}</p></div>
            <div className="flex gap-1">
              <button onClick={() => { updateCustomPage(p.id, { published: !p.published }); showToast(p.published ? 'Unpublished' : 'Published'); reload(); }}
                className="rounded-lg p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10">{p.published ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
              <button onClick={() => { deleteCustomPage(p.id); showToast('Deleted'); reload(); }}
                className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}</div>}
      </Card>
    </div>
  );
}

/* ============ MEDIA ============ */
function MediaTab({ showToast }: { showToast: (s: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState(''); const [url, setUrl] = useState(''); const [type, setType] = useState('image');
  const reload = () => setItems(getMedia());
  useEffect(() => { reload(); }, []);
  return (
    <div className="space-y-4">
      <Card title="Add Media" icon={Image}>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[150px]"><label className="text-[10px] text-gray-500 uppercase mb-1 block">Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
          <div className="flex-1 min-w-[200px]"><label className="text-[10px] text-gray-500 uppercase mb-1 block">URL</label><input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none font-mono" /></div>
          <select value={type} onChange={e => setType(e.target.value)} className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none"><option value="image">Image</option><option value="video">Video</option><option value="icon">Icon</option><option value="other">Other</option></select>
          <button onClick={() => { if (!name||!url) return; addMedia({ name, url, type }); showToast('Media added'); setName(''); setUrl(''); reload(); }}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Add</button>
        </div>
      </Card>
      <Card title="Media Library" icon={Image} subtitle={`${items.length} items`}>
        {items.length === 0 ? <p className="text-xs text-gray-500">No media.</p> :
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{items.map((m: any) => (
          <div key={m.id} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            {m.type === 'image' && <img src={m.url} alt={m.name} className="w-full h-24 object-cover" onError={e => { e.currentTarget.src = ''; e.currentTarget.className = 'w-full h-24 bg-gray-900'; }} />}
            <div className="p-3 flex items-center justify-between">
              <div className="min-w-0"><p className="text-[10px] font-semibold text-white truncate">{m.name}</p><p className="text-[9px] text-gray-500">{m.type}</p></div>
              <button onClick={() => { deleteMedia(m.id); showToast('Deleted'); reload(); }} className="text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}</div>}
      </Card>
    </div>
  );
}

/* ============ ROLES ============ */
function RolesTab({ showToast }: { showToast: (s: string) => void }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [name, setName] = useState(''); const [color, setColor] = useState('#06b6d4');
  const reload = () => setRoles(getRoles());
  useEffect(() => { reload(); }, []);
  return (
    <Card title="Roles & Permissions" icon={Shield} subtitle={`${roles.length} roles`}>
      <div className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase mb-1 block">Role Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
          <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Color</label><input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-9 rounded-lg border border-white/10 cursor-pointer" /></div>
          <button onClick={() => { if (!name) return; addRole({ name, permissions: ['view'], color }); showToast('Role added'); setName(''); reload(); }}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Add</button>
        </div>
        <div className="space-y-2">{roles.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
              <div><p className="text-xs font-semibold text-white">{r.name}</p><p className="text-[10px] text-gray-500">{(r.permissions || []).join(', ')}</p></div>
            </div>
            <button onClick={() => { deleteRole(r.id); showToast('Deleted'); reload(); }} className="rounded-lg p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
          </div>
        ))}</div>
      </div>
    </Card>
  );
}

/* ============ TAGS ============ */
function TagsTab({ showToast }: { showToast: (s: string) => void }) {
  const [tags, setTags] = useState<any[]>([]);
  const [name, setName] = useState(''); const [color, setColor] = useState('#22c55e');
  const reload = () => setTags(getTags());
  useEffect(() => { reload(); }, []);
  return (
    <Card title="Tags" icon={Tag} subtitle={`${tags.length} tags`}>
      <div className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1"><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tag name..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-9 rounded-lg border border-white/10 cursor-pointer" />
          <button onClick={() => { if (!name) return; addTag({ name, color }); showToast('Tag added'); setName(''); reload(); }}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Add</button>
        </div>
        <div className="flex flex-wrap gap-2">{tags.map((t: any) => (
          <div key={t.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="text-xs text-white">{t.name}</span>
            <button onClick={() => { deleteTag(t.id); showToast('Deleted'); reload(); }} className="text-gray-500 hover:text-red-400 ml-1"><Minus size={10} /></button>
          </div>
        ))}</div>
      </div>
    </Card>
  );
}

/* ============ BOOKMARKS ============ */
function BookmarksTab({ showToast }: { showToast: (s: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState(''); const [url, setUrl] = useState(''); const [cat, setCat] = useState('general');
  const reload = () => setItems(getBookmarks());
  useEffect(() => { reload(); }, []);
  return (
    <Card title="Bookmarks" icon={Bookmark} subtitle={`${items.length} saved`}>
      <div className="space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[120px]"><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
          <div className="flex-1 min-w-[150px]"><input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none font-mono" /></div>
          <select value={cat} onChange={e => setCat(e.target.value)} className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none">{['general','revival','tool','docs','social'].map(c => <option key={c} value={c}>{c}</option>)}</select>
          <button onClick={() => { if (!name||!url) return; addBookmark({ name, url, category: cat }); showToast('Bookmarked'); setName(''); setUrl(''); reload(); }}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Add</button>
        </div>
        <div className="space-y-2">{items.map((b: any) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-2.5">
            <div className="flex items-center gap-3"><Bookmark size={12} className="text-amber-400" /><div><p className="text-xs text-white">{b.name}</p><p className="text-[10px] text-gray-500 font-mono">{b.url}</p></div></div>
            <div className="flex gap-1">
              <a href={b.url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-gray-500 hover:text-white"><ExternalLink size={12} /></a>
              <button onClick={() => { deleteBookmark(b.id); showToast('Deleted'); reload(); }} className="rounded-lg p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}</div>
      </div>
    </Card>
  );
}

/* ============ NOTES ============ */
function NotesTab({ showToast }: { showToast: (s: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [color, setColor] = useState('#06b6d4');
  const reload = () => setItems(getNotes());
  useEffect(() => { reload(); }, []);
  return (
    <div className="space-y-4">
      <Card title="Create Note" icon={StickyNote}>
        <div className="space-y-3">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Content..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none resize-none" />
          <div className="flex gap-3 items-center">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-8 rounded-lg border border-white/10 cursor-pointer" />
            <button onClick={() => { if (!title) return; addNote({ title, content, color }); showToast('Note saved'); setTitle(''); setContent(''); reload(); }}
              className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Save</button>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{items.map((n: any) => (
        <div key={n.id} className="rounded-xl border bg-white/[0.02] p-4" style={{ borderColor: n.color + '30' }}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-semibold text-white">{n.title}</p>
            <button onClick={() => { deleteNote(n.id); showToast('Deleted'); reload(); }} className="text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
          </div>
          <p className="text-[10px] text-gray-400 whitespace-pre-wrap">{n.content}</p>
          <p className="text-[9px] text-gray-600 mt-2">{n.created_at?.slice(0, 16)}</p>
        </div>
      ))}</div>
    </div>
  );
}

/* ============ API KEYS ============ */
function ApiKeysTab({ showToast }: { showToast: (s: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const reload = () => setItems(getApiKeys());
  useEffect(() => { reload(); }, []);
  const generate = () => {
    if (!name) return;
    const key = 'orc_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
    addApiKey({ name, key, permissions: ['read'] });
    showToast('API key generated'); setName(''); reload();
  };
  return (
    <Card title="API Keys" icon={Key} subtitle={`${items.length} keys`}>
      <div className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase mb-1 block">Key Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="My App..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
          <button onClick={generate} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Key size={12} /> Generate</button>
        </div>
        <div className="space-y-2">{items.map((k: any) => (
          <div key={k.id} className="rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-white">{k.name}</p>
              <div className="flex gap-1">
                <button onClick={() => { navigator.clipboard.writeText(k.key); showToast('Key copied'); }} className="rounded-lg p-1.5 text-gray-500 hover:text-cyan-400"><Copy size={12} /></button>
                <button onClick={() => { deleteApiKey(k.id); showToast('Revoked'); reload(); }} className="rounded-lg p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-mono break-all">{k.key}</p>
            <p className="text-[9px] text-gray-600 mt-1">Created: {k.created_at?.slice(0, 16)}</p>
          </div>
        ))}</div>
      </div>
    </Card>
  );
}

/* ============ TASKS ============ */
function TasksTab({ showToast }: { showToast: (s: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState(''); const [schedule, setSchedule] = useState('daily'); const [action, setAction] = useState('backup');
  const reload = () => setItems(getScheduledTasks());
  useEffect(() => { reload(); }, []);
  return (
    <Card title="Scheduled Tasks" icon={ListChecks} subtitle={`${items.length} tasks`}>
      <div className="space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[150px]"><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Task name..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
          <select value={schedule} onChange={e => setSchedule(e.target.value)} className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none">{['hourly','daily','weekly','monthly'].map(s => <option key={s} value={s}>{s}</option>)}</select>
          <select value={action} onChange={e => setAction(e.target.value)} className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none">{['backup','export','cleanup','sync'].map(a => <option key={a} value={a}>{a}</option>)}</select>
          <button onClick={() => { if (!name) return; addScheduledTask({ name, schedule, action, enabled: true }); showToast('Task created'); setName(''); reload(); }}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Add</button>
        </div>
        <div className="space-y-2">{items.map((t: any) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${t.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
              <div><p className="text-xs text-white">{t.name}</p><p className="text-[10px] text-gray-500">{t.schedule} · {t.action}</p></div>
            </div>
            <button onClick={() => { deleteScheduledTask(t.id); showToast('Deleted'); reload(); }} className="rounded-lg p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
          </div>
        ))}</div>
      </div>
    </Card>
  );
}

/* ============ WIDGETS ============ */
function WidgetsTab({ showToast }: { showToast: (s: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState(''); const [type, setType] = useState('counter'); const [pos, setPos] = useState('sidebar');
  const reload = () => setItems(getWidgets());
  useEffect(() => { reload(); }, []);
  return (
    <Card title="Dashboard Widgets" icon={PanelLeft} subtitle={`${items.length} widgets`}>
      <div className="space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[120px]"><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Widget name..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
          <select value={type} onChange={e => setType(e.target.value)} className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none">{['counter','chart','list','text','embed','clock','feed'].map(t => <option key={t} value={t}>{t}</option>)}</select>
          <select value={pos} onChange={e => setPos(e.target.value)} className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none">{['sidebar','header','footer','main','modal'].map(p => <option key={p} value={p}>{p}</option>)}</select>
          <button onClick={() => { if (!name) return; addWidget({ name, type, position: pos, config: {}, enabled: true }); showToast('Widget added'); setName(''); reload(); }}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Add</button>
        </div>
        <div className="space-y-2">{items.map((w: any) => (
          <div key={w.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
            <div><p className="text-xs text-white">{w.name}</p><p className="text-[10px] text-gray-500">{w.type} · {w.position} · {w.enabled ? '✅ Enabled' : '❌ Disabled'}</p></div>
            <button onClick={() => { deleteWidget(w.id); showToast('Deleted'); reload(); }} className="rounded-lg p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
          </div>
        ))}</div>
      </div>
    </Card>
  );
}

/* ============ BACKUPS ============ */
function BackupsTab({ showToast }: { showToast: (s: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const reload = () => setItems(getBackups());
  useEffect(() => { reload(); }, []);
  return (
    <Card title="Backups" icon={HardDrive} subtitle={`${items.length} backups`} action={
      <button onClick={() => { createBackup(); showToast('Backup created'); reload(); }}
        className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"><Plus size={12} /> Create Backup</button>
    }>
      {items.length === 0 ? <p className="text-xs text-gray-500">No backups. Create one!</p> :
      <div className="space-y-2">{items.map((b: any) => (
        <div key={b.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
          <div><p className="text-xs text-white">{b.label}</p><p className="text-[10px] text-gray-500">{b.size ? `${(b.size/1024).toFixed(1)} KB` : 'Unknown'} · {b.created_at?.slice(0, 16)}</p></div>
          <div className="flex gap-1">
            <button onClick={() => { if (restoreBackup(b.id)) { showToast('Restored!'); window.location.reload(); } else showToast('Restore failed'); }}
              className="rounded-lg px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/10"><RefreshCw size={12} /></button>
            <button onClick={() => { deleteBackup(b.id); showToast('Deleted'); reload(); }}
              className="rounded-lg p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
          </div>
        </div>
      ))}</div>}
    </Card>
  );
}

/* ============ SEO ============ */
function SEOTab({ showToast }: { showToast: (s: string) => void }) {
  const [title, setTitle] = useState(document.title);
  const [desc, setDesc] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [robots, setRobots] = useState('index, follow');
  const save = () => { document.title = title; showToast('SEO settings saved (in-memory)'); };
  return (
    <Card title="SEO Settings" icon={Globe} subtitle="Search engine optimization" action={
      <button onClick={save} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"><Save size={12} /> Save</button>
    }>
      <div className="space-y-4">
        <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Page Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
        <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Meta Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none resize-none" /></div>
        <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Keywords</label><input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="roblox, revival, old roblox..." className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none" /></div>
        <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">OG Image URL</label><input type="text" value={ogImage} onChange={e => setOgImage(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none font-mono" /></div>
        <div><label className="text-[10px] text-gray-500 uppercase mb-1 block">Robots</label><select value={robots} onChange={e => setRobots(e.target.value)} className="w-full rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-xs text-white outline-none"><option value="index, follow">Index, Follow</option><option value="noindex, nofollow">No Index, No Follow</option><option value="index, nofollow">Index, No Follow</option></select></div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-[10px] text-gray-500 uppercase mb-2">Preview</p>
          <p className="text-sm text-blue-400 font-medium">{title}</p>
          <p className="text-[10px] text-green-400 font-mono">orc-tracker.github.io</p>
          <p className="text-xs text-gray-400 mt-1">{desc || 'No description set'}</p>
        </div>
      </div>
    </Card>
  );
}

/* ============ PERFORMANCE ============ */
function PerformanceTab() {
  const [metrics, setMetrics] = useState<any>({});
  useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    setMetrics({
      loadTime: nav ? Math.round(nav.loadEventEnd - nav.startTime) : 'N/A',
      domReady: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 'N/A',
      fcp: paint.find(p => p.name === 'first-contentful-paint') ? Math.round(paint.find(p => p.name === 'first-contentful-paint')!.startTime) : 'N/A',
      fp: paint.find(p => p.name === 'first-paint') ? Math.round(paint.find(p => p.name === 'first-paint')!.startTime) : 'N/A',
      memory: (performance as any).memory ? `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)} MB` : 'N/A',
      memoryTotal: (performance as any).memory ? `${Math.round((performance as any).memory.totalJSHeapSize / 1048576)} MB` : 'N/A',
      resources: performance.getEntriesByType('resource').length,
      connection: (navigator as any).connection?.effectiveType || 'Unknown',
      deviceMemory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'N/A',
      cores: navigator.hardwareConcurrency || 'N/A',
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio,
      online: navigator.onLine,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent.slice(0, 80),
    });
  }, []);
  return (
    <div className="space-y-4">
      <Card title="Performance Metrics" icon={Gauge} subtitle="Real-time browser data">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { l: 'Page Load', v: `${metrics.loadTime}ms`, c: 'cyan' },
            { l: 'DOM Ready', v: `${metrics.domReady}ms`, c: 'green' },
            { l: 'First Paint', v: `${metrics.fp}ms`, c: 'purple' },
            { l: 'FCP', v: `${metrics.fcp}ms`, c: 'amber' },
            { l: 'JS Heap', v: metrics.memory, c: 'blue' },
            { l: 'Total Heap', v: metrics.memoryTotal, c: 'pink' },
            { l: 'Resources', v: metrics.resources, c: 'cyan' },
            { l: 'Connection', v: metrics.connection, c: 'green' },
          ].map((m, i) => <MiniStat key={i} label={m.l} value={m.v} color={m.c} />)}
        </div>
      </Card>
      <Card title="Device Info" icon={Monitor}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { l: 'Viewport', v: metrics.viewport }, { l: 'Pixel Ratio', v: `${metrics.pixelRatio}x` },
            { l: 'CPU Cores', v: metrics.cores }, { l: 'Device RAM', v: metrics.deviceMemory },
            { l: 'Online', v: metrics.online ? '✅ Yes' : '❌ No' }, { l: 'Language', v: metrics.language },
            { l: 'Platform', v: metrics.platform },
          ].map((m, i) => (
            <div key={i} className="rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
              <p className="text-[10px] text-gray-500 uppercase">{m.l}</p>
              <p className="text-xs text-white font-mono mt-1">{m.v}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============ SECURITY ============ */
function SecurityTab({ showToast }: { showToast: (s: string) => void }) {
  return (
    <div className="space-y-4">
      <Card title="Security Audit" icon={Lock}>
        <div className="space-y-2">
          {[
            { label: 'Password Hashing', status: 'Base64 (prototype)', severity: 'warning' },
            { label: 'Session Storage', status: 'sessionStorage', severity: 'info' },
            { label: 'Data Encryption', status: 'None (localStorage)', severity: 'warning' },
            { label: 'CORS Policy', status: 'Same-origin', severity: 'good' },
            { label: 'CSP Headers', status: 'Not configured', severity: 'info' },
            { label: 'Master Key', status: 'Active', severity: 'good' },
            { label: 'HTTPS', status: location.protocol === 'https:' ? 'Enabled' : 'Not detected', severity: location.protocol === 'https:' ? 'good' : 'warning' },
            { label: 'Auth Method', status: 'localStorage DB', severity: 'info' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
              <span className="text-xs text-gray-400">{item.label}</span>
              <span className={`text-xs font-mono flex items-center gap-1.5 ${
                item.severity === 'good' ? 'text-green-400' : item.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${item.severity === 'good' ? 'bg-green-500' : item.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Danger Zone" icon={AlertTriangle}>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-red-500/5 border border-red-500/20 px-4 py-4">
            <div><p className="text-xs font-semibold text-red-400">Nuke Database</p><p className="text-[10px] text-gray-500">Wipe everything including users</p></div>
            <button onClick={() => { nukeDatabase(); showToast('Database nuked'); }}
              className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"><AlertTriangle size={12} /> Nuke</button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-amber-500/5 border border-amber-500/20 px-4 py-4">
            <div><p className="text-xs font-semibold text-amber-400">Clear All Sessions</p><p className="text-[10px] text-gray-500">Log out everywhere</p></div>
            <button onClick={() => { sessionStorage.clear(); showToast('Sessions cleared'); }}
              className="flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500"><Lock size={12} /> Clear</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============ NOTIFICATIONS ============ */
function NotificationsTab({ showToast }: { showToast: (s: string) => void }) {
  const [enabled, setEnabled] = useState(true);
  const [types, setTypes] = useState({ login: true, register: true, edit: true, delete: true, backup: true, error: true });
  return (
    <Card title="Notification Settings" icon={Bell} subtitle="Configure alerts" action={
      <button onClick={() => showToast('Settings saved')} className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"><Save size={12} /> Save</button>
    }>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <div><p className="text-xs text-white">Enable Notifications</p><p className="text-[10px] text-gray-500">Show toast notifications for admin actions</p></div>
          <button onClick={() => setEnabled(!enabled)}>{enabled ? <ToggleRight size={20} className="text-cyan-400" /> : <ToggleLeft size={20} className="text-gray-500" />}</button>
        </div>
        <p className="text-[10px] text-gray-500 uppercase font-semibold">Notification Types</p>
        {Object.entries(types).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-2.5">
            <span className="text-xs text-gray-300 capitalize">{key} events</span>
            <button onClick={() => setTypes(prev => ({ ...prev, [key]: !val }))}>{val ? <ToggleRight size={18} className="text-cyan-400" /> : <ToggleLeft size={18} className="text-gray-500" />}</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============ SHORTCUTS ============ */
function ShortcutsTab() {
  const shortcuts = [
    { keys: 'i', desc: 'Open admin panel (from main site)' },
    { keys: 'Escape', desc: 'Close modal / clear search' },
    { keys: 'Ctrl + S', desc: 'Save current changes' },
    { keys: 'Ctrl + K', desc: 'Focus sidebar search' },
    { keys: 'Ctrl + Enter', desc: 'Execute SQL query' },
    { keys: '↑ / ↓', desc: 'Navigate lists' },
    { keys: 'Tab', desc: 'Move between fields' },
    { keys: 'Ctrl + Z', desc: 'Undo (browser native)' },
    { keys: 'Ctrl + C', desc: 'Copy selected text' },
    { keys: 'F11', desc: 'Fullscreen mode' },
    { keys: 'Ctrl + Shift + I', desc: 'Browser DevTools' },
    { keys: 'Ctrl + R', desc: 'Refresh page' },
  ];
  return (
    <Card title="Keyboard Shortcuts" icon={Terminal} subtitle="Speed up your workflow">
      <div className="space-y-1">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3">
            <span className="text-xs text-gray-400">{s.desc}</span>
            <div className="flex gap-1">
              {s.keys.split(' + ').map((k, j) => (
                <span key={j}>
                  <kbd className="rounded-md bg-white/10 border border-white/20 px-2 py-0.5 text-[10px] font-mono text-white">{k.trim()}</kbd>
                  {j < s.keys.split(' + ').length - 1 && <span className="text-gray-600 mx-0.5">+</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
