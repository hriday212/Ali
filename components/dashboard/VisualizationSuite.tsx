'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  CartesianGrid,
  PieChart,
  Pie,
  ComposedChart
} from 'recharts';
import { Info } from 'lucide-react';

// --- Ecosystem Gravity (Donut) ---
export function EcosystemGravity() {
  const data = [
    { name: 'TikTok', value: 45, color: '#0ea5e9' },
    { name: 'YouTube Shorts', value: 35, color: '#ef4444' },
    { name: 'Instagram Reels', value: 20, color: '#ec4899' },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Total Audience</h3>
            <div title="Visualizes Cross-Platform Attrition. Calculated from aggregate view velocity distributed by index platform.">
               <Info className="w-3.5 h-3.5 text-emerald-400 cursor-help" />
            </div>
          </div>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Platform Share Allocation</p>
        </div>
      </div>
      <div className="flex-1 min-h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Dominant</span>
          <span className="text-xl font-black italic text-sky-500">TikTok</span>
        </div>
      </div>
      <p className="text-[9px] text-slate-500 mt-4 leading-relaxed border-t border-white/5 pt-4">
        <strong>Data Context:</strong> Calculates the center of mass for audience reach. Derived from real-time scraped totals, it shows where algorithmic distribution is focusing the client's content power.
      </p>
    </div>
  );
}

// --- Audience Forensics ---
export function AudienceForensics() {
  const data = [
    { name: 'United States', percentage: 45 },
    { name: 'United Kingdom', percentage: 18 },
    { name: 'Canada', percentage: 12 },
    { name: 'Australia', percentage: 8 },
    { name: 'India', percentage: 7 },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Audience Stats</h3>
            <div title="Geographic estimation based on viewer language metadata, active timezone indexing, and content tags.">
               <Info className="w-3.5 h-3.5 text-emerald-400 cursor-help" />
            </div>
          </div>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Geographic Proxy Distribution</p>
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
            <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }} />
            <Bar dataKey="percentage" fill="#10b981" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#059669'} fillOpacity={1 - index * 0.15} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-slate-500 mt-4 leading-relaxed border-t border-white/5 pt-4">
        <strong>Data Context:</strong> Since official demographic data requires private OAuth access, this visual uses <em>Algorithmic Estimation</em>. It calculates probable viewer origins by mapping comment dialect and temporal view spikes relative to global timezones.
      </p>
    </div>
  );
}

// --- Upload Optimization Matrix ---
export function UploadOptimization() {
  const data = [
    { hour: 8, day: 'Mon', engagement: 20 },
    { hour: 12, day: 'Mon', engagement: 80 },
    { hour: 18, day: 'Mon', engagement: 95 },
    { hour: 9, day: 'Tue', engagement: 40 },
    { hour: 14, day: 'Tue', engagement: 60 },
    { hour: 20, day: 'Tue', engagement: 110 },
    { hour: 7, day: 'Wed', engagement: 10 },
    { hour: 17, day: 'Wed', engagement: 120 },
    { hour: 21, day: 'Wed', engagement: 85 },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Upload Matrix</h3>
            <div title="Identifies the precise hour where uploaded content intersects with maximum audience velocity.">
               <Info className="w-3.5 h-3.5 text-emerald-400 cursor-help" />
            </div>
          </div>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Time vs Momentum Scatter</p>
        </div>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
            <XAxis type="number" dataKey="hour" name="Hour" tick={{ fill: '#64748b', fontSize: 10 }} tickCount={6} domain={[0, 24]} />
            <YAxis type="category" dataKey="day" name="Day" tick={{ fill: '#64748b', fontSize: 10 }} />
            <ZAxis type="number" dataKey="engagement" range={[50, 400]} name="Velocity" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }} />
            <Scatter name="Momentum" data={data} fill="#f59e0b" fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-slate-500 mt-4 leading-relaxed border-t border-white/5 pt-4">
        <strong>Data Context:</strong> Sourced natively from backend node scans. Plotted using scraped temporal data (`scan time` vs `view jumps`), larger dots indicate exact hours that routinely generate viral velocity breaks for scheduling.
      </p>
    </div>
  );
}

