import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  revivals as defaultRevivals,
  communityStats as defaultCommunityStats,
  timelineEvents as defaultTimelineEvents,
  eraDistribution as defaultEraDistribution,
  monthlyGrowth as defaultMonthlyGrowth,
  statusDistribution as defaultStatusDistribution,
  type Revival,
} from '../data/revivals';

export interface SiteSettings {
  heroTitle: string;
  heroHighlight: string;
  heroDescription: string;
  footerText: string;
  siteName: string;
  siteTagline: string;
}

const defaultSiteSettings: SiteSettings = {
  heroTitle: 'Old Roblox Revival',
  heroHighlight: 'Community Tracker',
  heroDescription: 'Tracking 250+ revival projects from the Old Roblox Community (ORC). Data sourced from r/oldrobloxrevivals, revival-list.com, and community wikis.',
  footerText: 'Data sourced from r/oldrobloxrevivals, revival-list.com, and community wikis. This is a prototype — numbers are estimated. Not affiliated with Roblox Corporation.',
  siteName: 'ORC',
  siteTagline: 'Old Roblox Revival Statistics',
};

export interface CommunityStats {
  subredditMembers: number;
  subredditName: string;
  totalRevivals: number;
  activeRevivals: number;
  deadRevivals: number;
  launcherCount: number;
  privateRevivals: number;
  wipRevivals: number;
  totalEstimatedPlayers: number;
  mostPopularEra: string;
  oldestRevival: string;
  newestRevival: string;
  revivalListUrl: string;
}

export interface TimelineEvent {
  year: number;
  event: string;
  type: string;
}

export interface EraDistItem {
  era: string;
  count: number;
  percentage: number;
}

export interface MonthlyGrowthItem {
  month: string;
  players: number;
  revivals: number;
}

export interface StatusDistItem {
  name: string;
  value: number;
  color: string;
}

interface DataContextType {
  revivals: Revival[];
  communityStats: CommunityStats;
  timelineEvents: TimelineEvent[];
  eraDistribution: EraDistItem[];
  monthlyGrowth: MonthlyGrowthItem[];
  statusDistribution: StatusDistItem[];
  siteSettings: SiteSettings;

  // Mutations
  setRevivals: (r: Revival[]) => void;
  addRevival: (r: Revival) => void;
  updateRevival: (id: string, r: Partial<Revival>) => void;
  deleteRevival: (id: string) => void;
  setCommunityStats: (s: CommunityStats) => void;
  setTimelineEvents: (e: TimelineEvent[]) => void;
  addTimelineEvent: (e: TimelineEvent) => void;
  deleteTimelineEvent: (index: number) => void;
  setEraDistribution: (e: EraDistItem[]) => void;
  setMonthlyGrowth: (g: MonthlyGrowthItem[]) => void;
  setStatusDistribution: (s: StatusDistItem[]) => void;
  setSiteSettings: (s: SiteSettings) => void;

  // Import / Export / Reset
  exportAll: () => string;
  importAll: (json: string) => boolean;
  resetAll: () => void;
  hasCustomData: boolean;
}

const STORAGE_KEY = 'orc-tracker-data';

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(data: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();

  const [revivals, setRevivals] = useState<Revival[]>(stored?.revivals ?? defaultRevivals);
  const [communityStats, setCommunityStats] = useState<CommunityStats>(stored?.communityStats ?? defaultCommunityStats);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(stored?.timelineEvents ?? defaultTimelineEvents);
  const [eraDistribution, setEraDistribution] = useState<EraDistItem[]>(stored?.eraDistribution ?? defaultEraDistribution);
  const [monthlyGrowth, setMonthlyGrowth] = useState<MonthlyGrowthItem[]>(stored?.monthlyGrowth ?? defaultMonthlyGrowth);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistItem[]>(stored?.statusDistribution ?? defaultStatusDistribution);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(stored?.siteSettings ?? defaultSiteSettings);
  const [hasCustomData, setHasCustomData] = useState(!!stored);

  // Persist on change
  useEffect(() => {
    const data = { revivals, communityStats, timelineEvents, eraDistribution, monthlyGrowth, statusDistribution, siteSettings };
    saveToStorage(data);
    setHasCustomData(true);
  }, [revivals, communityStats, timelineEvents, eraDistribution, monthlyGrowth, statusDistribution, siteSettings]);

  const addRevival = useCallback((r: Revival) => {
    setRevivals(prev => [...prev, r]);
  }, []);

  const updateRevival = useCallback((id: string, updates: Partial<Revival>) => {
    setRevivals(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRevival = useCallback((id: string) => {
    setRevivals(prev => prev.filter(r => r.id !== id));
  }, []);

  const addTimelineEvent = useCallback((e: TimelineEvent) => {
    setTimelineEvents(prev => [...prev, e].sort((a, b) => a.year - b.year));
  }, []);

  const deleteTimelineEvent = useCallback((index: number) => {
    setTimelineEvents(prev => prev.filter((_, i) => i !== index));
  }, []);

  const exportAll = useCallback(() => {
    return JSON.stringify({ revivals, communityStats, timelineEvents, eraDistribution, monthlyGrowth, statusDistribution, siteSettings }, null, 2);
  }, [revivals, communityStats, timelineEvents, eraDistribution, monthlyGrowth, statusDistribution, siteSettings]);

  const importAll = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (data.revivals) setRevivals(data.revivals);
      if (data.communityStats) setCommunityStats(data.communityStats);
      if (data.timelineEvents) setTimelineEvents(data.timelineEvents);
      if (data.eraDistribution) setEraDistribution(data.eraDistribution);
      if (data.monthlyGrowth) setMonthlyGrowth(data.monthlyGrowth);
      if (data.statusDistribution) setStatusDistribution(data.statusDistribution);
      if (data.siteSettings) setSiteSettings(data.siteSettings);
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetAll = useCallback(() => {
    setRevivals(defaultRevivals);
    setCommunityStats(defaultCommunityStats);
    setTimelineEvents(defaultTimelineEvents);
    setEraDistribution(defaultEraDistribution);
    setMonthlyGrowth(defaultMonthlyGrowth);
    setStatusDistribution(defaultStatusDistribution);
    setSiteSettings(defaultSiteSettings);
    localStorage.removeItem(STORAGE_KEY);
    setHasCustomData(false);
  }, []);

  return (
    <DataContext.Provider value={{
      revivals, communityStats, timelineEvents, eraDistribution, monthlyGrowth, statusDistribution, siteSettings,
      setRevivals, addRevival, updateRevival, deleteRevival,
      setCommunityStats, setTimelineEvents, addTimelineEvent, deleteTimelineEvent,
      setEraDistribution, setMonthlyGrowth, setStatusDistribution, setSiteSettings,
      exportAll, importAll, resetAll, hasCustomData,
    }}>
      {children}
    </DataContext.Provider>
  );
}
