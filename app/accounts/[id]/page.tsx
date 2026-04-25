'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  Calendar,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  User,
  Database,
  X,
  RefreshCw,
  Play,
  Film,
  Loader2,
  AlertCircle,
  Scan,
  Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  Brush
} from 'recharts';
import {
  HookDecayChart,
  SentimentCloud,
  ViralVelocityRadar,
  UploadOptimization,
  AudienceForensics,
  MonetizationFunnel,
  EcosystemGravity,
  SaveShareMatrix
} from '@/components/dashboard/VisualizationSuite';
import { getAccountById, type Account } from '@/lib/accountsStore';
import { getPayouts, getPayoutsForAccount, type PayoutRecord } from '@/lib/payoutsStore';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

// --- Types ---
interface PostData {
  id: string;
  title: string;
  thumbnail: string;
  views: number | string;
  likes: number | string;
  comments: number | string;
  link: string;
  date?: string;
  type?: string;
  platform?: string;
}

// Chart data placeholder (used before real scan data populates)
const CHART_PLACEHOLDER = [
  { time: 'Day 1', views: 4000 },
  { time: 'Day 5', views: 12000 },
  { time: 'Day 10', views: 8000 },
  { time: 'Day 15', views: 25000 },
  { time: 'Day 20', views: 18000 },
  { time: 'Day 25', views: 42000 },
  { time: 'Day 30', views: 35000 },
];

