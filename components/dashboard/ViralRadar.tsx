'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, TrendingUp, AlertCircle, Youtube, Instagram, Music2, ArrowUpRight } from 'lucide-react';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

interface Candidate {
  id: string;
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
          
          if (scanData && scanData.history && scanData.history.length > 1) {
            const history = scanData.history;
            const latest = history[history.length - 1];
            const previous = history[history.length - 2];
            
            const viewDelta = latest.totalViews - previous.totalViews;
            
            // Anomalous growth threshold (e.g., > 1000 views inside one interval)
            // For testing against small numbers, we'll flag any positive jump as a candidate if it's > 50
            if (viewDelta > 50) {
              flagged.push({
                id: scan.accountId,
                platform: scan.platform || 'youtube',
                viewDelta,
                currentViews: latest.totalViews,
                time: latest.time
              });
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
                 
                 <div className="flex items-center justify-between z-10">
                   <div className="flex items-center gap-2">
                     {candidate.platform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                     {candidate.platform === 'tiktok' && <Music2 className="w-4 h-4 text-white" />}
                     {candidate.platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                     <span className="text-xs font-black uppercase text-white truncate max-w-[120px]">{candidate.id}</span>
                   </div>
                   <div className="flex items-center gap-1 text-emerald-400">
                     <TrendingUp className="w-3 h-3" />
                     <span className="text-xs font-black italic tracking-tighter">+{candidate.viewDelta.toLocaleString()}</span>
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between mt-2 z-10">
                   <div>
                     <p className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Current Reach</p>
                     <p className="text-sm font-black text-white italic tracking-tighter">{candidate.currentViews.toLocaleString()}</p>
                   </div>
                   <a href={`/accounts/${candidate.id}`} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 hover:bg-emerald-500/30 transition-all">
                     Audit <ArrowUpRight className="w-3 h-3" />
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
