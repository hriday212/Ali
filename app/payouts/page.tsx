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
  ChevronRight,
  Database
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

function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n) : n;
  if (isNaN(num)) return String(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

interface LedgerEntry {
  accountId: string;
  timestamp: string;
  totalViews: number;
  amount: number;
  currency: string;
  type?: string;
  videoId?: string;
  videoTitle?: string;
}

export default function PayoutsPage() {
  const router = useRouter();
  const [ledger, setLedger] = React.useState<LedgerEntry[]>([]);
  const [scans, setScans] = React.useState<any[]>([]);
  const [selectedNode, setSelectedNode] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('ALL');

  const fetchData = async () => {
    try {
      const [ledgerData, scanData] = await Promise.all([
        safeFetchJson(API_ROUTES.PAYOUTS),
        safeFetchJson(`${API_ROUTES.SCANS}`)
      ]);
      
      if (ledgerData && ledgerData.payouts) setLedger(ledgerData.payouts);
      if (scanData && scanData.scans) setScans(scanData.scans);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateConfig = async (accountId: string, config: any) => {
    setIsUpdating(true);
    try {
      await safeFetchJson(`${API_ROUTES.SCANS}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, config })
      });
      await fetchData();
      setSelectedNode(null);
    } catch (err) {
      console.error('Failed to update node config:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredLedger = ledger.filter(entry => {
    const matchesSearch = entry.accountId.toLowerCase().includes(search.toLowerCase()) || 
                         (entry.videoTitle || '').toLowerCase().includes(search.toLowerCase());
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/')}
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
             <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3">
                <Download className="w-4 h-4" /> Export Report
             </button>
          </div>
        </header>

        {/* --- Node Governance & Model Switcher --- */}
        <div className="mb-12">
           <div className="flex items-center gap-4 mb-6">
              <Database className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] italic">Node Governance</h2>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">{scans.length} Active Nodes</span>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {scans.map((scan, idx) => (
                <motion.div
                  key={scan.accountId}
                  whileHover={{ scale: 1.05, y: -4 }}
                  onClick={() => setSelectedNode(scan)}
                  className={`relative p-5 glass-card border-white/10 cursor-pointer transition-all hover:border-white/30 ${selectedNode?.accountId === scan.accountId ? 'ring-2 ring-emerald-500 border-emerald-500/50 bg-emerald-500/5' : ''}`}
                >
                  <span className="absolute top-2 right-3 text-[9px] font-black text-white/20 italic">#{idx + 1}</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white truncate mb-1 pr-6">{scan.accountId}</p>
                  <div className="flex items-center justify-between mt-3">
                     <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase italic tracking-widest ${scan.campaignConfig?.type === 'Retainer' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {scan.campaignConfig?.type || 'No Model'}
                     </span>
                     <span className="text-[10px] font-black italic tracking-tighter text-slate-400">${(scan.totalEarned || 0).toFixed(0)}</span>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Configuration Modal */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg glass-card p-10 border-white/20 shadow-2xl relative"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black italic tracking-tighter uppercase">Configure Node</h3>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">{selectedNode.accountId}</p>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white">✕</button>
                </div>

                {/* Model Selector Toggle */}
                <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl mb-8">
                  {['CPM', 'Retainer', 'None'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        const newConfig = { ...selectedNode.campaignConfig, type };
                        setSelectedNode({ ...selectedNode, campaignConfig: newConfig });
                      }}
                      className={`flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${selectedNode.campaignConfig?.type === type ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                  {selectedNode.campaignConfig?.type === 'CPM' && (
                    <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                      <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block">CPM Rate ($)</label>
                        <input 
                          type="number" 
                          value={selectedNode.campaignConfig?.cpmRate || 10}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSelectedNode({ ...selectedNode, campaignConfig: { ...selectedNode.campaignConfig, cpmRate: val } });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block">Threshold (Views)</label>
                        <input 
                          type="number" 
                          value={selectedNode.campaignConfig?.threshold || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setSelectedNode({ ...selectedNode, campaignConfig: { ...selectedNode.campaignConfig, threshold: val } });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.campaignConfig?.type === 'Retainer' && (
                    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block">Retainer Amt ($)</label>
                          <input 
                            type="number" 
                            value={selectedNode.campaignConfig?.retainerAmount || 100}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setSelectedNode({ ...selectedNode, campaignConfig: { ...selectedNode.campaignConfig, retainerAmount: val } });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block">Post Quota (24h)</label>
                          <input 
                            type="number" 
                            value={selectedNode.campaignConfig?.postsQuota || 2}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setSelectedNode({ ...selectedNode, campaignConfig: { ...selectedNode.campaignConfig, postsQuota: val } });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block">Min Views for Retainer</label>
                        <input 
                          type="number" 
                          value={selectedNode.campaignConfig?.minViews || 5000}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setSelectedNode({ ...selectedNode, campaignConfig: { ...selectedNode.campaignConfig, minViews: val } });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {selectedNode.campaignConfig?.type === 'None' && (
                    <div className="py-12 text-center opacity-40">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No payout model active for this node</p>
                    </div>
                  )}

                  <div className="pt-6">
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateConfig(selectedNode.accountId, selectedNode.campaignConfig)}
                      className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Synchronizing Engine...' : 'Apply Protocol Configuration'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                            {entry.type === 'Viral Candidate' ? `⚠️ Velocity Spike: ${entry.accountId}` : (entry.videoTitle || `Node Settlement: ${entry.accountId}`)}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleString()}</span>
                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                            <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">{formatNumber(entry.totalViews)} views verified</span>
                            {entry.type && (
                              <>
                                <div className="w-1 h-1 bg-white/10 rounded-full" />
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase italic tracking-widest ${
                                  entry.type === 'Viral Candidate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                  entry.type === 'Retainer' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {entry.type}
                                </span>
                              </>
                            )}
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
