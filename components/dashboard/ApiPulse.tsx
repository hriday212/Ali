'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeySquare, Loader2, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

interface TokenInfo {
  key: string;
  status: 'active' | 'exhausted' | 'error';
  monthlyUsageUsd: number;
  maxMonthlyUsageUsd: number;
  usagePct: number;
  error?: string;
}

interface UsageData {
  tokens: TokenInfo[];
  activeTokenCount: number;
  totalUsedUsd: number;
  totalLimitUsd: number;
  totalPct: number;
}

export function ApiPulse() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsage = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await safeFetchJson(API_ROUTES.APIFY_USAGE);
      if (res) setData(res);
    } catch (e) {
      console.error('Failed to load API usage:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(() => fetchUsage(), 60000);
    return () => clearInterval(interval);
  }, []);

  const getBarColor = (pct: number, status: string) => {
    if (status === 'exhausted') return 'bg-red-500';
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-2.5 h-2.5" /><span className="text-[7px] font-black uppercase tracking-widest">Live</span></span>;
    if (status === 'exhausted') return <span className="flex items-center gap-1 text-red-400"><XCircle className="w-2.5 h-2.5" /><span className="text-[7px] font-black uppercase tracking-widest">Dead</span></span>;
    return <span className="flex items-center gap-1 text-slate-500"><AlertTriangle className="w-2.5 h-2.5" /><span className="text-[7px] font-black uppercase tracking-widest">Err</span></span>;
  };

  return (
    <div className="glass-card p-8 border border-cyan-500/20 bg-gradient-to-br from-cyan-900/10 to-transparent relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
        <KeySquare className="w-28 h-28 text-cyan-500" />
      </div>

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black italic uppercase text-white tracking-widest flex items-center gap-2">
          <KeySquare className="w-4 h-4 text-cyan-400" /> API Pulse
        </h2>
        <button
          onClick={() => fetchUsage(true)}
          disabled={refreshing}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Querying Apify Billing...</span>
        </div>
      ) : !data ? (
        <div className="py-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Failed to connect to backend</p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {/* Aggregate Total */}
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Total Network Budget</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400">
                {data.activeTokenCount} Active / {data.tokens.length} Total Keys
              </span>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-black italic tracking-tighter text-white">
                ${data.totalUsedUsd.toFixed(2)}
                <span className="text-sm text-slate-500 ml-1">/ ${data.totalLimitUsd.toFixed(2)}</span>
              </span>
              <span className={`text-sm font-black italic ${data.totalPct >= 90 ? 'text-red-400' : data.totalPct >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {data.totalPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(data.totalPct, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${getBarColor(data.totalPct, 'active')}`}
              />
            </div>
          </div>

          {/* Per-Token Breakdown */}
          {data.tokens.map((token, i) => (
            <div key={token.key} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
              <div className="w-16 shrink-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{token.key}</p>
              </div>
              <div className="flex-1">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(token.usagePct, 100)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`h-full rounded-full ${getBarColor(token.usagePct, token.status)}`}
                  />
                </div>
              </div>
              <div className="w-20 text-right shrink-0">
                <span className="text-[9px] font-black italic text-white">${token.monthlyUsageUsd?.toFixed(2) || '0.00'}</span>
                <span className="text-[9px] text-slate-600"> / ${token.maxMonthlyUsageUsd?.toFixed(2) || '5.00'}</span>
              </div>
              <div className="w-12 shrink-0 text-right">
                {getStatusBadge(token.status)}
              </div>
            </div>
          ))}

          {/* YouTube Status */}
          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">YouTube v3 API</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span className="text-[7px] font-black uppercase tracking-widest">Free Tier • Unlimited</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
