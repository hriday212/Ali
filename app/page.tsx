'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Heart, MessageCircle, DollarSign, TrendingUp, Filter, Calendar, Zap, Terminal } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '@/lib/authStore';
import { ContentPulse } from '@/components/dashboard/ContentPulse';
import { ViralRadar } from '@/components/dashboard/ViralRadar';
import { ApiPulse } from '@/components/dashboard/ApiPulse';

const AnalyticsCharts = dynamic(() => import('@/components/dashboard/AnalyticsCharts').then(mod => mod.AnalyticsCharts), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-white/[0.03] border border-white/5 rounded-[2.5rem] animate-pulse flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-xs">Initializing Neural Engine...</div>
});

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { scrollY } = useScroll();

  // ── Live stats from scan engine ──
  const [liveStats, setLiveStats] = useState({ totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 });
  const [growthStats, setGrowthStats] = useState({ viewsGrowth: 0, likesGrowth: 0, commentsGrowth: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [platformDist, setPlatformDist] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    async function fetchLive() {
      const data = await safeFetchJson(API_ROUTES.SCANS);
      if (!data?.scans) return;

      // Aggregate totals across all nodes
      let totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0;
      const platformViews: Record<string, number> = {};
      const allHistory: { time: string; totalViews: number }[] = [];

      for (const scan of data.scans) {
        totalViews += scan.lastViews || 0;
        totalLikes += scan.lastLikes || 0;
        totalComments += scan.lastComments || 0;
        totalShares += scan.lastShares || 0;

        const plat = (scan.platform || 'unknown').toLowerCase();
        platformViews[plat] = (platformViews[plat] || 0) + (scan.lastViews || 0);

        // Merge history for the aggregate chart
        if (scan.history) {
          for (const h of scan.history) {
            allHistory.push({ time: h.time, totalViews: h.totalViews || 0 });
          }
        }
      }

      setLiveStats({ totalViews, totalLikes, totalComments, totalShares });

      // Compute growth from last 2 history entries per node
      let prevViews = 0, currViews = 0, prevLikes = 0, currLikes = 0, prevComments = 0, currComments = 0;
      for (const scan of data.scans) {
        if (scan.history && scan.history.length >= 2) {
          const last = scan.history[scan.history.length - 1];
          const prev = scan.history[scan.history.length - 2];
          currViews += last.totalViews || 0;
          prevViews += prev.totalViews || 0;
          currLikes += last.totalLikes || 0;
          prevLikes += prev.totalLikes || 0;
          currComments += last.totalComments || 0;
          prevComments += prev.totalComments || 0;
        }
      }
      const pctGrowth = (curr: number, prev: number) => prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : 0;
      setGrowthStats({
        viewsGrowth: pctGrowth(currViews, prevViews),
        likesGrowth: pctGrowth(currLikes, prevLikes),
        commentsGrowth: pctGrowth(currComments, prevComments),
      });

      // Build platform distribution
      const total = Object.values(platformViews).reduce((a, b) => a + b, 0) || 1;
      setPlatformDist(Object.entries(platformViews).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: +((value / total) * 100).toFixed(0),
        color: name === 'youtube' ? '#FF0000' : name === 'tiktok' ? '#ffffff' : '#E1306C',
      })));

      // --- ADVANCED AGGREGATION: CONTINUOUS NETWORK STATE (Fill-Forward) ---
      // 1. Collect all unique time buckets (minutes) across the entire network
      const allTimestamps = new Set<number>();
      for (const scan of data.scans) {
        if (scan.history) {
          for (const h of scan.history) {
            const d = new Date(h.time);
            d.setSeconds(0, 0);
            allTimestamps.add(d.getTime());
          }
        }
      }

      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
      
      // 2. For each node, map its history for fast lookup
      const nodeHistories = data.scans.map((scan: any) => {
        const history = (scan.history || []).map((h: any) => {
          const d = new Date(h.time);
          d.setSeconds(0, 0);
          return { ts: d.getTime(), views: h.totalViews || 0 };
        }).sort((a: any, b: any) => a.ts - b.ts);
        return history;
      }).filter((h: any[]) => h.length > 0);

      // 3. For each unique timestamp, sum the latest known views for EVERY node
      const chartPoints = sortedTimestamps.map(ts => {
        let totalAtTs = 0;
        for (const history of nodeHistories) {
          // Find the last record in this node's history that is <= the current timestamp
          let lastViews = 0;
          for (const point of history) {
            if (point.ts <= ts) {
              lastViews = point.views;
            } else {
              break; // Histories are sorted, so we can stop
            }
          }
          totalAtTs += lastViews;
        }
        return {
          timestamp: ts,
          time: new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          fullDateTime: new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          views: totalAtTs
        };
      });

      setChartData(chartPoints);
    }
    fetchLive();
    const interval = setInterval(fetchLive, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [user]);

  // Scroll animations for unauthenticated users
  const clypsoOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const clypsoScale = useTransform(scrollY, [0, 400], [1, 0.8]);
  const letterSpacing = useTransform(scrollY, [0, 400], ['-0.05em', '0.4em']);
  const clypsoBlur = useTransform(scrollY, [0, 400], ['blur(0px)', 'blur(20px)']);
  
  const contentY = useTransform(scrollY, [0, 400], [150, 0]);
  const contentOpacity = useTransform(scrollY, [150, 400], [0, 1]);

  const text = "CLYPSO";
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };
  const letterVariants = {
    hidden: { opacity: 0, y: 120 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  if (!user) {
    return (
      <div className="min-h-[150vh] relative -mt-24">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.05] via-transparent to-transparent pointer-events-none" />

        {/* Cinematic Scroll Away Layer - MASSIVE TEXT */}
        <motion.div 
          className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-0"
          style={{ opacity: clypsoOpacity, scale: clypsoScale, filter: clypsoBlur }}
        >
          <motion.h1 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ letterSpacing, perspective: '1000px' }} 
            className="text-[20vw] 2xl:text-[250px] font-black italic tracking-tighter text-white uppercase ml-[-0.05em] leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.1)] flex"
          >
            {text.split('').map((char, index) => (
              <motion.span key={index} variants={letterVariants} className="inline-block origin-bottom">
                {char}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 2, duration: 2 }}
            className="text-blue-500 font-black tracking-[0.4em] uppercase mt-4 text-xs animate-pulse"
          >
            System Standby - Scroll to Initialize
          </motion.p>
        </motion.div>
        
        {/* Slide Up Content Layer */}
        <div className="absolute top-[80vh] left-0 right-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div style={{ y: contentY, opacity: contentOpacity }} className="text-center space-y-8 max-w-5xl px-4 relative z-10 pointer-events-auto">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-4">
              <Zap className="w-4 h-4 animate-pulse" />
              Network Intelligence Offline
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter text-white uppercase max-w-5xl leading-[0.85] mx-auto">
              The Default Operating System <br />
              <span className="text-blue-500">For Your Content</span>
            </h2>
            
            <p className="text-slate-400 text-sm md:text-base font-bold uppercase tracking-[0.2em] max-w-2xl opacity-80 mt-6 leading-relaxed mx-auto">
              Log in to access the Overview, monitor accounts, and visualize network statistics across all platforms in real-time.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
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
             value={liveStats.totalViews} 
             growth={growthStats.viewsGrowth} 
             icon={Eye} 
             variant="silver"
           />
           <StatsCard 
             title="Total Likes" 
             value={liveStats.totalLikes} 
             growth={growthStats.likesGrowth} 
             icon={Heart} 
             variant="silver"
           />
           <StatsCard 
             title="Total Comments"
             value={liveStats.totalComments} 
             growth={growthStats.commentsGrowth} 
             icon={MessageCircle} 
             variant="silver"
           />
           <StatsCard 
             title="Total Shares" 
             value={liveStats.totalShares} 
             growth={0} 
             icon={TrendingUp} 
             variant="silver"
           />
        </div>
      </section>

      {/* Actionable Intelligence / Viral Radar */}
      {isAdmin && (
        <section className="space-y-6">
          <ApiPulse />
          <ViralRadar />
        </section>
      )}

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
            data={chartData}
            platformDistribution={platformDist}
            title="Protocol Expansion"
            description="Aggregated view growth across the LinkMe network."
          />
        </div>
      </section>
    </div>
  );
}
