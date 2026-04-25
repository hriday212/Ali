'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Database,
  RefreshCw,
  Search,
  Loader2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AccountCard from '@/components/dashboard/AccountCard';
import { getAccounts, saveAccounts, type Account } from '@/lib/accountsStore';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n) : n;
  if (isNaN(num)) return String(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Load accounts from localStorage on mount AND sync with backend
  useEffect(() => {
    const local = getAccounts();
    setAccounts(local);

    const syncWithBackend = async () => {
      try {
        const data = await safeFetchJson(API_ROUTES.SCANS);
        if (data && data.scans) {
          const { scans } = data;
          const backendAccounts: Account[] = scans.map((s: any) => ({
            id: s.accountId,
            name: s.accountId, 
            platform: s.platform,
            link: s.accountLink,
            followers: formatNumber(s.lastViews || 0),
            status: 'connected',
            hasNew: false,
            avatarUrl: '',
            channelId: '', 
            addedAt: new Date().toISOString(),
          }));

          const existingIds = new Set(local.map(a => a.id));
          const toAdd = backendAccounts.filter(a => !existingIds.has(a.id));
          
          // Even if none to add, update the followers/stats of existing ones
          const updatedLocal = local.map(acc => {
            const fresh = backendAccounts.find(b => b.id === acc.id);
            if (fresh) {
              return { ...acc, followers: fresh.followers, platform: fresh.platform };
            }
            return acc;
          });

          if (toAdd.length > 0 || JSON.stringify(updatedLocal) !== JSON.stringify(local)) {
            const merged = [...updatedLocal, ...toAdd];
            setAccounts(merged);
            saveAccounts(merged);
          }
        }
      } catch (err) {
        console.error('Failed to sync with backend nodes:', err);
      }
    };
    syncWithBackend();
  }, []);

  const handleDelete = (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    saveAccounts(updated);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setIsAdding(true);
    setAddError('');

    try {
      // Call our server-side API to resolve the channel
      const res = await fetch('/api/accounts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to resolve account');
      }

      const data = await res.json();

      const newAcc: Account = {
        id: Date.now().toString(),
        name: data.name || newUrl.split('/').pop()?.replace('@', '') || 'New Account',
        platform: data.platform || 'youtube',
        link: newUrl,
        followers: data.followers || '0',
        status: 'connected',
        hasNew: false,
        avatarUrl: data.avatarUrl || '',
        channelId: data.channelId || '',
        addedAt: new Date().toISOString(),
      };

      const updated = [newAcc, ...accounts];
      setAccounts(updated);
      saveAccounts(updated);
      setNewUrl('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add account');
    } finally {
      setIsAdding(false);
    }
  };

  const filteredAccounts = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.platform.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24 pt-24">
      {/* 1. Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: API HUD */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">API Pulse</p>
              <h3 className="text-xl font-black text-white italic">Operational</h3>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">YouTube API V3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Apify Engine</span>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 blur-3xl rounded-full" />
        </div>

        {/* Card 2: Nodes Count */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Connected Nodes</p>
              <h3 className="text-xl font-black text-white italic">{accounts.length}<span className="text-xs font-normal text-slate-500 ml-1 italic select-none">Accounts</span></h3>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span>{accounts.filter(a => a.platform === 'youtube').length} YouTube</span>
            <span>{accounts.filter(a => a.platform === 'instagram').length} Instagram</span>
            <span>{accounts.filter(a => a.platform === 'tiktok').length} TikTok</span>
          </div>
        </div>

        {/* Card 3: Sync Health */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sync Health</p>
              <h3 className="text-xl font-black text-white italic">{accounts.length > 0 ? 'Active' : 'Idle'}</h3>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-white/20 transition-colors">
              <RefreshCw className="w-5 h-5 shadow-sm" />
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic">{accounts.length > 0 ? `${accounts.length} Nodes Synchronized` : 'Add a node to begin'}</p>
        </div>
      </div>

      {/* 2. Network Console */}
      <div className="glass-card p-8 relative overflow-hidden min-h-[500px]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
          <div className="text-left w-full sm:w-auto">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
              Network Inventory
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-8 h-[2px] bg-white/20" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                {filteredAccounts.length} Connected Entities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
              <input 
                type="text"
                placeholder="Search Registry..."
                className="w-full bg-black/40 border border-white/5 rounded-full py-3 px-12 text-[10px] font-bold uppercase tracking-widest text-white placeholder:text-slate-700 focus:border-white/20 outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-8 py-3 bg-white hover:bg-slate-200 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all active:scale-95 shadow-xl shadow-white/5 whitespace-nowrap"
            >
              Add Node
            </button>
          </div>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          <AnimatePresence mode="popLayout">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <AccountCard 
                  key={account.id}
                  account={account}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-24 gap-6"
              >
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
                  <Plus className="w-8 h-8 text-slate-700" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">No Nodes Connected</p>
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] italic">Click "Add Node" to connect a YouTube channel</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-full transition-all"
                >
                  Connect First Node
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/[0.02] blur-[100px] rounded-full" />
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
              onClick={() => { setIsAddModalOpen(false); setAddError(''); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 blur-[80px] rounded-full" />

              <h2 className="text-3xl font-black text-white italic tracking-tight uppercase mb-2">Connect Channel</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Enter YouTube channel URL to start tracking</p>

              {addError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{addError}</p>
                </div>
              )}

              <form onSubmit={handleAddAccount} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Channel URL</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/@channelname"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-white/30 rounded-2xl py-4 px-6 text-white placeholder:text-slate-800 outline-none transition-all font-bold"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    autoFocus
                    disabled={isAdding}
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setAddError(''); }}
                    className="flex-1 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all uppercase text-xs tracking-widest"
                    disabled={isAdding}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding || !newUrl}
                    className="flex-[2] px-8 py-4 bg-white hover:bg-slate-200 text-black font-black rounded-2xl shadow-lg shadow-white/10 transition-all uppercase text-xs tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isAdding ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Resolving...</>
                    ) : (
                      'Initialize Sync'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
