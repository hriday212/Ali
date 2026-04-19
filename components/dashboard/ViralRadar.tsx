'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, TrendingUp, AlertCircle, Youtube, Instagram, Music2, ArrowUpRight } from 'lucide-react';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

interface Candidate {
  id: string;
  accountId: string;
  title: string;
  thumbnail: string | null;
  link: string;
  platform: string;
  viewDelta: number;
  currentViews: number;
  time: string;
}

export function ViralRadar() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function scanForVirality() {
      try {
        const scansRes = await safeFetchJson(API_ROUTES.SCANS);
        if (!scansRes || !scansRes.scans) return;
        
        const flagged: Candidate[] = [];
        
        await Promise.all(scansRes.scans.map(async (scan: any) => {
          const statusResult = await safeFetchJson(`${API_ROUTES.STATUS}?accountId=${scan.accountId}`);
          const scanData = (statusResult || {}).data;
          
          if (scanData && scanData.videoHistory && scanData.posts) {
            for (const [videoId, history] of Object.entries(scanData.videoHistory)) {
              if ((history as any).length > 1) {
                const histArr = history as any[];
                const latest = histArr[histArr.length - 1];
                const previous = histArr[histArr.length - 2];
                const viewDelta = latest.views - previous.views;
                
                // Flag video if it jumps by more than 50 views continuously
                if (viewDelta > 50) {
                  const post = scanData.posts.find((p: any) => p.id === videoId);
                  
                  flagged.push({
                    id: videoId,
                    accountId: scan.accountId,
                    title: post ? post.title : videoId,
                    thumbnail: post ? post.thumbnail : null,
                    link: post ? post.link : `/accounts/${scan.accountId}`,
                    platform: scan.platform || 'youtube',
                    viewDelta,
                    currentViews: latest.views,
                    time: latest.time
                  });
                }
              }
            }
          }
        }));

        setCandidates(flagged.sort((a, b) => b.viewDelta - a.viewDelta));
      } catch (err) {
        console.error('Failed to run viral radar', err);
      } finally {
        setLoading(false);
      }
    }
    
    scanForVirality();
    const interval = setInterval(scanForVirality, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 h-32 flex items-center justify-center border-white/5 opacity-50">
         <div className="flex items-center gap-3"><Rocket className="w-4 h-4 animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.3em]">Calibrating Radar...</span></div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 border border-emerald-500/20 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent">
      <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
         <div className="w-32 h-32 border border-emerald-500/50 rounded-full flex items-center justify-center outline-none animate-[spin_4s_linear_infinite]">
            <div className="w-16 h-16 border border-emerald-500/50 rounded-full" />
         </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl"><Rocket className="w-5 h-5 text-emerald-400" /></div>
          <div>
            <h3 className="text-sm font-black italic uppercase text-white tracking-widest">Viral Candidates</h3>
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70">Anomalous Growth Detected</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase text-emerald-400 tracking-[0.4em]">Live Radar</span>
        </div>
      </div>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           <AnimatePresence>
             {candidates.map((candidate, i) => (
               <motion.div 
                 key={candidate.id}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-2xl relative group overflow-hidden"
               >
                 <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all rounded-full pointer-events-none" />
                 
                 <div className="flex items-center gap-3 z-10 mb-2">
                   {candidate.thumbnail ? (
                     <img src={candidate.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                   ) : (
                     <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                       {candidate.platform === 'youtube' && <Youtube className="w-5 h-5 text-red-500" />}
                       {candidate.platform === 'tiktok' && <Music2 className="w-5 h-5 text-white" />}
                       {candidate.platform === 'instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
                     </div>
                   )}
                   <div className="min-w-0 flex-1">
                     <p className="text-[10px] font-black uppercase text-white truncate italic tracking-tight mb-1">{candidate.title}</p>
                     <p className="text-[7px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-1">
                       {candidate.platform === 'youtube' && <Youtube className="w-2.5 h-2.5 text-red-500" />}
                       {candidate.platform === 'tiktok' && <Music2 className="w-2.5 h-2.5 text-white" />}
                       {candidate.platform === 'instagram' && <Instagram className="w-2.5 h-2.5 text-pink-500" />}
                       NODE: {candidate.accountId}
                     </p>
                   </div>
                   <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                     <TrendingUp className="w-3 h-3" />
                     <span className="text-[10px] font-black italic tracking-tighter">+{candidate.viewDelta.toLocaleString()}</span>
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between z-10">
                   <div>
                     <p className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Current Reach</p>
                     <p className="text-sm font-black text-white italic tracking-tighter">{candidate.currentViews.toLocaleString()}</p>
                   </div>
                   <a href={candidate.link} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 hover:bg-emerald-500/30 transition-all border border-emerald-500/30">
                     Watch Source <ArrowUpRight className="w-3 h-3" />
                   </a>
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center justify-center gap-3 opacity-40">
           <AlertCircle className="w-8 h-8" />
           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center">No anomalous growth<br/>within current scan cycle</p>
        </div>
      )}
    </div>
  );
}
