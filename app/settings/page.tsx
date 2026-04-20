'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Clock, Zap, Shield, AlertTriangle, Loader2, Gauge, Server, KeySquare, Brain, ChevronDown, ChevronUp, Info, DollarSign, Cpu, Database, Globe, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/authStore';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';
import { ApiPulse } from '@/components/dashboard/ApiPulse';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeCadence, setActiveCadence] = useState<number>(30);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [smartEngineEnabled, setSmartEngineEnabled] = useState(true);
  const [isTogglingSmartEngine, setIsTogglingSmartEngine] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await safeFetchJson(API_ROUTES.SCANS);
        if (data && data.scans) setNodeCount(data.scans.length);
        if (data && typeof data.smartEngineEnabled === 'boolean') setSmartEngineEnabled(data.smartEngineEnabled);
        if (data && data.globalDefaultInterval) setActiveCadence(data.globalDefaultInterval);
      } catch (err) {}
    }
    loadStats();
  }, []);

  if (!isAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Shield className="w-16 h-16 text-red-500/50 mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-widest text-slate-500">Access Denied</h2>
        <p className="text-xs uppercase tracking-widest text-slate-600 mt-2">Level 4 Clearance Required</p>
      </div>
    );
  }

  const handleUpdateCadence = async (mins: number) => {
    setIsUpdating(true);
    setActiveCadence(mins);
    try {
      await fetch(API_ROUTES.GLOBAL_INTERVAL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: mins }),
      });
    } catch (err) {
      console.error('Failed to update cadence:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await fetch(API_ROUTES.FORCE_SYNC, { method: 'POST' });
    } catch (err) {
      console.error('Failed to force sync:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 1500);
    }
  };

  const handleToggleSmartEngine = async () => {
    setIsTogglingSmartEngine(true);
    const newState = !smartEngineEnabled;
    try {
      const res = await fetch(API_ROUTES.SMART_ENGINE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState }),
      });
      const data = await res.json();
      if (data.success) setSmartEngineEnabled(newState);
    } catch (err) {
      console.error('Failed to toggle SmartEngine:', err);
    } finally {
      setIsTogglingSmartEngine(false);
    }
  };

  const cadences = [
    { label: 'Turbo', value: 10, desc: 'Highest consumption. Active Viral mode.', color: 'text-red-500', bg: 'bg-red-500' },
    { label: 'Standard', value: 30, desc: 'Balanced polling. Default network rate.', color: 'text-blue-500', bg: 'bg-blue-500' },
    { label: 'Economy', value: 360, desc: '6hr intervals. Preserves token limits.', color: 'text-emerald-500', bg: 'bg-emerald-500' },
    { label: 'Weekly', value: 10080, desc: 'Audits on Sunday only. Maximum dormant.', color: 'text-slate-500', bg: 'bg-slate-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 text-emerald-400 mb-3">
          <Settings2 className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">System Configuration</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter uppercase mb-4">Command Center</h1>
        <p className="text-slate-400 text-lg leading-relaxed">Global network controls and API token threshold management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cadence Control widget */}
        <div className="glass-card p-8 border border-blue-500/20 relative overflow-hidden bg-gradient-to-br from-blue-900/10 to-transparent">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
             <Gauge className="w-32 h-32 text-blue-500" />
          </div>
          <h2 className="text-xl font-black italic uppercase text-white tracking-widest mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" /> Global Polling Cadence
          </h2>
          <p className="text-xs text-slate-400 mb-8 max-w-sm">Adjust how frequently the backend scraper engines poll the {nodeCount} active nodes. Faster intervals consume more Apify credits.</p>
          
          <div className="space-y-4 relative z-10">
            {cadences.map((cad) => {
              const isActive = activeCadence === cad.value;
              return (
                <button
                  key={cad.value}
                  onClick={() => handleUpdateCadence(cad.value)}
                  disabled={isUpdating}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isActive ? 'bg-white/10 border-white/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                >
                  <div className="text-left">
                    <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${isActive ? cad.color : 'text-slate-300'}`}>
                      {cad.label} {isActive && <span className="flex h-2 w-2 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cad.bg}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${cad.bg}`}></span>
                      </span>}
                    </h3>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">{cad.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black italic tracking-tighter text-white">{cad.value}m</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* SmartEngine Toggle */}
          <div className={`glass-card p-8 border relative overflow-hidden transition-all ${smartEngineEnabled ? 'border-amber-500/30 bg-gradient-to-br from-amber-900/10 to-transparent' : 'border-white/10 bg-gradient-to-br from-slate-900/10 to-transparent'}`}>
            <div className="absolute top-0 right-0 p-6 opacity-15 pointer-events-none">
               <Brain className="w-28 h-28 text-amber-500" />
            </div>
            <h2 className="text-lg font-black italic uppercase text-white tracking-widest mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" /> SmartEngine Auto-Escalation
            </h2>
            <p className="text-xs text-slate-400 mb-4 max-w-sm leading-relaxed">
              When enabled, the SmartEngine will <span className="text-amber-400 font-bold">automatically override</span> your chosen cadence and escalate polling to every 10 minutes if it detects high view activity on any node. It will also throttle dormant nodes to save tokens.
            </p>
            
            {smartEngineEnabled && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300/80 leading-relaxed">
                  <span className="font-black">WARNING:</span> SmartEngine can silently override your weekly/economy cadence for hot nodes, which may consume significant Apify credits without your knowledge.
                </p>
              </div>
            )}
            
            <button
              onClick={handleToggleSmartEngine}
              disabled={isTogglingSmartEngine}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 border text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
                smartEngineEnabled
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-slate-400'
              }`}
            >
              {isTogglingSmartEngine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {smartEngineEnabled ? 'Disable SmartEngine' : 'Enable SmartEngine'}
            </button>
          </div>

          {/* ActionWidget: Force Sync */}
          <div className="glass-card p-8 border border-emerald-500/20 bg-gradient-to-br from-emerald-900/10 to-transparent">
            <h2 className="text-lg font-black italic uppercase text-white tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> Administrative Override
            </h2>
            <p className="text-xs text-slate-400 mb-6">Instantly dispatch a scan command to all active nodes in the registry, overriding current Smart Engine cooldowns.</p>
            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
              {isSyncing ? 'Dispatching...' : 'Force Global Sync'}
            </button>
          </div>

          {/* API Pulse — Live Credit Monitor */}
          <ApiPulse />
        </div>

      </div>

      {/* ═══════════ COMPREHENSIVE WARNINGS & TOKEN GUIDE ═══════════ */}
      <div className="glass-card border border-red-500/20 bg-gradient-to-br from-red-900/5 to-transparent overflow-hidden">
        <button 
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between p-8 text-left"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h2 className="text-xl font-black italic uppercase text-white tracking-widest">Token Management &amp; Safety Guide</h2>
              <p className="text-xs text-slate-400 mt-1">Critical information about API consumption, billing, and best practices</p>
            </div>
          </div>
          {guideOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        <AnimatePresence>
          {guideOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-8 pb-8 space-y-8 text-sm leading-relaxed">

                {/* Section 1: How the Scan Engine Works */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Cpu className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-widest">How the Scan Engine Works</h3>
                  </div>
                  <div className="text-slate-300 space-y-3 pl-6 border-l border-blue-500/20">
                    <p>
                      The Clypso Scan Engine is a <span className="text-white font-bold">background Node.js process</span> that continuously polls social media platforms for view counts, likes, comments, and other engagement metrics. It operates independently from the frontend dashboard — the dashboard simply reads the data the engine has already collected.
                    </p>
                    <p>
                      When the engine starts, it <span className="text-white font-bold">restores its state from disk</span> (the <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">active-scans.json</code> file). This means all your configured nodes, cadence settings, and scan history persist across server restarts. The engine does NOT re-read the <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">defaultAccounts.js</code> file once state has been saved — that file is only used for the very first boot.
                    </p>
                    <p>
                      Each node (e.g., <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">linkmetalks-yt</code>) has its own independent timer. When a scan completes, the engine schedules the next scan based on the current cadence interval. This means nodes can be at different stages of their polling cycle at any given time.
                    </p>
                  </div>
                </div>

                {/* Section 2: Platform API Differences */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Globe className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Platform API Costs</h3>
                  </div>
                  <div className="text-slate-300 space-y-3 pl-6 border-l border-emerald-500/20">
                    <p>
                      <span className="text-emerald-400 font-black">YouTube:</span> Uses the <span className="text-white font-bold">official Google YouTube Data API v3</span> directly. This is <span className="text-emerald-400 font-bold">completely free</span> and does NOT consume any Apify credits. Google provides a generous daily quota of 10,000 units. Each scan uses approximately 3-5 units (channel lookup + playlist + video stats). Even at Turbo (10-minute) cadence, you would use roughly 720-2,160 units per day per YouTube node — well within the free quota.
                    </p>
                    <p>
                      <span className="text-blue-400 font-black">TikTok:</span> Uses the <span className="text-white font-bold">Apify TikTok Scraper</span> (<code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">clockworks/tiktok-scraper</code>). Each scan consumes approximately <span className="text-red-400 font-bold">0.1 - 0.3 GB of Apify compute</span> depending on the number of posts scraped (currently set to 20 posts per scan). This is the most expensive platform to poll frequently.
                    </p>
                    <p>
                      <span className="text-pink-400 font-black">Instagram:</span> Uses the <span className="text-white font-bold">Apify Instagram Scraper</span> (<code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">apify/instagram-scraper</code>). Each scan consumes approximately <span className="text-red-400 font-bold">0.05 - 0.15 GB of Apify compute</span>. Instagram scraping is slightly cheaper than TikTok but still significant at high frequencies.
                    </p>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-3">
                      <p className="text-red-300 text-xs font-bold">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        BOTTOM LINE: YouTube scanning is essentially free. TikTok and Instagram scanning costs real Apify compute units. When conserving credits, prioritize reducing the cadence for TikTok/Instagram nodes specifically.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Apify Billing & RAM */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <DollarSign className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Apify Billing &amp; RAM Usage</h3>
                  </div>
                  <div className="text-slate-300 space-y-3 pl-6 border-l border-amber-500/20">
                    <p>
                      Apify uses a <span className="text-white font-bold">&quot;Compute Unit&quot;</span> billing model measured in GB-hours. The free tier provides <span className="text-amber-400 font-bold">8 GB of total compute per month</span>. This is NOT RAM in the traditional sense — it is a cumulative measure of (memory used) × (time running). When your dashboard shows &quot;4/8 GB used,&quot; it means you have consumed 4 GB-hours of compute this billing cycle.
                    </p>
                    <p>
                      <span className="text-white font-bold">Does it reset?</span> Yes. Your compute allowance <span className="text-emerald-400 font-bold">fully resets on the 1st of every month</span> (or your billing anniversary). You do NOT need to create new accounts — just wait for the reset, or upgrade to the $49/month Starter plan for 100 GB of compute.
                    </p>
                    <p>
                      <span className="text-white font-bold">Estimated monthly costs by cadence (for 3 TikTok/Instagram nodes):</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {[
                        { label: 'Turbo (10m)', usage: '~90 GB/mo', status: 'text-red-400', note: 'Exceeds free tier' },
                        { label: 'Standard (30m)', usage: '~30 GB/mo', status: 'text-red-400', note: 'Requires Starter plan' },
                        { label: 'Economy (6hr)', usage: '~2.4 GB/mo', status: 'text-emerald-400', note: 'Within free tier' },
                        { label: 'Weekly', usage: '~0.3 GB/mo', status: 'text-emerald-400', note: 'Minimal usage' },
                      ].map(item => (
                        <div key={item.label} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                          <p className={`text-sm font-black ${item.status} mt-1`}>{item.usage}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 4: SmartEngine Explained */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Brain className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-widest">SmartEngine Auto-Escalation</h3>
                  </div>
                  <div className="text-slate-300 space-y-3 pl-6 border-l border-purple-500/20">
                    <p>
                      The SmartEngine is an AI-like optimization layer that dynamically adjusts polling intervals. When <span className="text-emerald-400 font-bold">ENABLED</span>, it performs two automatic actions:
                    </p>
                    <p>
                      <span className="text-purple-400 font-bold">1. Viral Escalation:</span> If a node gains more than 100 views between consecutive scans, the SmartEngine considers it &quot;hot&quot; and <span className="text-red-400 font-bold">overrides your cadence to 10 minutes</span>, regardless of what you set in the Global Polling Cadence above. This is designed to capture viral growth curves in real-time but can rapidly consume your Apify credits.
                    </p>
                    <p>
                      <span className="text-purple-400 font-bold">2. Dormancy Throttling:</span> If a node shows zero view growth between scans and has few recent posts, the SmartEngine will progressively slow down polling (up to once per week for dead accounts). This saves credits on inactive channels but may cause you to miss sudden activity surges.
                    </p>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-3">
                      <p className="text-amber-300 text-xs font-bold">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        RECOMMENDATION: If you are on the free Apify tier, keep SmartEngine DISABLED and manually control your cadence. Enable it only when you have sufficient compute headroom or are on a paid Apify plan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Best Practices */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <BarChart3 className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Best Practices &amp; Recommendations</h3>
                  </div>
                  <div className="text-slate-300 space-y-3 pl-6 border-l border-cyan-500/20">
                    <p><span className="text-white font-bold">1. Scale YouTube nodes freely.</span> Since YouTube uses the free Google API, you can add as many YouTube nodes as you want and set them to Turbo cadence without any cost implications. YouTube is your &quot;free intelligence layer.&quot;</p>
                    <p><span className="text-white font-bold">2. Be strategic with TikTok/Instagram.</span> Reserve these for your highest-priority nodes. Use Economy or Weekly cadence unless you are actively monitoring a viral moment.</p>
                    <p><span className="text-white font-bold">3. Use Force Sync sparingly.</span> The &quot;Force Global Sync&quot; button triggers an immediate scan on ALL nodes simultaneously. If you have 10+ TikTok/Instagram nodes, a single Force Sync can consume 1-3 GB of compute in one burst.</p>
                    <p><span className="text-white font-bold">4. Monitor your Apify dashboard.</span> Visit <a href="https://console.apify.com/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 transition-colors">console.apify.com/billing</a> regularly to track real-time usage and set up email alerts when approaching your limit.</p>
                    <p><span className="text-white font-bold">5. The High-Water Mark system protects your data.</span> Even if a scan fails or returns fewer results, your historical peak metrics are never lost. The engine always preserves the highest view count ever recorded for each video, ensuring your graphs only trend upward.</p>
                    <p><span className="text-white font-bold">6. Consider per-platform cadence (future feature).</span> Currently, the Global Cadence applies uniformly to all nodes. A future enhancement could allow setting different intervals per platform (e.g., YouTube: Turbo, TikTok: Weekly) to optimize cost vs. coverage.</p>
                  </div>
                </div>

                {/* Section 6: Data Persistence */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Database className="w-4 h-4" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Data Persistence &amp; Storage</h3>
                  </div>
                  <div className="text-slate-300 space-y-3 pl-6 border-l border-slate-500/20">
                    <p>
                      All scan data is stored locally in JSON files at <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">~/.forensic-scan-data/</code>. Each node has its own file (e.g., <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">linkmetalks-yt.json</code>) containing posts, view history (up to 50 data points), per-video history, and high-water marks. The <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">active-scans.json</code> file stores the current engine state including active nodes, their cadences, and the SmartEngine configuration.
                    </p>
                    <p>
                      <span className="text-white font-bold">To fully reset the engine:</span> Stop the server, delete the <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">~/.forensic-scan-data/</code> directory, and restart. The engine will re-initialize from <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs">defaultAccounts.js</code> with default cadence settings. All historical data will be lost.
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
