'use client';

import React from 'react';
import { Eye, Heart, MessageCircle, DollarSign, TrendingUp, Filter, Calendar, Zap, Terminal } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SUMMARY_STATS } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/authStore';
import { ContentPulse } from '@/components/dashboard/ContentPulse';

const AnalyticsCharts = dynamic(() => import('@/components/dashboard/AnalyticsCharts').then(mod => mod.AnalyticsCharts), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-white/[0.03] border border-white/5 rounded-[2.5rem] animate-pulse flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-xs">Initializing Neural Engine...</div>
});

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-12 pb-20">
      {/* Hero / Welcome */}
      <section className="relative overflow-hidden pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
           <div>
              <div className="flex items-center gap-3 text-blue-500 mb-4 px-1">
                <Terminal className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Link Established</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
                {isAdmin ? 'Network' : 'Control'}<br />
                <span className="text-blue-600">Protocol</span>
              </h1>
           </div>
           
           <div className="flex flex-col items-end gap-2 pr-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 opacity-50 italic">Clypso v1.4.2 // Stable Build</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Scan Engine Active</span>
              </div>
           </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatsCard 
             title="Total Network Reach" 
             value={SUMMARY_STATS.totalViews} 
             growth={12.5} 
             icon={Eye} 
             variant="silver"
           />
           <StatsCard 
             title="Interaction Index" 
             value={SUMMARY_STATS.totalLikes} 
             growth={8.2} 
             icon={Heart} 
             variant="silver"
           />
           <StatsCard 
             title="Conversation Yield" 
             value={SUMMARY_STATS.totalComments} 
             growth={5.4} 
             icon={MessageCircle} 
             variant="silver"
           />
           <StatsCard 
             title="Estimated Earnings" 
             value={SUMMARY_STATS.estimatedEarnings} 
             growth={15.8} 
             icon={DollarSign} 
             variant="silver"
           />
        </div>
      </section>

      {/* Content Pulse Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                {isAdmin ? 'Network Content Pulse' : 'My Content Alpha'}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Real-time signal from all connected nodes</p>
           </div>
           <button className="flex items-center gap-2 px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Sync All</span>
           </button>
        </div>
        
        <ContentPulse />
      </section>

      {/* Global Trajectory Section */}
      <section className="space-y-8">
        <div>
           <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Neural Trajectory</h2>
           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Cross-platform growth algorithm</p>
        </div>
        <div className="glass-card p-10 bg-white/[0.01]">
          <AnalyticsCharts 
            data={[]} // Will fetch in component
            platformDistribution={[]}
            title="Protocol Expansion"
            description="Aggregated view growth across the LinkMe network."
          />
        </div>
      </section>
    </div>
  );
}