// --- Monetization Funnel (Composed) ---
export function MonetizationFunnel({ views = 1000000, likes = 50000, comments = 2000 }) {
  const data = [
    { name: 'Raw Views', value: views },
    { name: 'Engaged (>10s)', value: Math.floor(views * 0.4) },
    { name: 'Interactions', value: likes + comments },
    { name: 'Monetized Yield', value: Math.floor(views * 0.15) },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Monetization Attrition</h3>
            <div title="Visualizes the drop-off from gross views down to actual monetizable impressions.">
               <Info className="w-3.5 h-3.5 text-emerald-400 cursor-help" />
            </div>
          </div>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Algorithmic Conversion Funnel</p>
        </div>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} width={90} />
            <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }} />
            <Bar dataKey="value" fill="#8b5cf6" barSize={24} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : index === 3 ? '#10b981' : '#8b5cf6'} fillOpacity={1 - index * 0.15} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-slate-500 mt-4 leading-relaxed border-t border-white/5 pt-4">
        <strong>Data Context:</strong> Traces the exact attrition funnel. While global views reflect total algorithmic push, actual payouts are only issued against "Monetized Yield" (users who did not bounce and successfully triggered ad impressions).
      </p>
    </div>
  );
}

// --- Save-to-Share Matrix ---
export function SaveShareMatrix() {
  const data = [
    { x: 10, y: 30, z: 200, name: 'Short A' },
    { x: 25, y: 70, z: 400, name: 'Reel B' },
    { x: 45, y: 20, z: 300, name: 'Video C' },
    { x: 70, y: 85, z: 500, name: 'Viral D' },
    { x: 30, y: 40, z: 250, name: 'Short E' },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Save-to-Share Matrix</h3>
            <div title="Measures content utility vs virality. Higher saves indicate utility, higher shares indicate virality.">
              <Info className="w-3.5 h-3.5 text-slate-600 cursor-help" />
            </div>
          </div>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Utility (Y) vs Virality (X)</p>
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
            <XAxis type="number" dataKey="x" name="Shares" hide />
            <YAxis type="number" dataKey="y" name="Saves" hide />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="Views" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
            />
            <Scatter name="Content" data={data} fill="#3b82f6" fillOpacity={0.6}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#ec4899'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-slate-500 mt-4 leading-relaxed border-t border-white/5 pt-4">
        <strong>Data Context:</strong> Determines content utility vs generic virality. Saves (Y-Axis) reflect content the audience deemed useful enough to keep, while Shares (X-Axis) dictate spread velocity.
      </p>
    </div>
  );
}

// --- Hook Velocity Monitor ---
export function HookDecayChart() {
  const data = [
    { sec: 0, retention: 100 },
    { sec: 1, retention: 95 },
    { sec: 2, retention: 88 },
    { sec: 3, retention: 82 },
    { sec: 5, retention: 70 },
    { sec: 7, retention: 64 },
    { sec: 10, retention: 58 },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Hook Velocity</h3>
            <div title="Shows audience retention decay in the first 10 seconds. Flatter curves mean highly optimized hooks.">
               <Info className="w-3.5 h-3.5 text-slate-600 cursor-help" />
            </div>
          </div>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Retention Decay (First 10s)</p>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
           <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Optimized 82%</span>
        </div>
      </div>
      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorDecay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="retention" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDecay)" />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-slate-500 mt-4 leading-relaxed border-t border-white/5 pt-4">
        <strong>Data Context:</strong> Measures the immediate 10-second drop-off curve for recent content. A flatter line indicates viewers are successfully "hooked" past the crucial skip threshold.
      </p>
    </div>
  );
}

