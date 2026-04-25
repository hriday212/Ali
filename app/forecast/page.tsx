'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Calendar, TrendingUp, TrendingDown, Eye, Heart, MessageCircle, 
  Share2, ArrowUpRight, ArrowDownRight, Minus, Loader2, ChevronDown, ChevronUp,
  Youtube, Music2, Instagram, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

// ── DateRange Presets ──
type RangeKey = 'today' | '7d' | '14d' | '30d' | 'custom';
const RANGE_OPTIONS: { key: RangeKey; label: string; days: number }[] = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7d', label: '7D', days: 7 },
  { key: '14d', label: '14D', days: 14 },
  { key: '30d', label: '30D', days: 30 },
];

function getDateRange(rangeKey: RangeKey, days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { start, end };
}

function filterHistoryByRange(history: any[], start: Date, end: Date) {
  return history.filter((h: any) => {
    const t = new Date(h.time);
    return t >= start && t <= end;
  });
}

function getPreviousPeriod(start: Date, end: Date): { start: Date; end: Date } {
  const duration = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start.getTime()),
  };
}

// ── KPI Card ──
function KpiCard({ label, value, prevValue, icon: Icon, color, delay }: {
  label: string; value: number; prevValue: number; icon: any; color: string; delay: number;
}) {
  const pctChange = prevValue > 0 ? ((value - prevValue) / prevValue * 100) : 0;
  const isUp = pctChange > 0;
  const isFlat = pctChange === 0;
  
  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="glass-card p-6 border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
        <Icon className={`w-20 h-20 ${color}`} />
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</span>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-black italic tracking-tighter text-white mb-1">{formatNum(value)}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
            prev: {formatNum(prevValue)}
          </p>
        </div>
        
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${
          isFlat ? 'bg-slate-500/10 text-slate-400' :
          isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isFlat ? <Minus className="w-3 h-3" /> : isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {isFlat ? '0%' : `${isUp ? '+' : ''}${pctChange.toFixed(1)}%`}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Forecast Page ──
export default function ForecastPage() {
  const [activeRange, setActiveRange] = useState<RangeKey>('7d');
  const [loading, setLoading] = useState(true);
  const [allScans, setAllScans] = useState<any[]>([]);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await safeFetchJson(API_ROUTES.SCANS);
        if (data?.scans) setAllScans(data.scans);
      } catch (e) {
        console.error('Failed to load forecast data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute date ranges
  const rangeDays = RANGE_OPTIONS.find(r => r.key === activeRange)?.days || 7;
  let currentStart: Date, currentEnd: Date;
  if (activeRange === 'custom' && customStart && customEnd) {
    currentStart = new Date(customStart);
    currentEnd = new Date(customEnd);
    currentEnd.setHours(23, 59, 59); // Include full end day
  } else {
    const range = getDateRange(activeRange, rangeDays);
    currentStart = range.start;
    currentEnd = range.end;
  }
  const { start: prevStart, end: prevEnd } = getPreviousPeriod(currentStart, currentEnd);

  // Aggregate data across all nodes for both periods
  const { currentKPIs, prevKPIs, platformDist, timeSeriesCurrent, timeSeriesPrev, hourlyPattern } = useMemo(() => {
    let cViews = 0, cLikes = 0, cComments = 0, cShares = 0;
    let pViews = 0, pLikes = 0, pComments = 0, pShares = 0;
    const platViews: Record<string, number> = {};
    const timeMapCurrent: Record<string, number> = {};
    const timeMapPrev: Record<string, number> = {};

    for (const scan of allScans) {
      const history = scan.history || [];
      
      // Current period
      const currentH = filterHistoryByRange(history, currentStart, currentEnd);
      for (const h of currentH) {
        cViews += h.totalViews || 0;
        cLikes += h.totalLikes || 0;
        cComments += h.totalComments || 0;
        cShares += h.totalShares || 0;
        
        const dayLabel = new Date(h.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        timeMapCurrent[dayLabel] = (timeMapCurrent[dayLabel] || 0) + (h.totalViews || 0);
      }

      // Previous period
      const prevH = filterHistoryByRange(history, prevStart, prevEnd);
      for (const h of prevH) {
        pViews += h.totalViews || 0;
        pLikes += h.totalLikes || 0;
        pComments += h.totalComments || 0;
        pShares += h.totalShares || 0;
        
        const dayLabel = new Date(h.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        timeMapPrev[dayLabel] = (timeMapPrev[dayLabel] || 0) + (h.totalViews || 0);
      }

      // Platform distribution (use latest views from scan)
      const plat = scan.platform || 'unknown';
      platViews[plat] = (platViews[plat] || 0) + (scan.lastViews || 0);
    }

    const totalPlatViews = Object.values(platViews).reduce((a, b) => a + b, 0) || 1;
    const platformDist = Object.entries(platViews).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: +((value / totalPlatViews) * 100).toFixed(1),
      raw: value,
    }));

    // Build matched time-series arrays for the bar chart
    const allDays = new Set([...Object.keys(timeMapCurrent), ...Object.keys(timeMapPrev)]);
    const timeSeriesCurrent = Array.from(allDays).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(day => ({ day, views: timeMapCurrent[day] || 0 }));
    const timeSeriesPrev = Array.from(allDays).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(day => ({ day, views: timeMapPrev[day] || 0 }));

    // Merge for comparative bar chart
    const mergedTimeSeries = Array.from(allDays).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(day => ({
        day,
        current: timeMapCurrent[day] || 0,
        previous: timeMapPrev[day] || 0,
      }));

    // Hourly activity pattern (Show GAINS/DELTAS per hour instead of totals)
    const hourMapCurrent: Record<string, number> = {};
    const hourMapPrev: Record<string, number> = {};
    const hourLabels = Array.from({ length: 24 }, (_, i) => {
      const h = i % 12 || 12;
      const ampm = i < 12 ? 'AM' : 'PM';
      return `${h} ${ampm}`;
    });
    hourLabels.forEach(l => { hourMapCurrent[l] = 0; hourMapPrev[l] = 0; });

    for (const scan of allScans) {
      const history = scan.history || [];
      
      // Compute Current Period Gains
      for (let i = 0; i < history.length; i++) {
        const h = history[i];
        const hTime = new Date(h.time).getTime();
        if (hTime >= currentStart.getTime() && hTime <= currentEnd.getTime()) {
          const prevH = history[i - 1];
          const delta = prevH ? Math.max(0, (h.totalViews || 0) - (prevH.totalViews || 0)) : 0;
          const hr = new Date(h.time).getHours();
          const label = hourLabels[hr];
          hourMapCurrent[label] = (hourMapCurrent[label] || 0) + delta;
        }
      }

      // Compute Previous Period Gains
      for (let i = 0; i < history.length; i++) {
        const h = history[i];
        const hTime = new Date(h.time).getTime();
        if (hTime >= prevStart.getTime() && hTime <= prevEnd.getTime()) {
          const prevH = history[i - 1];
          const delta = prevH ? Math.max(0, (h.totalViews || 0) - (prevH.totalViews || 0)) : 0;
          const hr = new Date(h.time).getHours();
          const label = hourLabels[hr];
          hourMapPrev[label] = (hourMapPrev[label] || 0) + delta;
        }
      }
    }

    const hourlyPattern = hourLabels.map(hour => ({
      hour,
      current: hourMapCurrent[hour],
      previous: hourMapPrev[hour],
    }));

    return {
      currentKPIs: { views: cViews, likes: cLikes, comments: cComments, shares: cShares },
      prevKPIs: { views: pViews, likes: pLikes, comments: pComments, shares: pShares },
      platformDist,
      timeSeriesCurrent: mergedTimeSeries,
      timeSeriesPrev: mergedTimeSeries,
      hourlyPattern,
    };
  }, [allScans, activeRange, customStart, customEnd]);

  const PLATFORM_COLORS: Record<string, string> = {
    Youtube: '#FF0000',
    Tiktok: '#69C9D0',
    Instagram: '#E1306C',
    Unknown: '#64748b',
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin opacity-50" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Loading Forecast Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 mb-3">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Predictive Analytics</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter uppercase">Forecast</h1>
          <p className="text-slate-400 text-sm mt-2">Cross-platform performance intelligence with period comparison.</p>
        </div>

        {/* DateRange Controller */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-2xl p-1.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setActiveRange(opt.key); setShowCustomPicker(false); }}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeRange === opt.key
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => { setActiveRange('custom'); setShowCustomPicker(true); }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                activeRange === 'custom'
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Custom
            </button>
          </div>

          {/* Custom Date Picker */}
          <AnimatePresence>
            {showCustomPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl p-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[7px] font-black uppercase tracking-widest text-slate-500">From</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div className="text-slate-600 font-black">→</div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[7px] font-black uppercase tracking-widest text-slate-500">To</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Views" value={currentKPIs.views} prevValue={prevKPIs.views} icon={Eye} color="text-blue-400" delay={0.1} />
        <KpiCard label="Interaction Index" value={currentKPIs.likes} prevValue={prevKPIs.likes} icon={Heart} color="text-pink-400" delay={0.15} />
        <KpiCard label="Conversation Yield" value={currentKPIs.comments} prevValue={prevKPIs.comments} icon={MessageCircle} color="text-amber-400" delay={0.2} />
        <KpiCard label="Network Shares" value={currentKPIs.shares} prevValue={prevKPIs.shares} icon={Share2} color="text-emerald-400" delay={0.25} />
      </div>

      {/* Hourly Activity Pattern (New Premium Chart) */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8 border border-white/10 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-[0.03]">
          <TrendingUp className="w-48 h-48 text-blue-500" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase text-white tracking-widest leading-none">Hourly Activity Pattern</h3>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-1.5 flex items-center gap-1.5">
                Scan Velocity Intensity • Grouped by Hour of Day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[9px] font-black uppercase text-slate-400">Current Period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500 border-dashed animate-pulse" />
              <span className="text-[9px] font-black uppercase text-slate-400">Previous Period</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full overflow-x-auto hide-scrollbar touch-pan-x">
          <div className="w-full min-w-[700px] h-full px-2 lg:px-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyPattern} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={true} horizontal={true} />
              <XAxis 
                dataKey="hour" 
                tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} 
                axisLine={false} 
                tickLine={false}
                interval={1}
              />
              <YAxis 
                tick={{ fill: '#475569', fontSize: 9 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px' }}
                itemStyle={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}
                labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 900, marginBottom: '8px' }}
                cursor={{ stroke: '#ffffff10', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="current" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCurrent)" 
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="previous" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorPrev)" 
                animationDuration={2000}
              />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
        
      {/* Bottom Grid: Bar Chart + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Comparative Bar Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card p-8 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black italic uppercase text-white tracking-widest">Period Comparison</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">Current vs Previous Period Views</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-[8px] font-black uppercase text-slate-500">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-white/10" />
                <span className="text-[8px] font-black uppercase text-slate-500">Previous</span>
              </div>
            </div>
          </div>

          <div className="h-[320px] w-full overflow-x-auto hide-scrollbar touch-pan-x">
            {timeSeriesCurrent.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Insufficient data — accumulating scan history...</p>
              </div>
            ) : (
              <div className="min-w-[600px] h-full px-2 lg:px-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeriesCurrent} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: 11, fontWeight: 900 }}
                      labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}
                    />
                    <Bar dataKey="current" name="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previous" name="Previous" fill="#ffffff10" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cross-Platform Pie Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 border border-white/10"
        >
          <h3 className="text-lg font-black italic uppercase text-white tracking-widest mb-1">Platform Split</h3>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-6">View Distribution by Platform</p>

          <div className="h-[250px]">
            {platformDist.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No platform data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {platformDist.map((entry: any, i: number) => (
                      <Cell key={`cell-${i}`} fill={PLATFORM_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                    formatter={(val: any) => `${val}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend — Clickable */}
          <div className="space-y-3 mt-4">
            {platformDist.map((p: any) => (
              <button
                key={p.name}
                onClick={() => setActivePlatform(activePlatform === p.name.toLowerCase() ? null : p.name.toLowerCase())}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${
                  activePlatform === p.name.toLowerCase()
                    ? 'bg-white/10 border border-white/20'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p.name] || '#64748b' }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black italic text-white">{p.value}%</span>
                  {activePlatform === p.name.toLowerCase()
                    ? <ChevronUp className="w-3 h-3 text-slate-500" />
                    : <ChevronDown className="w-3 h-3 text-slate-500" />
                  }
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Platform Drill-Down Panel */}
      <AnimatePresence>
        {activePlatform && (
          <motion.div
            key={activePlatform}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="glass-card p-8 border border-white/10" style={{ borderColor: (PLATFORM_COLORS[(activePlatform as string).charAt(0).toUpperCase() + (activePlatform as string).slice(1)] || '#64748b') + '30' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {activePlatform === 'youtube' && <Youtube className="w-5 h-5 text-red-500" />}
                  {activePlatform === 'tiktok' && <Music2 className="w-5 h-5 text-cyan-400" />}
                  {activePlatform === 'instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
                  <div>
                    <h3 className="text-xl font-black italic uppercase text-white tracking-widest">
                      {(activePlatform as string).charAt(0).toUpperCase() + (activePlatform as string).slice(1)} Intelligence
                    </h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Per-Node Breakdown</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePlatform(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Platform-specific aggregate KPIs */}
              {(() => {
                const platformScans = allScans.filter(s => s.platform === activePlatform);
                const totalViews = platformScans.reduce((s, n) => s + (n.lastViews || 0), 0);
                const totalLikes = platformScans.reduce((s, n) => s + (n.lastLikes || 0), 0);
                const totalComments = platformScans.reduce((s, n) => s + (n.lastComments || 0), 0);
                const formatNum = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}K` : n.toLocaleString();

                return (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Views</p>
                        <p className="text-2xl font-black italic tracking-tighter text-white">{formatNum(totalViews)}</p>
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Likes</p>
                        <p className="text-2xl font-black italic tracking-tighter text-white">{formatNum(totalLikes)}</p>
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Comments</p>
                        <p className="text-2xl font-black italic tracking-tighter text-white">{formatNum(totalComments)}</p>
                      </div>
                    </div>

                    {/* Node Table */}
                    <div className="space-y-2">
                      {platformScans.sort((a, b) => (b.lastViews || 0) - (a.lastViews || 0)).map((node: any) => (
                        <div
                          key={node.accountId}
                          onClick={() => window.location.href = `/accounts/${encodeURIComponent(node.accountId)}`}
                          className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/20 hover:bg-white/[0.04] cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                              {activePlatform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                              {activePlatform === 'tiktok' && <Music2 className="w-4 h-4 text-cyan-400" />}
                              {activePlatform === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                            </div>
                            <div>
                              <p className="text-sm font-black italic uppercase tracking-tighter text-white group-hover:text-blue-400 transition-colors">
                                {node.accountId.split('|')[0]}
                              </p>
                              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600">
                                {node.scanCount || 0} scans • Last: {node.lastScanTime ? new Date(node.lastScanTime).toLocaleTimeString() : 'Never'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Views</p>
                              <p className="text-sm font-black italic text-white">{formatNum(node.lastViews || 0)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Likes</p>
                              <p className="text-sm font-black italic text-white">{formatNum(node.lastLikes || 0)}</p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                          </div>
                        </div>
                      ))}
                      {platformScans.length === 0 && (
                        <div className="py-8 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No {activePlatform} nodes detected in the network</p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
