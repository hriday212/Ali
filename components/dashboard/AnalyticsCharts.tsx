'use client';

import React, { useState } from 'react';
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
  Label
} from 'recharts';

import { motion } from 'framer-motion';

interface AnalyticsChartsProps {
  data: any[];
  platformDistribution: any[];
  postMarkers?: { time: string, label: string }[];
  title?: string;
  description?: string;
}

export function AnalyticsCharts({ 
  data, 
  platformDistribution, 
  postMarkers = [],
  title = "Views Analytics", 
  description = "Real-time performance tracking" 
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = React.useState(false);
  const [interval, setInterval] = useState<'6h' | '12h' | '24h' | '7d' | 'ALL'>('ALL');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Filter data based on interval using real timestamps
  const chartData = React.useMemo(() => {
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
    return <div className="h-[400px] w-full flex items-center justify-center bg-slate-900/20 rounded-2xl border border-slate-800/50 animate-pulse text-slate-500 font-medium italic">Initializing Charts...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Area Chart: Views Growth */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-2 glass-card p-6"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-slate-400 text-sm">{description}</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {(['6h', '12h', '24h', '7d', 'ALL'] as const).map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  interval === int 
                    ? 'bg-white text-black shadow-lg shadow-white/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {int}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#737373', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#737373', fontSize: 12 }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid #262626',
                  borderRadius: '12px'
                }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                stroke="#ffffff" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorViews)" 
                animationDuration={1500}
              />

              {postMarkers?.map((marker, i) => (
                <ReferenceLine 
                  key={i}
                  x={marker.time} 
                  stroke="#3b82f6" 
                  strokeDasharray="3 3"
                  strokeWidth={2}
                >
                  <Label 
                    value={marker.label} 
                    position="top" 
                    fill="#3b82f6" 
                    fontSize={10} 
                    fontWeight="900"
                    offset={10}
                  />
                </ReferenceLine>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-white mb-2">Platform Split</h3>
        <p className="text-slate-400 text-sm mb-8">Views by social platform</p>
        
        <div className="h-[280px] w-full">
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
                  const colors = ['#ffffff', '#a3a3a3', '#404040'];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid #262626',
                  borderRadius: '12px'
                }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 space-y-4">
          {platformDistribution.map((platform: any, index: number) => {
             const colors = ['#ffffff', '#a3a3a3', '#404040'];
             return (
              <div key={platform.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="text-sm font-medium text-slate-300">{platform.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{platform.value}%</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
