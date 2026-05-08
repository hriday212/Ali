'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { useAuth } from '@/lib/authStore';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

interface SlaLog {
  date: string; // YYYY-MM-DD
  accountId: string;
  accountName: string;
  platform: string;
  postCount: number;
  status: 'passed' | 'failed';
}

export default function LogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [logs, setLogs] = useState<SlaLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await safeFetchJson(API_ROUTES.SCANS);
        if (!data?.scans) return;

        const allLogs: SlaLog[] = [];
        const MIN_POSTS_PER_DAY = 2;
        const today = new Date();
        const datesToCheck = Array.from({ length: 14 }).map((_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        });

        for (const scan of data.scans) {
          const posts = scan.posts || [];
          const postsByDate: Record<string, number> = {};
          posts.forEach((p: any) => {
            const dateStr = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
            if (dateStr) {
              postsByDate[dateStr] = (postsByDate[dateStr] || 0) + 1;
            }
          });

          datesToCheck.forEach((dateStr, idx) => {
            if (idx === 0) return; // Skip today

            const count = postsByDate[dateStr] || 0;
            const isFailed = count < MIN_POSTS_PER_DAY;

            allLogs.push({
              date: dateStr,
              accountId: scan.accountId,
              accountName: scan.name || scan.accountId,
              platform: scan.platform || 'youtube',
              postCount: count,
              status: isFailed ? 'failed' : 'passed',
            });
          });
        }

        allLogs.sort((a, b) => b.date.localeCompare(a.date));
        setLogs(allLogs);
        
        // Default to the first date with failures or the latest date
        const firstFailure = allLogs.find(l => l.status === 'failed')?.date;
        setSelectedDate(firstFailure || datesToCheck[1]);

      } catch (err) {
        console.error('Failed to load Vitality logs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  const uniqueDates = Array.from(new Set(logs.map(l => l.date))).sort((a, b) => b.localeCompare(a));
  const filteredLogs = logs.filter(l => l.date === selectedDate).sort((a, b) => {
      if (a.status !== b.status) return a.status === 'failed' ? -1 : 1;
      return a.accountName.localeCompare(b.accountName);
  });

  if (!user) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Shield className="w-16 h-16 text-slate-500/50 mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-widest text-slate-500">Authentication Required</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8 pt-24">
      <div className="mb-12">
        <div className="flex items-center gap-3 text-red-500 mb-3">
          <AlertTriangle className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Vitality Monitor</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter uppercase mb-4">Vitality Protocols</h1>
        <p className="text-slate-400 text-lg leading-relaxed">Automated frequency verification for network nodes. <br/> <span className="text-white font-bold italic uppercase tracking-widest text-sm underline decoration-red-500">Target: Minimum 2 posts per 24h cycle.</span></p>
      </div>

      {/* Date Navigation Calendar */}
      {!isLoading && uniqueDates.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-4 hide-scrollbar">
              {uniqueDates.map(date => {
                  const dayLogs = logs.filter(l => l.date === date);
                  const hasFailures = dayLogs.some(l => l.status === 'failed');
                  const dateObj = new Date(date);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dateObj.toLocaleDateString('en-US', { day: 'numeric' });

                  return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`min-w-[80px] p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${
                            selectedDate === date 
                              ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                              : 'bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/20'
                        }`}
                      >
                          <span className={`text-[8px] font-black uppercase tracking-widest ${selectedDate === date ? 'text-black/60' : 'text-slate-600'}`}>{dayName}</span>
                          <span className="text-xl font-black italic leading-none">{dayNum}</span>
                          <div className={`w-1.5 h-1.5 rounded-full mt-1 ${hasFailures ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                      </button>
                  );
              })}
          </div>
      )}

      <div className="glass-card p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <CalendarDays className="w-32 h-32" />
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Clock className="w-8 h-8 animate-spin mb-4" />
            <p className="text-xs uppercase tracking-widest font-black">Scanning Protocol History...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-4" />
            <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2">Perfect Vitality</h3>
            <p className="text-sm italic">No protocol violations detected for this cycle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Network Entity</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Platform</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Frequency</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log, idx) => (
                  <tr key={idx} className={`hover:bg-white/[0.02] transition-colors ${log.status === 'failed' ? 'bg-red-500/[0.01]' : ''}`}>
                    <td className="p-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white uppercase tracking-tight italic">{log.accountName}</span>
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{log.accountId}</span>
                        </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                        ${log.platform === 'youtube' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          log.platform === 'tiktok' ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' : 
                          'bg-pink-500/10 text-pink-400 border-pink-500/20'}
                      `}>
                        {log.platform}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xl font-black italic ${log.postCount < 2 ? 'text-red-400' : 'text-emerald-400'}`}>{log.postCount}</span>
                      <span className="text-xs text-slate-600 ml-1 font-black">/ 2</span>
                    </td>
                    <td className="p-4 text-right">
                      {log.status === 'failed' ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Diminished Vitality
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Full Vitality
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