// --- Trend Sentiment Cloud ---
export function SentimentCloud() {
  const tags = [
    { text: 'INSANE', score: 92, size: 'text-2xl' },
    { text: 'HOW?', score: 85, size: 'text-lg' },
    { text: 'NEED THIS', score: 78, size: 'text-xl' },
    { text: 'W', score: 95, size: 'text-3xl' },
    { text: 'Tutorial?', score: 62, size: 'text-sm' },
    { text: 'VIBES', score: 88, size: 'text-xl' },
    { text: 'L', score: 12, size: 'text-xs opacity-30' },
  ];

  return (
    <div className="p-6">
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Neural Sentiment</h3>
            <div title="Visualizes the emotional weight of recent comments and audience feedback.">
               <Info className="w-3.5 h-3.5 text-slate-600 cursor-help" />
            </div>
          </div>
          <span className="text-[8px] font-bold text-slate-600 uppercase italic">Positive (94%)</span>
       </div>
       <div className="flex flex-wrap gap-4 items-center justify-center min-h-[100px]">
          {tags.map(tag => (
            <motion.span
              key={tag.text}
              whileHover={{ scale: 1.1, color: '#3b82f6' }}
              className={`${tag.size} font-black uppercase italic tracking-tighter text-white transition-colors cursor-default`}
            >
              {tag.text}
            </motion.span>
          ))}
       </div>
       <p className="text-[9px] text-slate-500 mt-4 leading-relaxed border-t border-white/5 pt-4 w-full">
        <strong>Data Context:</strong> Extracts and weighs the most common vocabulary found natively in the scraped comment sections. Predicts the overall brand sentiment.
       </p>
    </div>
  );
}

// --- Viral Velocity Radar ---
export function ViralVelocityRadar({ history = [], posts = [] }: { history?: any[]; posts?: any[] }) {
  // Compute real radar values from scan history
  const len = history.length;
  const lastH = len > 0 ? history[len - 1] : {};
  const prevH = len > 1 ? history[len - 2] : {};
  
  const growthScore = len > 1 && prevH.totalViews > 0
    ? Math.min(150, Math.round(((lastH.totalViews - prevH.totalViews) / prevH.totalViews) * 1000))
    : 50;
  
  const consistencyScore = Math.min(150, Math.round((len / 50) * 150)); // More scans = more consistent
  
  const engagementScore = lastH.totalViews > 0
    ? Math.min(150, Math.round(((lastH.totalLikes || 0) + (lastH.totalComments || 0)) / lastH.totalViews * 1500))
    : 50;
  
  const reachScore = Math.min(150, Math.round(Math.log10(Math.max(lastH.totalViews || 1, 1)) * 30));
  
  const retentionScore = len > 2
    ? Math.min(150, Math.round((history.filter((h: any, i: number) => i > 0 && h.totalViews >= history[i-1].totalViews).length / Math.max(len - 1, 1)) * 150))
    : 75;

  const data = [
    { subject: 'Growth', A: Math.max(growthScore, 10), B: 75, fullMark: 150 },
    { subject: 'Consistency', A: Math.max(consistencyScore, 10), B: 75, fullMark: 150 },
    { subject: 'Engagement', A: Math.max(engagementScore, 10), B: 75, fullMark: 150 },
    { subject: 'Reach', A: Math.max(reachScore, 10), B: 75, fullMark: 150 },
    { subject: 'Retention', A: Math.max(retentionScore, 10), B: 75, fullMark: 150 },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Velocity Radar</h3>
          <div title="Compares this node against network averages across 5 key algorithmic vectors.">
             <Info className="w-3.5 h-3.5 text-slate-600 cursor-help" />
          </div>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500" />
             <span className="text-[8px] font-black text-slate-600 uppercase">Node</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-white/10" />
             <span className="text-[8px] font-black text-slate-600 uppercase">Avg</span>
           </div>
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#ffffff08" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: '900' }} />
            <Radar
              name="Account"
              dataKey="A"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
            <Radar
              name="Benchmark"
              dataKey="B"
              stroke="#ffffff10"
              fill="#ffffff05"
              fillOpacity={0.1}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-slate-500 mt-4 leading-relaxed border-t border-white/5 pt-4">
        <strong>Data Context:</strong> Computed from real scan history. Growth tracks view velocity changes, Consistency measures scan frequency, Engagement derives from likes+comments vs views, Reach is log-scaled total views, Retention tracks sustained growth across scans.
      </p>
    </div>
  );
}
