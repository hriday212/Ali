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

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await safeFetchJson(API_ROUTES.SCANS);
        if (!data?.scans) return;

        const allLogs: SlaLog[] = [];
        
        // Define the SLA requirement
        const MIN_POSTS_PER_DAY = 2;
        
        // Let's analyze the last 14 days
        const today = new Date();
        const datesToCheck = Array.from({ length: 14 }).map((_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        });

        for (const scan of data.scans) {
          const posts = scan.posts || [];
          
          // Group posts by YYYY-MM-DD
          const postsByDate: Record<string, number> = {};
          posts.forEach((p: any) => {
            const dateStr = p.date ? new Date(p.date).toISOString().split('T')[0] : null;
            if (dateStr) {
              postsByDate[dateStr] = (postsByDate[dateStr] || 0) + 1;
            }
          });

          // Check against the last 14 days (excluding today since today is not over yet)
          datesToCheck.forEach((dateStr, idx) => {
            if (idx === 0) return; // Skip today

            const count = postsByDate[dateStr] || 0;
            const isFailed = count < MIN_POSTS_PER_DAY;

            // Only generate a log if they failed OR if we want to show passes too
            // For now, let's only log failures to keep it actionable, 
            // but we'll include passes for the last 3 days for context.
            if (isFailed || idx <= 3) {
              allLogs.push({
                date: dateStr,
                accountId: scan.accountId,
                accountName: scan.name || scan.accountId,
                platform: scan.platform || 'youtube',
                postCount: count,
                status: isFailed ? 'failed' : 'passed',
              });
            }
          });
        }

        // Sort by date descending, then by status (failed first)
        allLogs.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          if (a.status !== b.status) return a.status === 'failed' ? -1 : 1;
          return a.accountName.localeCompare(b.accountName);
        });

        setLogs(allLogs);
      } catch (err) {
        console.error('Failed to load SLA logs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);

  if (!user) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Shield className="w-16 h-16 text-slate-500/50 mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-widest text-slate-500">Authentication Required</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8">
      <div className="mb-12">
        <div className="flex items-center gap-3 text-red-500 mb-3">
          <AlertTriangle className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Compliance Tracker</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter uppercase mb-4">SLA Logs</h1>
        <p className="text-slate-400 text-lg leading-relaxed">Automated tracking of clipper posting frequency. <br/> <span className="text-white font-bold">Requirement: Minimum 2 posts per day.</span></p>
      </div>

      <div className="glass-card p-6 border border-white/10">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Clock className="w-8 h-8 animate-spin mb-4" />
            <p className="text-xs uppercase tracking-widest font-black">Analyzing Posting History...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-4" />
            <h3 className="text-lg font-black uppercase tracking-widest text-white mb-2">Perfect Compliance</h3>
            <p className="text-sm">No SLA violations detected in the last 14 days.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/20">
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Date</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Account</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Platform</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Posts</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log, idx) => (
                  <tr key={idx} className={`hover:bg-white/[0.02] transition-colors ${log.status === 'failed' ? 'bg-red-500/[0.02]' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-300">{log.date}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-white">{log.accountName}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border
                        ${log.platform === 'youtube' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          log.platform === 'tiktok' ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' : 
                          'bg-pink-500/10 text-pink-400 border-pink-500/20'}
                      `}>
                        {log.platform}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-lg font-black ${log.postCount < 2 ? 'text-red-400' : 'text-emerald-400'}`}>{log.postCount}</span>
                      <span className="text-xs text-slate-500 ml-1">/ 2</span>
                    </td>
                    <td className="p-4 text-right">
                      {log.status === 'failed' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-[10px] font-black uppercase tracking-widest">
                          <AlertTriangle className="w-3 h-3" /> Failed SLA
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3" /> Passed
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
