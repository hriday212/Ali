'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, DollarSign, CheckCircle2, AlertCircle, RefreshCw, HandCoins, ArrowRight, Video, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/authStore';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

interface PayoutNode {
  id: string;
  platform: string;
  totalViews: number;
  lastPaidViews: number;
  unpaidViews: number;
  yieldRate: number; // CPM per 1000 views
  amountDue: number;
  status: 'pending' | 'cleared';
}

export default function PayoutsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [nodes, setNodes] = useState<PayoutNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Temporary local state for clearing payouts without a DB
  const [clearedNodes, setClearedNodes] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchLedger() {
      setLoading(true);
      try {
        const { scans } = await safeFetchJson(API_ROUTES.SCANS);
        if (!scans) return;

        const ledgerRaw = await Promise.all(scans.map(async (scan: any) => {
          const { data } = await safeFetchJson(`${API_ROUTES.STATUS}?accountId=${scan.accountId}`);
          if (!data || !data.history) return null;
          
          const latest = data.history[data.history.length - 1];
          const totalViews = latest?.totalViews || 0;
          
          // Normally `lastPaidViews` would come from a DB. 
          // For this tool, we simulate that they were last paid at ~80% of their current views if we haven't cleared them locally yet.
          const basePaidViews = Math.floor(totalViews * 0.8);
          const lastPaid = clearedNodes[scan.accountId] || basePaidViews;
          
          const unpaid = Math.max(0, totalViews - lastPaid);
          const yieldRate = scan.platform === 'tiktok' ? 0.30 : scan.platform === 'youtube' ? 1.50 : 0.80; // Example CPMs
          const due = (unpaid / 1000) * yieldRate;

          return {
            id: scan.accountId,
            platform: scan.platform,
            totalViews: totalViews,
            lastPaidViews: lastPaid,
            unpaidViews: unpaid,
            yieldRate,
            amountDue: due,
            status: due > 0 ? 'pending' : 'cleared'
          } as PayoutNode;
        }));

        setNodes(ledgerRaw.filter(Boolean) as PayoutNode[]);
      } catch (err) {
        console.error('Ledger Fail', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLedger();
  }, [clearedNodes]);

  if (!isAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Wallet className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-widest text-slate-500">Ledger Restricted</h2>
        <p className="text-xs uppercase tracking-widest text-slate-600 mt-2">Only Network Operators can view financial telemetry.</p>
      </div>
    );
  }

  const handleSettleAccount = (id: string, currentTotal: number) => {
    setClearedNodes(prev => ({ ...prev, [id]: currentTotal }));
  };

  const totalLiability = nodes.reduce((acc, node) => acc + node.amountDue, 0);
  const totalUnpaidViews = nodes.reduce((acc, node) => acc + node.unpaidViews, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-3 text-indigo-400 mb-3">
            <HandCoins className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Decentralized Ledger</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter uppercase mb-4">Payout Matrix</h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">Automated view-debt tracking and payment clearance command center. Calculates pending liability based on real-time scan telemetry.</p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl flex-1 md:flex-none">
             <FileText className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Global Ledger Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-card p-8 border-indigo-500/20 bg-gradient-to-br from-indigo-900/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Network Liability</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-4xl font-black italic text-white tracking-tighter">${totalLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[9px] uppercase tracking-widest text-indigo-500/70 mt-4">Total pending payouts</p>
        </div>
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unbilled Views</span>
            <Video className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-4xl font-black italic text-white tracking-tighter">{totalUnpaidViews.toLocaleString()}</p>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-4">Pending verified impressions</p>
        </div>
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Nodes</span>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-4xl font-black italic text-white tracking-tighter">{nodes.length}</p>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-4">Monetized connections</p>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Syncing Blockchain Data...</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Network Node</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Gross Impressions</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Last Payout Mark</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Yield Var</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-indigo-400 text-right">Liability Due</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {nodes.map((node, idx) => (
                    <motion.tr 
                      key={node.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${node.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className="font-black italic uppercase text-white">{node.id}</span>
                        </div>
                      </td>
                      <td className="p-6 font-black text-slate-300">{node.totalViews.toLocaleString()}</td>
                      <td className="p-6 text-[11px] font-black tracking-widest text-slate-500">{node.lastPaidViews.toLocaleString()}</td>
                      <td className="p-6 text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 rounded-md border border-white/5">
                          ${node.yieldRate.toFixed(2)} CPM
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        {node.amountDue > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-black italic text-indigo-400">${node.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">FOR {node.unpaidViews.toLocaleString()} VIEWS</span>
                          </div>
                        ) : (
                          <span className="text-sm font-black italic text-emerald-500/50">CLEARED</span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {node.amountDue > 0 ? (
                          <button 
                            onClick={() => handleSettleAccount(node.id, node.totalViews)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400 text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                             Settle <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-emerald-500/50 text-[9px] font-black uppercase tracking-widest">
                             <CheckCircle2 className="w-3 h-3" /> Settled
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {nodes.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center opacity-30">
                       <AlertCircle className="w-8 h-8 mx-auto mb-3" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Nodes Found in Ledger</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
