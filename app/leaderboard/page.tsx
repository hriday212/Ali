'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, ArrowUp, BarChart, Youtube, Instagram, Music2, Search, Loader2 } from 'lucide-react';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LeaderboardNode {
  accountId: string;
  accountLink: string;
  platform: string;
  scanCount: number;
  lastScanTime: string | null;
  totalViews: number;
  postsCount: number;
  lastError?: string | null;
}

export default function LeaderboardPage() {
  const [nodes, setNodes] = useState<LeaderboardNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson(API_ROUTES.SCANS);
      if (!data) { setNodes([]); return; }
      const { scans } = data;
      
      const enrichedNodes = await Promise.all(scans.map(async (scan: any) => {
        const statusData = await safeFetchJson(`${API_ROUTES.STATUS}?accountId=${scan.accountId}`);
        const scanData = (statusData || {}).data || {};
        
        return {
          accountId: scan.accountId,
          accountLink: scan.accountLink,
          platform: scan.platform,
          scanCount: scan.scanCount,
          lastScanTime: scan.lastScanTime,
          totalViews: (scanData.history || []).slice(-1)[0]?.totalViews || 0,
          postsCount: (scanData.posts || []).length,
          lastError: scan.lastError
        };
      }));

      // Sort by total views descending
      enrichedNodes.sort((a, b) => b.totalViews - a.totalViews);
      setNodes(enrichedNodes);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredNodes = nodes.filter(n => 
    n.accountId.toLowerCase().includes(filter.toLowerCase()) || 
    n.platform.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-8">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 text-amber-500 mb-3">
            <Trophy className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Global Node Rankings</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter uppercase mb-4">The Leaderboard</h1>
          <p className="text-slate-400 text-lg leading-relaxed">Auditing the highest-performing content nodes across the LinkMe network.</p>
        </div>

        <div className="flex flex-col justify-between gap-4">
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text" 
                placeholder="FILTER NODES..."
                className="pl-14 pr-8 py-4 bg-white/[0.03] border border-white/10 focus:border-amber-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white outline-none w-full md:w-80"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
           </div>
           <button 
             onClick={fetchLeaderboard}
             className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
           >
             <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             Sync Rankings
           </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-6 opacity-30">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Auditing Neural Activity...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNodes.map((node, index) => {
            const isTop3 = index < 3;
            const rankColor = index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-slate-600';
            
            return (
              <motion.div
                key={node.accountId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative overflow-hidden"
              >
                <div className="glass-card flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-1 md:px-10 min-h-[96px] md:h-24 relative z-10 hover:bg-white/[0.05] transition-all duration-500">
                  {/* Rank Indicator */}
                  <div className={`w-full md:w-12 flex flex-row md:flex-col items-center justify-center gap-3 md:gap-0 ${rankColor} border-b border-white/5 md:border-none pb-4 md:pb-0`}>
                    {isTop3 ? (
                      <>
                        <Medal className="w-5 h-5 md:w-6 md:h-6 mb-0 md:mb-1 drop-shadow-md" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none drop-shadow-md">
                          {index === 0 ? '1ST' : index === 1 ? '2ND' : '3RD'}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl md:text-3xl font-black italic tracking-tighter shadow-black drop-shadow-md">{`#${index + 1}`}</span>
                    )}
                  </div>

                  {/* Icon & Details */}
                  <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0 w-full">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {node.platform === 'youtube' && <Youtube className="w-5 h-5 md:w-6 md:h-6 text-red-500" />}
                      {node.platform === 'instagram' && <Instagram className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />}
                      {node.platform === 'tiktok' && <Music2 className="w-5 h-5 md:w-6 md:h-6 text-slate-100" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg md:text-xl font-black italic tracking-tighter text-white uppercase truncate">{node.accountId}</h3>
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500">{node.platform} Node</p>
                    </div>
                  </div>

                  {/* Stats Group */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-12 text-left md:text-right w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-none">
                    <div className="flex-1 sm:flex-none">
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5 md:mb-1 italic">Total Reach</p>
                      <p className="text-base md:text-lg font-black italic tracking-tight text-white">{node.totalViews.toLocaleString()}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5 md:mb-1 italic">Scan Frequency</p>
                      <div className="flex flex-col items-start md:items-end">
                        <p className={cn("text-base md:text-lg font-black italic tracking-tight", node.lastError ? "text-amber-500" : "text-slate-400")}>
                          {node.scanCount} Scans
                        </p>
                        {node.lastError && (
                          <span className="text-[6px] md:text-[7px] font-black uppercase tracking-tighter text-amber-500/70">{node.lastError.substring(0, 20)}...</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full md:w-[120px]">
                       <div className="flex justify-between items-center mb-1.5 px-1 md:px-0">
                         <span className="text-[8px] font-black uppercase text-amber-500/50 italic tracking-widest">Momentum</span>
                         <span className="text-[9px] md:text-[10px] font-black italic text-emerald-400">Stable</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (node.totalViews / nodes[0].totalViews) * 100)}%` }}
                            className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                          />
                       </div>
                    </div>
                    {/* Action Arrow - Hidden on very small screens to save space */}
                    <div className="hidden md:flex w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center text-slate-500 group-hover:bg-amber-500 group-hover:text-black transition-all shrink-0">
                      <ArrowUp className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
