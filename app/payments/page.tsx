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

  // Stores real payouts fetched from backend ledger
  const [payoutsDb, setPayoutsDb] = useState<any[]>([]);

  // Custom Overrides
  const [customRates, setCustomRates] = useState<Record<string, string>>({});
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [customMarks, setCustomMarks] = useState<Record<string, string>>({});
  const [customFromMarks, setCustomFromMarks] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchLedger() {
      setLoading(true);
      try {
        // Fetch Real Ledger
        let historyPayouts = [];
        try {
          const ledgerRes = await safeFetchJson(API_ROUTES.PAYOUTS);
          historyPayouts = ledgerRes?.payouts || [];
        } catch (e) {
          console.warn('Ledger fetch error, assuming empty.');
        }
        setPayoutsDb(historyPayouts);

        const { scans } = await safeFetchJson(API_ROUTES.SCANS);
        if (!scans) return;

        const ledgerRaw = await Promise.all(scans.map(async (scan: any) => {
          const { data } = await safeFetchJson(`${API_ROUTES.STATUS}?accountId=${scan.accountId}`);
          if (!data || !data.history) return null;
          
          const latest = data.history[data.history.length - 1];
          const totalViews = latest?.totalViews || 0;
          
          // Fetch real lastPaidViews from DB (max viewsAtPayment for this node)
          const nodeHistory = historyPayouts.filter((p: any) => p.accountId === scan.accountId);
          const lastPaid = nodeHistory.reduce((max: number, p: any) => Math.max(max, p.viewsAtPayment || 0), 0);
          
          const unpaid = Math.max(0, totalViews - lastPaid);
          const defaultCPM = scan.platform === 'tiktok' ? 0.30 : scan.platform === 'youtube' ? 1.50 : 0.80; // Example CPMs
          const due = (unpaid / 1000) * defaultCPM;

          return {
            id: scan.accountId,
            platform: scan.platform,
            totalViews: totalViews,
            lastPaidViews: lastPaid,
            unpaidViews: unpaid,
            yieldRate: defaultCPM,
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
  }, []);

  if (!isAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Wallet className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-widest text-slate-500">Ledger Restricted</h2>
        <p className="text-xs uppercase tracking-widest text-slate-600 mt-2">Only Network Operators can view financial telemetry.</p>
      </div>
    );
  }

  const displayNodes = nodes.map(node => {
     const yieldRate = customRates[node.id] !== undefined ? parseFloat(customRates[node.id]) : node.yieldRate;
     const settleMark = customMarks[node.id] !== undefined ? parseInt(customMarks[node.id]) : node.totalViews;
     const fromMark = customFromMarks[node.id] !== undefined ? parseInt(customFromMarks[node.id]) : node.lastPaidViews;
     
     // Debt is views between fromMark and the settleMark
     const unpaidInRange = Math.max(0, settleMark - fromMark);
     let due = (unpaidInRange / 1000) * yieldRate;

     if (customAmounts[node.id] !== undefined) due = parseFloat(customAmounts[node.id]);
     
     // Status should be pending if there are unpaid views in the range
     const status = unpaidInRange > 0 ? 'pending' : 'cleared';

     return { ...node, yieldRate, amountDue: due, status, unpaidViews: unpaidInRange } as PayoutNode;
  });

  const handleSettleAccount = async (node: PayoutNode) => {
    if (node.amountDue <= 0 && node.status === 'cleared') return;
    
    // Compute the actual due with overrides
    const actualCPM = customRates[node.id] !== undefined ? parseFloat(customRates[node.id]) : node.yieldRate;
    const actualDue = customAmounts[node.id] !== undefined ? parseFloat(customAmounts[node.id]) : node.amountDue;
    const actualMark = customMarks[node.id] !== undefined ? parseInt(customMarks[node.id]) : node.totalViews;

    // Send Real Settlement to Ledger
    const newPayout = {
      id: crypto.randomUUID(),
      accountId: node.id,
      platform: node.platform,
      amount: actualDue,
      paidAt: new Date().toISOString(),
      viewsAtPayment: actualMark,
      yieldRate: actualCPM,
      nodeId: node.id
    };

    try {
      await safeFetchJson(API_ROUTES.PAYOUTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayout)
      });
      
      // Update local state
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, lastPaidViews: actualMark } : n));
      
      // Clear overrides
      const cRates = {...customRates}; delete cRates[node.id]; setCustomRates(cRates);
      const cAmounts = {...customAmounts}; delete cAmounts[node.id]; setCustomAmounts(cAmounts);
      const cMarks = {...customMarks}; delete cMarks[node.id]; setCustomMarks(cMarks);
      const cFromMarks = {...customFromMarks}; delete cFromMarks[node.id]; setCustomFromMarks(cFromMarks);

    } catch (e) {
      console.error('Settlement Failed:', e);
    }
  };

  const handleExportCSV = () => {
    if (displayNodes.length === 0) return;

    const headers = ["Network-Node", "Impressions", "Last-Payout-Mark", "Liability-Due-($)", "Status"];
    const rows = displayNodes.map(node => [
      node.id,
      node.totalViews,
      node.lastPaidViews,
      node.amountDue.toFixed(2),
      node.status.toUpperCase()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Clypso_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLiability = displayNodes.reduce((acc, node) => acc + node.amountDue, 0);
  const totalUnpaidViews = displayNodes.reduce((acc, node) => acc + node.unpaidViews, 0);

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
          <button 
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl flex-1 md:flex-none transition-all active:scale-95"
          >
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
              <thead className="border-b border-white/5 bg-white/[0.01]">
                <tr>
                  <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Network Node</th>
                  <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Impressions</th>
                  <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Settlement Range (From → To)</th>
                  <th className="p-6 text-left text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 underline decoration-indigo-500/30">Yield (CPM)</th>
                  <th className="p-6 text-right text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Liability ($)</th>
                  <th className="p-6 text-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {displayNodes.map((node, idx) => (
                    <motion.tr 
                      key={node.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase text-indigo-400">{node.platform.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-black italic text-white uppercase tracking-tighter">{node.id}</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">{node.platform} Node</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black italic text-white">{node.totalViews.toLocaleString()}</span>
                          <span className="text-[8px] font-black uppercase text-slate-700 tracking-widest">total</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[7px] font-black uppercase text-slate-600 tracking-widest pl-1">From</span>
                            <input 
                              type="number"
                              value={customFromMarks[node.id] !== undefined ? customFromMarks[node.id] : node.lastPaidViews} 
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== '') setCustomFromMarks({...customFromMarks, [node.id]: val});
                                else {
                                  const cFromMarks = {...customFromMarks}; delete cFromMarks[node.id]; setCustomFromMarks(cFromMarks);
                                }
                              }}
                              className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] font-black italic text-slate-500 focus:text-white focus:border-white/30 outline-none transition-all"
                            />
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-800 mt-4" />
                          <div className="flex flex-col gap-1">
                            <span className="text-[7px] font-black uppercase text-slate-600 tracking-widest pl-1">To</span>
                            <input 
                              type="number"
                              value={customMarks[node.id] !== undefined ? customMarks[node.id] : node.totalViews} 
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== '') setCustomMarks({...customMarks, [node.id]: val});
                                else {
                                  const cMarks = {...customMarks}; delete cMarks[node.id]; setCustomMarks(cMarks);
                                }
                              }}
                              className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] font-black italic text-white/50 focus:text-white focus:border-white/30 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <input 
                          type="number"
                          step="0.01"
                          value={customRates[node.id] !== undefined ? customRates[node.id] : node.yieldRate.toFixed(2)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '') setCustomRates({...customRates, [node.id]: val});
                            else {
                              const cRates = {...customRates}; delete cRates[node.id]; setCustomRates(cRates);
                            }
                          }}
                          className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] font-black italic text-indigo-400 focus:border-indigo-500 outline-none"
                        />
                      </td>
                      <td className="p-6 text-right">
                        {node.amountDue > 0 ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-indigo-500 font-black italic">$</span>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={customAmounts[node.id] !== undefined ? customAmounts[node.id] : node.amountDue.toFixed(2)} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val !== '') {
                                      setCustomAmounts({...customAmounts, [node.id]: val});
                                    } else {
                                      const cAmounts = {...customAmounts};
                                      delete cAmounts[node.id];
                                      setCustomAmounts(cAmounts);
                                    }
                                  }}
                                  className="w-20 bg-white/5 border border-indigo-500/30 rounded px-2 py-1 text-sm font-black italic text-indigo-400 text-right focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">FOR {node.unpaidViews.toLocaleString()} VIEWS</span>
                          </div>
                        ) : (
                          <span className="text-sm font-black italic text-emerald-500/50">CLEARED</span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {node.amountDue > 0 ? (
                          <button 
                            onClick={() => handleSettleAccount(node)}
                            disabled={!isAdmin}
                            className={`inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isAdmin ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-white/5 text-slate-600 cursor-not-allowed'}`}
                          >
                             {isAdmin ? 'Settle' : 'Locked'} <ArrowRight className="w-3 h-3" />
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
