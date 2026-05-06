'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface LedgerEntry {
  accountId: string;
  timestamp: string;
  totalViews: number;
  amount: number;
  currency: string;
  videoId?: string;
  videoTitle?: string;
}

export default function PayoutsPage() {
  const router = useRouter();
  const [ledger, setLedger] = React.useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('ALL');

  React.useEffect(() => {
    const fetchLedger = async () => {
      try {
        const data = await safeFetchJson(API_ROUTES.PAYOUTS);
        if (data && data.payouts) {
          setLedger(data.payouts);
        }
      } catch (err) {
        console.error('Failed to fetch ledger:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLedger();
  }, []);

  const filteredLedger = ledger.filter(entry => {
    const matchesSearch = entry.accountId.toLowerCase().includes(search.toLowerCase()) || 
                         (entry.videoTitle || '').toLowerCase().includes(search.toLowerCase());
    if (filter === 'ALL') return matchesSearch;
    // Add logic for filtering by account/platform if needed
    return matchesSearch;
  });

  const totalPaid = ledger.reduce((sum, entry) => sum + entry.amount, 0);
  const totalViewsAudited = ledger.reduce((sum, entry) => sum + entry.totalViews, 0);

  // Group by day for chart
  const dailyData = React.useMemo(() => {
    const groups: Record<string, number> = {};
    ledger.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      groups[date] = (groups[date] || 0) + entry.amount;
    });
    return Object.entries(groups).map(([date, amount]) => ({ date, amount })).reverse().slice(0, 14);
  }, [ledger]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 pb-32">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/accounts')}
              className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">Financial Ledger</h1>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-400">Phase 4 Active</div>
              </div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Automated Payout & Audit Terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const headers = ['Account ID', 'Timestamp', 'Views', 'Amount', 'Currency', 'Video Title'];
                const rows = ledger.map(e => [
                  e.accountId,
                  new Date(e.timestamp).toLocaleString(),
                  e.totalViews,
                  e.amount,
                  e.currency,
                  (e.videoTitle || 'N/A').replace(/,/g, ';')
                ]);
                const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `clypso_ledger_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all"
            >
              <Download className="w-4 h-4" /> Export Audit
            </button>
          </div>
        </header>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="glass-card p-8 border-emerald-500/20 bg-emerald-500/[0.02]">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-4 italic">Total Disbursed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic tracking-tighter">${totalPaid.toFixed(2)}</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">USD</span>
            </div>
            <div className="mt-6 h-1 w-full bg-emerald-500/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </div>
          </div>

          <div className="glass-card p-8 border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 italic">Views Audited</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic tracking-tighter">{(totalViewsAudited / 1000000).toFixed(2)}M</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Views</span>
            </div>
          </div>

          <div className="glass-card p-8 border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 italic">Settlement Events</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic tracking-tighter">{ledger.length}</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Records</span>
            </div>
          </div>

          <div className="glass-card p-8 border-white/10 bg-indigo-500/[0.02]">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 mb-4 italic">Avg. Node Yield</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic tracking-tighter">${ledger.length > 0 ? (totalPaid / new Set(ledger.map(e => e.accountId)).size).toFixed(2) : '0.00'}</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">/ Node</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Ledger Table */}
          <div className="lg:col-span-2 glass-card p-10 flex flex-col min-h-[600px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-slate-500" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] italic">Settlement Timeline</h2>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search Ledger..." 
                  className="bg-black/40 border border-white/10 rounded-full py-3 px-12 text-[10px] font-bold uppercase tracking-widest text-white outline-none focus:border-white/30 transition-all w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="space-y-4">
                {filteredLedger.length === 0 ? (
                   <div className="h-64 flex flex-col items-center justify-center opacity-20 gap-4">
                      <ShieldCheck className="w-12 h-12" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No matching records found</p>
                   </div>
                ) : (
                  filteredLedger.map((entry, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.05] transition-all group cursor-pointer"
                      onClick={() => router.push(`/accounts/${entry.accountId}`)}
                    >
                      <div className="flex items-center gap-6 min-w-0">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                           {entry.videoTitle ? <ExternalLink className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase italic text-white group-hover:text-emerald-400 transition-colors leading-none mb-2">
                            {entry.videoTitle || `Node Settlement: ${entry.accountId}`}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleString()}</span>
                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                            <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">{formatNumber(entry.totalViews)} views verified</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                         <div className="text-right">
                            <p className="text-2xl font-black italic tracking-tighter text-white">${entry.amount.toFixed(2)}</p>
                            <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Paid Out</p>
                         </div>
                         <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-white transition-colors" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Side Visuals */}
          <div className="space-y-8">
            <div className="glass-card p-8 border-white/10">
              <div className="flex items-center gap-4 mb-8">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] italic">Cash Flow Trend</h2>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="payoutG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fill="url(#payoutG)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] text-center mt-6 italic">Last 14 Days Disbursal Velocity</p>
            </div>

            <div className="glass-card p-8 border-white/10">
              <div className="flex items-center gap-4 mb-8">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] italic">Protocol Integrity</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_8px_emerald]" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">View Audit Lock</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">All views verified against scan engine history before settlement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_8px_emerald]" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">Double-Spend Guard</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Video IDs are indexed to prevent duplicate payouts across nodes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_8px_emerald]" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">Persistence Engine</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Ledger synced to high-availability storage for client reporting.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n) : n;
  if (isNaN(num)) return String(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}