// --- Helpers ---
function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n) : n;
  if (isNaN(num)) return String(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function AccountForensicPage() {
  const params = useParams();
  const router = useRouter();
  const [activeSubHUD, setActiveSubHUD] = React.useState<'performance' | 'engagement' | null>(null);
  const [selectedPost, setSelectedPost] = React.useState<PostData | null>(null);

  // Registry state
  const [registryTab, setRegistryTab] = React.useState<'videos' | 'shorts'>('videos');
  const [videosVisible, setVideosVisible] = React.useState(10);
  const [shortsVisible, setShortsVisible] = React.useState(10);

  // API data state
  const [allPosts, setAllPosts] = React.useState<PostData[]>([]);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [hasScanned, setHasScanned] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Payout data from shared store
  const [payouts, setPayouts] = React.useState<PayoutRecord[]>([]);

  // Auto-scan state (synced from global ScanManager)
  const [autoScanActive, setAutoScanActive] = React.useState(false);
  const [isScraping, setIsScraping] = React.useState(false);
  const [nextScanIn, setNextScanIn] = React.useState(0);
  const [scanCount, setScanCount] = React.useState(0);
  const [lastScanTime, setLastScanTime] = React.useState<string | null>(null);

  // Interval picker state
  const [showIntervalPicker, setShowIntervalPicker] = React.useState(false);
  const [isGraphZoomed, setIsGraphZoomed] = React.useState(false);
  const [intervalMinutes, setIntervalMinutes] = React.useState(5);
  const [customMinutes, setCustomMinutes] = React.useState('');

  // Scan history
  const [scanHistory, setScanHistory] = React.useState<Array<{ time: string; totalViews: number; totalLikes: number; totalComments: number; totalShares: number }>>([]);
  const [videoHistoryMap, setVideoHistoryMap] = React.useState<Record<string, Array<{ time: string; views: number }>>>({});

  // Chart Timeframe State
  const [timeframe, setTimeframe] = React.useState('ALL');


  // Load account from persistent store
  const [account, setAccount] = React.useState<Account | null>(null);
  const [accountLoading, setAccountLoading] = React.useState(true);

  // --- Load account + existing data on mount ---
  React.useEffect(() => {
    const found = getAccountById(params.id as string);
    setAccount(found);
    setAccountLoading(false);

    if (found) {
      // Load cached data from localStorage (works even when backend is off)
      try {
        const stored = localStorage.getItem(`scan_data_${found.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setScanHistory(parsed.history || []);
          setVideoHistoryMap(parsed.videoHistory || {});
          if (parsed.posts && parsed.posts.length > 0) {
            setAllPosts(parsed.posts);
            setHasScanned(true);
          }
        }
      } catch (err) {
        // Silently ignore storage errors
      }
      // Initial Ledger Pull
      safeFetchJson(API_ROUTES.PAYOUTS).then((res) => {
        if (res && res.payouts) {
          setPayouts(res.payouts.filter((p: any) => p.accountId === found.id));
        }
      });
    }
  }, [params.id]);

  // --- Sync UI with SERVER Scan Manager (polling) ---
  React.useEffect(() => {
    if (!account) return;

    const pollStatus = async () => {
      try {
        const statusResult = await safeFetchJson(`${API_ROUTES.STATUS}?accountId=${account.id}`);
        
        // Sync Latest Ledger
        try {
          const ledgerResult = await safeFetchJson(API_ROUTES.PAYOUTS);
          if (ledgerResult && ledgerResult.payouts) {
            setPayouts(ledgerResult.payouts.filter((p: any) => p.accountId === account.id));
          }
        } catch (e) {
          // Ignore polling ledger errors
        }

        if (statusResult) {
          if (statusResult.active) {
            const s = statusResult.status;
            setAutoScanActive(true);
            setIsScraping(!!s.isScraping);
            setNextScanIn(s.secondsRemaining);
            setScanCount(s.scanCount);
            setLastScanTime(s.lastScanTime);
            setIntervalMinutes(s.intervalMinutes);
          } else {
            setAutoScanActive(false);
          }

          // Always update data if it exists, active or not
          if (statusResult.data) {
            const { posts, history, videoHistory } = statusResult.data;
            setAllPosts(posts || []);
            setScanHistory(history || []);
            setVideoHistoryMap(videoHistory || {});
            if (posts?.length > 0) setHasScanned(true);

            // Cache to localStorage so data survives when monitoring stops
            try {
              localStorage.setItem(`scan_data_${account.id}`, JSON.stringify({
                posts: posts || [],
                history: history || [],
                videoHistory: videoHistory || {},
              }));
            } catch (e) {
              // Storage full or unavailable — ignore
            }
          }
        }
      } catch (err) {
        // Backend offline — cached data from localStorage is already loaded
      }
    };

    const intervalId = setInterval(pollStatus, 2000);
    pollStatus();
    return () => clearInterval(intervalId);
  }, [account]);

  // ESC Key to Close Dialogs
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSubHUD(null);
        setSelectedPost(null);
        setShowIntervalPicker(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- Derived Data ---
  const shorts = allPosts.filter(p => p.type === 'short' || p.platform === 'tiktok' || p.type === 'reel');
  const videos = allPosts.filter(p => p.type === 'video' || (!shorts.includes(p)));
  const activeList = registryTab === 'videos' ? videos : shorts;
  const visibleCount = registryTab === 'videos' ? videosVisible : shortsVisible;
  const visibleAssets = activeList.slice(0, visibleCount);

  // Aggregate stats from real data
  const totalViews = allPosts.reduce((sum, p) => sum + (typeof p.views === 'number' ? p.views : parseInt(String(p.views)) || 0), 0);
  const totalLikes = allPosts.reduce((sum, p) => sum + (typeof p.likes === 'number' ? p.likes : parseInt(String(p.likes)) || 0), 0);
  const totalComments = allPosts.reduce((sum, p) => sum + (typeof p.comments === 'number' ? p.comments : parseInt(String(p.comments)) || 0), 0);

  const engagementData = totalViews > 0 ? [
    { name: 'Views', value: Math.round((totalViews / (totalViews + totalLikes + totalComments)) * 100), color: '#ffffff' },
    { name: 'Likes', value: Math.round((totalLikes / (totalViews + totalLikes + totalComments)) * 100), color: '#94a3b8' },
    { name: 'Comments', value: Math.round((totalComments / (totalViews + totalLikes + totalComments)) * 100), color: '#475569' },
  ] : [
    { name: 'Views', value: 55, color: '#ffffff' },
    { name: 'Likes', value: 30, color: '#94a3b8' },
    { name: 'Comments', value: 15, color: '#475569' },
  ];

  // Chart data: real scan history with origin point, or placeholder
  const chartData = React.useMemo(() => {
    if (scanHistory.length === 0) return CHART_PLACEHOLDER;

    const now = Date.now();
    let cutoff = 0;
    if (timeframe === '6h') cutoff = now - 6 * 3600000;
    if (timeframe === '12h') cutoff = now - 12 * 3600000;
    if (timeframe === '24h') cutoff = now - 24 * 3600000;
    if (timeframe === '7d') cutoff = now - 7 * 24 * 3600000;

    const filteredHistory = scanHistory.filter((s) => new Date(s.time).getTime() >= cutoff);
    const dataToUse = filteredHistory.length > 0 ? filteredHistory : [scanHistory[scanHistory.length - 1]];

    const points = dataToUse.map((s) => ({
      time: new Date(s.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      fullDateTime: new Date(s.time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      views: s.totalViews,
      shares: s.totalShares || 0,
    }));

    // Add origin "0 views" point before first scan if applicable
    const firstScanTime = new Date(dataToUse[0].time).getTime();
    const originTime = new Date(firstScanTime - 60000);
    
    if (timeframe === 'ALL' || originTime.getTime() >= cutoff) {
      return [{
        time: originTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        fullDateTime: originTime.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        views: 0,
        shares: 0,
      }, ...points];
    }
    
    return points;
  }, [scanHistory, timeframe]);

  // --- Start Auto-Scan (delegates to SERVER ScanManager) ---
  const startAutoScan = async (minutes: number) => {
    if (!account || !account.link) {
      setScanError('Account link is missing.');
      return;
    }
    setShowIntervalPicker(false);
    setIsScanning(true);
    setScanError(null);

    try {
      const data = await safeFetchJson(API_ROUTES.START, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          accountLink: account.link,
          intervalMinutes: minutes
        })
      });

      if (!data) throw new Error('Failed to start server-side scan');

      setAutoScanActive(true);
      setIntervalMinutes(minutes);
    } catch (err: any) {
      setScanError(err.message || 'Failed to start scan');
    } finally {
      setIsScanning(false);
    }
  };

  // --- Stop Auto-Scan (stops on SERVER) ---
  const handleStopAutoScan = async () => {
    if (!account) return;
    setAutoScanActive(false);
    setNextScanIn(0);

    try {
      await safeFetchJson(API_ROUTES.STOP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id })
      });
    } catch (err) {
      console.error('Failed to stop scan via API:', err);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('analytics-export-wrapper');
    if (!element) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#020617' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Clypso_Report_${account?.name || 'Analytics'}.pdf`);
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Format countdown
  const formatCountdown = (seconds: number) => {
    if (seconds === undefined || seconds === null) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 24) {
      const days = Math.floor(h / 24);
      const remH = h % 24;
      return `${days}d ${remH}h`;
    }
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Navigation helpers for post detail ---
  const currentList = allPosts;
  const currentPostIdx = selectedPost ? currentList.findIndex(p => p.id === selectedPost.id) : -1;

  // Atomic History for individual video modal
  // Shows the FULL story: from publish date (0 views) → all scan data points
  const postSpecificHistory = selectedPost ? (videoHistoryMap[selectedPost.id] || []) : [];
  const postChartData = React.useMemo(() => {
    if (!selectedPost) return [];

    const scanPoints = postSpecificHistory.map((s) => ({
      timestamp: new Date(s.time).getTime(),
      time: s.time,
      views: s.views,
    }));

    // Add origin point at publish date with 0 views (if we have a publish date)
    const points: Array<{ timestamp: number; time: string; views: number }> = [];
    if (selectedPost.date) {
      const publishTime = new Date(selectedPost.date).getTime();
      // Only add origin if it's before the first scan
      if (scanPoints.length === 0 || publishTime < scanPoints[0].timestamp) {
        points.push({
          timestamp: publishTime,
          time: selectedPost.date,
          views: 0,
        });
      }
    }

    points.push(...scanPoints);

    // If still empty, show current views as a single point
    if (points.length === 0) {
      return [{ label: 'Now', views: typeof selectedPost.views === 'number' ? selectedPost.views : (parseInt(String(selectedPost.views)) || 0) }];
    }

    // Smart time labels: use dates if span > 24h, otherwise use times
    const timeSpan = points.length > 1 ? points[points.length - 1].timestamp - points[0].timestamp : 0;
    const useDate = timeSpan > 24 * 60 * 60 * 1000; // more than 24 hours

    return points.map(p => ({
      label: useDate
        ? new Date(p.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : new Date(p.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      fullDateTime: new Date(p.time).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      views: p.views,
    }));
  }, [selectedPost, postSpecificHistory]);

  // --- Loading / Not Found Guard ---
  if (accountLoading) {
    return (
      <div className="h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin opacity-30" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Loading Node...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <AlertCircle className="w-10 h-10 opacity-20" />
          <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Node not found</p>
          <button onClick={() => router.push('/accounts')} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Return to Network</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] xl:h-screen bg-slate-950 text-white flex flex-col xl:overflow-hidden selection:bg-white selection:text-black">
      {/* HUD Backdrop */}
      <div className="fixed inset-0 pointer-events-none opacity-20 hidden md:block">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-[1800px] mx-auto w-full px-4 md:px-6 py-6 lg:px-12 min-h-0 overflow-y-auto xl:overflow-hidden custom-scrollbar">

        {/* Compact Header */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-6 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 md:p-10 backdrop-blur-xl flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 min-w-0">
            <button onClick={() => router.push('/accounts')} className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all group shrink-0">
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1.5 transition-transform" />
            </button>
            <div className="flex items-center gap-4 md:gap-6 min-w-0 w-full sm:w-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 rounded-2xl flex items-center justify-center ring-1 ring-white/10 overflow-hidden shrink-0">
                {account.avatarUrl ? <img src={account.avatarUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <User className="w-6 h-6 md:w-8 md:h-8 text-slate-700" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 md:gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase leading-none truncate">{account.name}</h1>
                  <div className="px-2.5 py-0.5 bg-white/10 border border-white/20 rounded-full text-[7px] font-black uppercase tracking-widest shrink-0 hidden sm:block">{account.platform} NODE</div>
                </div>
                <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">{account.followers} Reach</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 relative flex-wrap lg:flex-nowrap w-full xl:w-auto">
            {/* Auto-Scan Controls */}
            {autoScanActive && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Next: {formatCountdown(nextScanIn)}</span>
                <span className="text-[7px] font-black uppercase text-white/20">({intervalMinutes}m)</span>
              </div>
            )}
            {autoScanActive ? (
              <button
                onClick={handleStopAutoScan}
                className="flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase rounded-xl hover:bg-red-500/20 transition-all text-[10px] tracking-widest"
              >
                <X className="w-3.5 h-3.5" /> Stop Scan
              </button>
            ) : (
              <button
                onClick={() => setShowIntervalPicker(!showIntervalPicker)}
                disabled={isScanning}
                className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase rounded-xl hover:bg-white/10 transition-all text-[10px] tracking-widest disabled:opacity-50 group"
              >
                {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />}
                {isScanning ? 'Scanning...' : hasScanned ? 'Re-Scan' : 'Initialize Scan'}
              </button>

            )}
            {scanCount > 0 && (
              <span className="text-[7px] font-black uppercase tracking-widest text-slate-700 italic">Scan #{scanCount}</span>
            )}
            <button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="flex items-center gap-4 px-8 py-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black uppercase rounded-xl hover:bg-blue-500/20 transition-all text-[10px] tracking-widest disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button onClick={() => window.open(account.link, '_blank')} className="flex items-center gap-4 px-8 py-4 bg-white text-black font-black uppercase rounded-xl hover:bg-slate-200 transition-all text-[10px] tracking-widest">
              Open source <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Scan Error Banner */}
        <AnimatePresence>
          {scanError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{scanError}</p>
              <button onClick={() => setScanError(null)} className="ml-auto"><X className="w-3 h-3 text-red-400" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid: Locked Height */}
        <div id="analytics-export-wrapper" className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0 mb-8 pt-4">

          {/* Primary Analytics (Scrollable Left) */}
          <div className="xl:col-span-3 flex flex-col gap-6 xl:min-h-0 xl:overflow-y-auto custom-scrollbar xl:pr-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-shrink-0">
              <div onClick={() => setActiveSubHUD('performance')} className="lg:col-span-2 glass-card p-6 md:p-8 h-[380px] cursor-pointer group border-white/10 hover:border-white/20 transition-all relative overflow-hidden flex flex-col">
                <div className="flex items-start md:items-center justify-between mb-8 flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="w-5 h-5 flex-shrink-0" />
                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] italic">Forensic Performance Analysis</h2>
                  </div>
                  <div className="flex items-center gap-3 w-full justify-between sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar flex-shrink-0">
                    <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-full p-1 mr-4">
                      {['6h', '12h', '24h', '7d', 'ALL'].map((tf) => (
                        <button
                          key={tf}
                          onClick={(e) => { e.stopPropagation(); setTimeframe(tf); }}
                          className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${timeframe === tf ? 'bg-white text-black' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto mb-4 px-2">
                   {hasScanned && <span className="text-[8px] font-black text-white/30 uppercase tracking-widest hidden md:inline">{scanHistory.length} Scans | {allPosts.length} Assets</span>}
                   <div className={`px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest italic ${isScraping ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]' : autoScanActive ? 'animate-pulse' : 'opacity-50'}`}>
                      {isScraping ? 'Engine Scraping...' : autoScanActive ? 'Auto-Scanning' : hasScanned ? 'Scan Data' : 'Awaiting Scan'}
                   </div>
                </div>

                <div className="flex-1 w-full overflow-x-auto hide-scrollbar touch-pan-x pointer-events-auto mt-4">
                  <div className="min-w-[600px] h-[220px] pointer-events-none px-4 pb-2">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="vG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffffff" stopOpacity={0.12} /><stop offset="95%" stopColor="#ffffff" stopOpacity={0} /></linearGradient>
                        <linearGradient id="sG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis dataKey="time" stroke="#334155" fontSize={8} tickLine={false} axisLine={false} tick={{ fontWeight: 'black' }} />
                      <YAxis yAxisId="left" stroke="#334155" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`} tick={{ fontWeight: 'black' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => val.toLocaleString()} tick={{ fontWeight: 'black' }} />
                      <Area yAxisId="left" type="monotone" dataKey="views" stroke="#ffffff" strokeWidth={2.5} fill="url(#vG)" />
                      <Area yAxisId="right" type="monotone" dataKey="shares" stroke="#f59e0b" strokeWidth={2} fill="url(#sG)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row lg:flex-col gap-6">
                <div onClick={() => setActiveSubHUD('engagement')} className="flex-1 glass-card p-6 md:p-8 h-[240px] cursor-pointer group border-white/10 hover:border-white/20 transition-all flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <PieChartIcon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <h2 className="text-[10px] font-black tracking-[0.2em] uppercase italic">Efficiency</h2>
                  </div>
                  <div className="flex-1 relative flex items-center justify-center pointer-events-none">
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart><Pie data={engagementData} innerRadius={40} outerRadius={55} paddingAngle={10} dataKey="value" stroke="none">{engagementData.map((e, i) => (<Cell key={i} fill={e.color} />))}</Pie></PieChart>
                    </ResponsiveContainer>
                    <span className="absolute text-xl font-black italic tracking-tighter">{hasScanned ? `${engagementData[0]?.value || 0}%` : '72%'}</span>
                  </div>
                </div>
                {/* Quick Stats Card */}
                <div className="glass-card flex-1 p-6 border-white/15 min-h-[114px] flex flex-col justify-center">
                  {hasScanned ? (
                    <>
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-3 italic">Scan Summary</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div><p className="text-lg font-black italic tracking-tighter leading-none">{formatNumber(totalViews)}</p><p className="text-[7px] font-black opacity-20 uppercase mt-0.5">Views</p></div>
                        <div><p className="text-lg font-black italic tracking-tighter leading-none">{formatNumber(totalLikes)}</p><p className="text-[7px] font-black opacity-20 uppercase mt-0.5">Likes</p></div>
                        <div><p className="text-lg font-black italic tracking-tighter leading-none">{formatNumber(totalComments)}</p><p className="text-[7px] font-black opacity-20 uppercase mt-0.5">Comments</p></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 mb-2 italic">Awaiting Scan</span>
                      <p className="text-[11px] font-black uppercase italic tracking-tighter leading-tight opacity-40">Click "Initialize Scan" to load real data</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
              <div className="glass-card p-8 flex flex-col border-white/10 overflow-hidden">
                <div className="flex items-center justify-between mb-8 flex-shrink-0">
                  <div className="flex items-center gap-4"><DollarSign className="w-5 h-5" /><h2 className="text-[10px] font-black tracking-[0.2em] uppercase italic">Payout Ledger</h2></div>
                  <span className="text-[7px] font-black text-slate-700 uppercase italic">{payouts.length} Records</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-3">
                  {payouts.length > 0 ? payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/20 transition-all">
                      <div className="flex items-center gap-5 min-w-0">
                        {payout.thumbnail ? (
                          <img src={payout.thumbnail} alt="" referrerPolicy="no-referrer" className="w-10 h-7 rounded-lg object-cover flex-shrink-0 border border-white/5" />
                        ) : (
                          <Calendar className="w-5 h-5 text-slate-700 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase italic leading-none truncate">{payout.videoTitle}</p>
                          <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest mt-1 italic">{timeAgo(payout.paidAt)} · {payout.platform}</p>
                        </div>
                      </div>
                      <p className="text-xl font-black italic tracking-tighter text-white flex-shrink-0 ml-3">${payout.amount.toFixed(0)}</p>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30 py-12">
                      <DollarSign className="w-8 h-8" />
                      <p className="text-[8px] font-black uppercase tracking-widest text-center italic">No payouts yet<br />Mark videos as paid in Payments</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Protocol Feed - Now shows real data if scanned */}
              <div className="glass-card p-8 flex flex-col border-white/10 overflow-hidden">
                <div className="flex items-center gap-4 mb-8 flex-shrink-0"><ChevronRight className="w-5 h-5" /><h2 className="text-[10px] font-black tracking-[0.2em] uppercase italic">Protocol Feed {hasScanned && `(${allPosts.length})`}</h2></div>
                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-3">
                  {(hasScanned ? allPosts.slice(0, 8) : [
                    { id: '1', title: 'Awaiting network scan...', views: '—', date: '', link: '#', thumbnail: '' },
                  ]).map((post) => (
                    <div key={post.id} onClick={() => hasScanned ? setSelectedPost(post as PostData) : null} className={`flex items-center justify-between p-4 bg-white/[0.03] border border-white/10 rounded-2xl transition-all group ${hasScanned ? 'hover:bg-white/[0.08] cursor-pointer' : 'opacity-40'}`}>
                      <div className="flex items-center gap-4 min-w-0">
                        {(post as PostData).thumbnail ? (
                          <img src={(post as PostData).thumbnail} alt="" referrerPolicy="no-referrer" className="w-12 h-8 rounded-lg object-cover flex-shrink-0 border border-white/5" />
                        ) : (
                          <div className="w-12 h-8 bg-black border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Film className="w-3 h-3 text-slate-700" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-[10px] font-black uppercase italic tracking-tighter truncate leading-tight mb-0.5">{post.title}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest italic">{post.date ? timeAgo(post.date) : ''}</p>
                            {(post as PostData).type && <span className="text-[6px] font-black uppercase px-1.5 py-0.5 bg-white/5 rounded-full border border-white/10">{(post as PostData).type}</span>}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-black italic tracking-tighter ml-2 flex-shrink-0">{typeof post.views === 'number' ? formatNumber(post.views) : post.views}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ===== REGISTRY SIDEBAR: Shorts / Videos Tabs ===== */}
          <div className="xl:col-span-1 h-full flex flex-col min-h-0">
            <div className="glass-card p-6 h-full flex flex-col border-white/10 overflow-hidden relative">
              {/* Registry Header */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-white" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] italic leading-none">Registry</h2>
                </div>
                <span className="text-[8px] font-black text-slate-700 uppercase italic opacity-40">{allPosts.length} Total</span>
              </div>

              {/* Tab Switcher: Videos / Shorts */}
              <div className="flex gap-2 mb-6 flex-shrink-0">
                <button
                  onClick={() => setRegistryTab('videos')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${registryTab === 'videos'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-600 hover:text-white hover:border-white/10'
                    }`}
                >
                  <Film className="w-3 h-3" />
                  Videos ({videos.length})
                </button>
                <button
                  onClick={() => setRegistryTab('shorts')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${registryTab === 'shorts'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-600 hover:text-white hover:border-white/10'
                    }`}
                >
                  <Play className="w-3 h-3" />
                  Shorts ({shorts.length})
                </button>
              </div>

              {/* Asset Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 -mr-2">
                {!hasScanned ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                    <Scan className="w-8 h-8" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-center">Scan to populate<br />registry</p>
                  </div>
                ) : visibleAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                    <Film className="w-8 h-8" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-center">No {registryTab} found<br />in this scan</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 min-w-0">
                      {visibleAssets.map((post, i) => (
                        <motion.div
                          key={`${post.id}-${i}`}
                          whileHover={{ scale: 1.03 }}
                          onClick={() => setSelectedPost(post)}
                          className="bg-white/[0.03] border border-white/5 rounded-xl p-2 cursor-pointer group hover:border-white/20 transition-all flex flex-col gap-2 relative overflow-hidden"
                        >
                          {/* Real Thumbnail - Dynamic Aspect Ratio for Shorts vs Longform */}
                          <div className={`w-full bg-slate-900 border border-white/5 rounded-lg flex items-center justify-center relative overflow-hidden flex-shrink-0 ${
                            post.type === 'short' ? 'aspect-[4/5]' : 'aspect-video'
                          }`}>
                            {post.thumbnail ? (
                              <img src={post.thumbnail} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <Film className="w-4 h-4 text-slate-800" />
                            )}
                            {/* Type Badge */}
                            <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-wider ${post.type === 'short' ? 'bg-white/20 text-white' : 'bg-black/40 text-white/60'
                              }`}>
                              {post.type === 'short' ? '⚡ Short' : '▶ Video'}
                            </div>
                            {/* View Count Overlay */}
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[7px] font-black text-white/80">
                              {formatNumber(post.views)}
                            </div>
                          </div>
                          <div className="min-w-0 px-0.5">
                            <p className="text-[8px] font-black text-white uppercase italic tracking-tighter truncate leading-tight group-hover:text-white transition-colors">{post.title}</p>
                            <div className="flex items-center justify-between mt-1 text-[6px] font-black uppercase text-slate-700 tracking-wider">
                              <span className="truncate pr-1">{timeAgo(post.date)}</span>
                              <span className="text-white/30 italic">{formatNumber(post.likes)} ♥</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Load More Button */}
                    {visibleCount < activeList.length && (
                      <button
                        onClick={() => registryTab === 'videos' ? setVideosVisible(prev => Math.min(prev + 10, videos.length)) : setShortsVisible(prev => Math.min(prev + 10, shorts.length))}
                        className="w-full mt-6 py-4 bg-white/[0.03] hover:bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 group transition-all"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-600 group-hover:text-white group-hover:rotate-180 transition-all duration-700" />
                        <span className="text-[8px] font-black text-slate-600 group-hover:text-white uppercase tracking-[0.4em] italic">Load More</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Registry Footer */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${hasScanned ? 'bg-white animate-pulse shadow-[0_0_8px_white]' : 'bg-slate-700'}`} />
                  <p className="text-[7px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none">{hasScanned ? `${registryTab}: ${visibleAssets.length}/${activeList.length}` : 'Standby'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Footer */}
        <footer className="mt-auto border-t border-white/5 pt-6 flex items-center justify-between opacity-30 hover:opacity-100 transition-opacity pb-8 flex-shrink-0 bg-slate-950 relative z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5"><div className={`w-1.5 h-1.5 rounded-full ${isScraping ? 'bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-pulse' : autoScanActive ? 'bg-white shadow-[0_0_10px_white] animate-pulse' : 'bg-slate-700'}`} /><p className="text-[8px] font-black uppercase tracking-[0.5em] italic">{isScraping ? 'Extracting New Post Data...' : autoScanActive ? 'Auto-Scan Active' : hasScanned ? 'Scan Complete' : 'Standby'}</p></div>
            <div className="w-px h-4 bg-white/10" />
            {lastScanTime && <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-800 italic">Last Scan: {timeAgo(lastScanTime)}</p>}
            {!lastScanTime && <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-800 italic">NODE_{account.id}_IDLE</p>}
          </div>
          <div className="flex items-center gap-10 text-right">
            <div><p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-50 italic">Videos</p><p className="text-lg font-black italic tracking-tighter">{videos.length}</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-50 italic">Shorts</p><p className="text-lg font-black italic tracking-tighter">{shorts.length}</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-50 italic">Total Views</p><p className="text-lg font-black italic tracking-tighter">{formatNumber(totalViews)}</p></div>
            {scanCount > 0 && <div><p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-50 italic">Scans</p><p className="text-lg font-black italic tracking-tighter">{scanCount}</p></div>}
          </div>
        </footer>
      </div>

      {/* Interval Picker Overlay */}
      <AnimatePresence>
        {showIntervalPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIntervalPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-xs bg-slate-950 border border-white/10 rounded-[2rem] p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-1">Scan Interval</h3>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 mb-6">Set time between each auto-scan cycle</p>

              {/* Preset Buttons */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {[1, 3, 5, 10, 15, 30].map(min => (
                  <button
                    key={min}
                    onClick={() => startAutoScan(min)}
                    className="py-3.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 rounded-xl text-[11px] font-black uppercase tracking-wider text-white transition-all hover:scale-105 active:scale-95"
                  >
                    {min}<span className="text-white/40 ml-0.5">m</span>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[7px] font-black uppercase tracking-widest text-white/20">or custom</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Custom Input */}
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Minutes..."
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(customMinutes);
                      if (val && val > 0) startAutoScan(val);
                    }
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm font-black text-white placeholder:text-slate-700 outline-none focus:border-white/30 transition-all"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const val = parseInt(customMinutes);
                    if (val && val > 0) startAutoScan(val);
                  }}
                  disabled={!customMinutes || parseInt(customMinutes) <= 0}
                  className="px-6 py-3.5 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all disabled:opacity-20"
                >
                  Start
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forensic Overlays */}
      <AnimatePresence>
        {activeSubHUD && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-12 bg-slate-950/90 backdrop-blur-3xl" onClick={() => setActiveSubHUD(null)}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-[1400px] h-[85vh] bg-slate-950 border border-white/10 rounded-[3rem] p-8 md:p-14 relative flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-10 flex-shrink-0">
                <div>
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-1">{activeSubHUD.toUpperCase()} PRECISION ANALYSIS</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Audit node {account.id} velocity via time-dilation scrubber</p>
                </div>
                <button onClick={() => setActiveSubHUD(null)} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 min-h-0 bg-black/60 border border-white/5 rounded-[1.5rem] p-6 relative overflow-hidden group">
                {activeSubHUD === 'performance' ? (
                  <div className="w-full h-full">
                    <ResponsiveContainer width="99%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 20, right: 80, left: 20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="audG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        {/* HIGH-DENSITY GRID */}
                        <CartesianGrid strokeDasharray="1 1" stroke="#ffffff05" vertical={true} />
                        <XAxis
                          dataKey="time"
                          axisLine={{ stroke: '#ffffff10' }}
                          tickLine={false}
                          tick={{ fill: '#ffffff30', fontSize: 9, fontWeight: 900 }}
                          dy={10}
                        />
                        <YAxis
                          orientation="right"
                          domain={['auto', 'auto']}
                          axisLine={{ stroke: '#ffffff10' }}
                          tickLine={false}
                          tick={{ fill: '#ffffff60', fontSize: 10, fontWeight: 900 }}
                          tickFormatter={(v) => v.toLocaleString()}
                        />

                        {/* TRADING TERMINAL TOOLTIP / CROSSHAIRS */}
                        <Tooltip
                          cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '3 3' }}
                          content={({ active, payload, label }: any) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white text-black p-3 rounded-lg shadow-2xl font-black italic scale-110">
                                  <p className="text-[8px] uppercase tracking-widest mb-1 opacity-50 underline">{label}</p>
                                  <p className="text-xl leading-none">IDX: {payload[0].value?.toLocaleString()}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#ffffff"
                          strokeWidth={2}
                          fill="url(#audG)"
                          animationDuration={600}
                          activeDot={{ r: 4, fill: '#fff', stroke: '#000', strokeWidth: 2 }}
                        />

                        {/* THE ZOOM BRUSH */}
                        <Brush
                          dataKey="time"
                          height={40}
                          stroke="#ffffff10"
                          fill="transparent"
                          travellerWidth={15}
                          gap={5}
                        />

                        {/* INDICATORS */}
                        {payouts.map((p, idx) => {
                          const pLabel = new Date(p.paidAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <ReferenceLine
                              key={idx}
                              x={pLabel}
                              stroke="#10b981"
                              strokeDasharray="4 4"
                              label={{ value: 'PAYOUT_EVENT', position: 'insideTopLeft', fill: '#10b981', fontSize: 7, fontWeight: 900 }}
                            />
                          );
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-2xl mx-auto py-10">
                    {engagementData.map((item, i) => (
                      <div key={i} className="p-10 bg-white/[0.03] border border-white/5 rounded-[2.5rem]">
                        <p className="text-[11px] font-black uppercase tracking-widest mb-6 italic opacity-50">{item.name}</p>
                        <p className="text-6xl font-black italic leading-none">{item.value}%</p>
                        <div className="w-full h-2 bg-white/5 mt-8 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} className="h-full bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-6 justify-center flex-shrink-0">
                <div className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1 leading-none">Status</p><p className="text-xl font-black italic">Live Audit Active</p></div>
                <div className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1 leading-none">Resolution</p><p className="text-xl font-black italic">Minute-to-Minute</p></div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-xl" onClick={() => setSelectedPost(null)}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-5xl bg-slate-950 border border-white/10 rounded-[3rem] p-10 md:p-14 relative flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl">
                  <button onClick={() => { if (currentPostIdx > 0) setSelectedPost(currentList[currentPostIdx - 1]); }} className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-20" disabled={currentPostIdx <= 0}><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => { if (currentPostIdx < currentList.length - 1) setSelectedPost(currentList[currentPostIdx + 1]); }} className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-20" disabled={currentPostIdx >= currentList.length - 1}><ChevronRight className="w-4 h-4" /></button>
                </div>
                <button onClick={() => setSelectedPost(null)} className="p-3 bg-white/5 rounded-2xl"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-shrink-0 mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[7px] font-black uppercase px-2 py-1 rounded-full border ${selectedPost.type === 'short' ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>{selectedPost.type === 'short' ? '⚡ SHORT' : '▶ VIDEO'}</span>
                  <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter truncate pr-32">{selectedPost.title}</h3>
                </div>
                <div className="flex gap-4 items-center text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <span>{selectedPost.date ? timeAgo(selectedPost.date) : ''}</span>
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                  <span>ID: {selectedPost.id}</span>
                </div>
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar pr-4">
                {/* Thumbnail + Chart */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {selectedPost.thumbnail && (
                    <div className="w-full aspect-[4/5] bg-black rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
                      <img src={`https://wsrv.nl/?url=${encodeURIComponent(selectedPost.thumbnail)}&w=600&output=webp`} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="bg-black/40 border border-white/10 rounded-[2.5rem] p-8 min-h-[250px] flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[9px] font-black tracking-widest uppercase opacity-40">Reach Velocity</p>
                      <p className="text-[7px] font-black uppercase tracking-widest opacity-20">{postChartData.length} data points</p>
                    </div>
                    <div className="flex-1 w-full relative">
                      <ResponsiveContainer width="99%" height="100%">
                        <AreaChart data={[{ label: 'Start', views: 0 }, ...postChartData]}>
                          <defs>
                            <linearGradient id="pRe" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                          <XAxis dataKey="label" stroke="#334155" fontSize={8} tick={{ fontWeight: 'black' }} />
                          <YAxis stroke="#334155" fontSize={8} domain={[0, 'auto']} tickFormatter={(val) => Math.round(val).toLocaleString()} tick={{ fontWeight: 'black' }} />
                          <Tooltip
                            cursor={{ fill: '#ffffff05' }}
                            contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                            itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                            formatter={(val: any) => val.toLocaleString()}
                          />
                          <Area type="monotone" dataKey="views" fill="url(#pRe)" stroke="#ffffff" strokeWidth={2} animationDuration={300} dot={{ r: 2, fill: '#fff' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                {/* Stats Panel */}
                <div className="space-y-6">
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                    <p className="text-[9px] font-black opacity-40 uppercase mb-2 italic">Accumulated Reach</p>
                    <p className="text-4xl font-black italic tracking-tighter leading-none">{formatNumber(selectedPost.views)}</p>
                  </div>
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6">
                    <div>
                      <p className="text-[9px] font-black opacity-30 uppercase italic mb-4">Interactions</p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><p className="text-sm font-black italic">{formatNumber(selectedPost.likes)}</p><p className="text-[8px] font-black opacity-20 uppercase">Likes</p></div>
                        <div><p className="text-sm font-black italic">{formatNumber(selectedPost.comments)}</p><p className="text-[8px] font-black opacity-20 uppercase">Comments</p></div>
                      </div>
                      {(() => {
                        const v = typeof selectedPost.views === 'number' ? selectedPost.views : parseInt(String(selectedPost.views)) || 0;
                        const l = typeof selectedPost.likes === 'number' ? selectedPost.likes : parseInt(String(selectedPost.likes)) || 0;
                        const c = typeof selectedPost.comments === 'number' ? selectedPost.comments : parseInt(String(selectedPost.comments)) || 0;
                        if (v > 0) {
                          const er = ((l + c) / v * 100).toFixed(1);
                          return (
                            <div className="pt-3 border-t border-white/5">
                              <p className="text-lg font-black italic text-emerald-400 tracking-tighter">{er}% <span className="text-[8px] font-black text-emerald-400/50 uppercase tracking-widest ml-1 relative group">Engagement<span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">((Likes + Comments) / Views) * 100</span></span></p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="h-px bg-white/5" />
                    <div>
                      <p className="text-[9px] font-black opacity-30 italic mb-2">Published</p>
                      <p className="text-[11px] font-black italic">{selectedPost.date ? new Date(selectedPost.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}</p>
                    </div>
                  </div>
                  {selectedPost.link && selectedPost.link !== '#' && (
                    <button onClick={() => window.open(selectedPost.link, '_blank')} className="w-full py-4 bg-white text-black font-black uppercase text-[9px] tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                      <ExternalLink className="w-3 h-3" /> Watch on {selectedPost.platform ? selectedPost.platform.charAt(0).toUpperCase() + selectedPost.platform.slice(1) : 'Platform'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}