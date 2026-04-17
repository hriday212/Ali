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
  CartesianGrid
} from 'recharts';

// --- Engagement Funnel ---
export function EngagementFunnel({ views = 1000000, likes = 50000, comments = 2000 }) {
  const data = [
    { name: 'Total Views', value: 100, actual: views, sub: 'Initial Reach', color: '#1e293b' },
    { name: 'Engagement', value: Math.min(80, (likes / views) * 1000), actual: likes, sub: 'Likes & Reactions', color: '#334155' },
    { name: 'Conversation', value: Math.min(60, (comments / views) * 5000), actual: comments, sub: 'Active Comments', color: '#475569' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Conversion Funnel</h3>
        <span className="text-[10px] font-bold text-white/20 uppercase">Algorithmic Drop-off</span>
      </div>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={item.name} className="relative group">
            <div className="flex justify-between items-center mb-1.5 px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">{item.name}</span>
              <span className="text-xs font-black italic text-white">{item.actual.toLocaleString()}</span>
            </div>
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 1.5, delay: i * 0.2, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-end px-3">
                 <span className="text-[8px] font-bold text-white/30 uppercase">{item.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
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
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Save-to-Share Matrix</h3>
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
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Hook Velocity</h3>
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
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Neural Sentiment</h3>
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
    </div>
  );
}

// --- Viral Velocity Radar ---
export function ViralVelocityRadar() {
  const data = [
    { subject: 'Growth', A: 120, B: 110, fullMark: 150 },
    { subject: 'Consistency', A: 98, B: 130, fullMark: 150 },
    { subject: 'Engagement', A: 86, B: 130, fullMark: 150 },
    { subject: 'Reach', A: 99, B: 100, fullMark: 150 },
    { subject: 'Retention', A: 85, B: 90, fullMark: 150 },
  ];

  return (
    <div className="h-full flex flex-col">
       <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 italic">Velocity Radar</h3>
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
    </div>
  );
}
