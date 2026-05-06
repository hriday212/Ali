'use client';

import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
  Label,
  BarChart,
  Bar,
  ComposedChart,
  Line
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Zap, Info } from 'lucide-react';

interface AnalyticsChartsProps {
  data: any[];
  platformDistribution: any[];
  postMarkers?: { time: string, label: string }[];
  title?: string;
  description?: string;
  campaignStartTimestamp?: number;
}

export function AnalyticsCharts({ 
  data, 
  platformDistribution, 
  postMarkers = [],
  title = "Views Analytics", 
  description = "Real-time performance tracking",
  campaignStartTimestamp
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = React.useState(false);
  const [interval, setInterval] = useState<'6h' | '12h' | '24h' | '7d' | 'ALL'>('ALL');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // --- 1. PERIOD COMPARISON LOGIC ---
  // Calculates "This Period" vs "Last Period" for the growth curve
  const comparisonData = useMemo(() => {
    if (!data || data.length < 2) return [];
    
    const now = Date.now();
    let periodMs = 24 * 3600000; // Default 24h
    if (interval === '6h') periodMs = 6 * 3600000;
    if (interval === '12h') periodMs = 12 * 3600000;
    if (interval === '24h') periodMs = 24 * 3600000;
    if (interval === '7d') periodMs = 7 * 24 * 3600000;
    
    // Phase 18: If ALL, use the campaign anchor
    const effectiveStart = (interval === 'ALL' && campaignStartTimestamp) 
      ? campaignStartTimestamp 
      : (data[0]?.timestamp || now);

    if (interval === 'ALL') periodMs = now - effectiveStart;

    const thisPeriodStart = now - periodMs;
    const lastPeriodStart = now - (periodMs * 2);

    const currentPeriod = data.filter(d => d.timestamp >= thisPeriodStart);
    const previousPeriod = data.filter(d => d.timestamp >= lastPeriodStart && d.timestamp < thisPeriodStart);

    // Map them to a unified index for comparison
    const maxPoints = Math.max(currentPeriod.length, previousPeriod.length);
    const combined = [];
    for (let i = 0; i < maxPoints; i++) {
      combined.push({
        index: i,
        current: currentPeriod[i]?.views || null,
        previous: previousPeriod[i]?.views || null,
        time: currentPeriod[i]?.time || ''
      });
    }
    return combined;
  }, [data, interval]);

  // Filter existing activity data based on interval
  const activityData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = Date.now();
    let cutoff = 0;
    if (interval === '6h') cutoff = now - 6 * 3600000;
    if (interval === '12h') cutoff = now - 12 * 3600000;
    if (interval === '24h') cutoff = now - 24 * 3600000;
    if (interval === '7d') cutoff = now - 7 * 24 * 3600000;

    let filtered = cutoff > 0 && data[0].timestamp 
      ? data.filter(d => d.timestamp >= cutoff)
      : data;
      
    if (filtered.length === 0 && data.length > 0) {
      filtered = [data[data.length - 1]];
    }
    return filtered;
  }, [data, interval]);

  if (!mounted) {
    return <div className="h-[400px] w-full flex items-center justify-center bg-slate-900/20 rounded-2xl border border-slate-800/50 animate-pulse text-slate-500 font-black uppercase tracking-widest text-xs">Neural Engine Initializing...</div>;
  }

  return (
    <div className="space-y-8">
      {/* ── TOP SECTION: PERIOD COMPARISON (PROMOTED) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 bg-white/[0.02] border-white/10"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Period Velocity Comparison</h3>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Growth Momentum: Current vs Previous {interval === 'ALL' ? 'History' : interval}</p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {(['6h', '12h', '24h', '7d', 'ALL'] as const).map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  interval === int 
                    ? 'bg-white text-black shadow-xl shadow-white/10' 
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {int}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={comparisonData}>
              <defs>
                <linearGradient id="colorCurr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 'black' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 'black' }}
                tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#020617', 
                  border: '1px solid #1e293b',
                  borderRadius: '16px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }} />
              <Area 
                name="Current Period"
                type="monotone" 
                dataKey="current" 
                stroke="#3b82f6" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorCurr)" 
                animationDuration={1500}
              />
              <Area 
                name="Previous Period"
                type="monotone" 
                dataKey="previous" 
                stroke="#ffffff" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorPrev)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── BOTTOM SECTION: ACTIVITY BREAKDOWN (DEMOTED) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 glass-card p-8 bg-white/[0.01] border-white/5"
        >
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-black italic text-slate-400 uppercase tracking-widest">Network Activity Index</h3>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9 }}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Bar 
                  dataKey="views" 
                  fill="#ffffff" 
                  fillOpacity={0.1}
                  radius={[4, 4, 0, 0]}
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === activityData.length - 1 ? '#3b82f6' : '#ffffff'} fillOpacity={index === activityData.length - 1 ? 0.8 : 0.1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 bg-white/[0.01] border-white/5 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-black italic text-slate-400 uppercase tracking-widest">Platform Split</h3>
          </div>
          
          <div className="flex-1 min-h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {platformDistribution.map((entry: any, index: number) => {
                    const colors = ['#3b82f6', '#ffffff', '#475569'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#020617', 
                    border: '1px solid #1e293b',
                    borderRadius: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Dominant</span>
              <span className="text-xs font-black italic text-blue-500">{platformDistribution[0]?.name || 'N/A'}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {platformDistribution.map((platform: any, index: number) => {
               const colors = ['#3b82f6', '#ffffff', '#475569'];
               return (
                <div key={platform.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{platform.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-white italic">{platform.value}%</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
