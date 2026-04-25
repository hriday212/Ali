const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { DEFAULT_ACCOUNTS } = require('./defaultAccounts');

const app = express();
const PORT = process.env.PORT || 4000;
const ALL_YOUTUBE_KEYS = Object.keys(process.env).filter(k => k.startsWith('YOUTUBE_API_KEY')).map(k => process.env[k]).filter(Boolean);
const ALL_APIFY_TOKENS = Object.keys(process.env).filter(k => k.startsWith('APIFY_API_TOKEN')).map(k => process.env[k]).filter(Boolean);

let ytKeyIdx = 0;
let apifyKeyIdx = 0;

function getYouTubeKey() {
  if (ALL_YOUTUBE_KEYS.length === 0) return null;
  const key = ALL_YOUTUBE_KEYS[ytKeyIdx];
  ytKeyIdx = (ytKeyIdx + 1) % ALL_YOUTUBE_KEYS.length;
  return key;
}

function getApifyToken() {
  if (ALL_APIFY_TOKENS.length === 0) return null;
  const token = ALL_APIFY_TOKENS[apifyKeyIdx];
  apifyKeyIdx = (apifyKeyIdx + 1) % ALL_APIFY_TOKENS.length;
  return token;
}

app.use(cors());
app.use(express.json());

// --- Setup Persistence ---
const DATA_DIR = process.env.DATA_PATH || path.join(os.homedir(), '.forensic-scan-data');
const STATE_FILE = path.join(DATA_DIR, 'active-scans.json');
const LEDGER_FILE = path.join(DATA_DIR, 'ledger.json');

function readLedger() {
  try {
    if (!fs.existsSync(LEDGER_FILE)) return [];
    return JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf-8'));
  } catch (e) {
    console.error('[Ledger] Read Error:', e);
    return [];
  }
}

function writeLedger(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[Ledger] Write Error:', e);
  }
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error('Could not create data directory:', e.message);
    }
  }
}

function readScanData(accountId) {
  const filePath = path.join(DATA_DIR, `${accountId}.json`);
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {}
  return { posts: [], history: [], platform: 'youtube' };
}

function writeScanData(accountId, data) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${accountId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- Apify Helper ---
async function runApifyActor(actorId, input) {
  let maxAttempts = Math.max(1, ALL_APIFY_TOKENS.length);
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    const formattedId = actorId.replace('/', '~');
    const token = getApifyToken();
    if (!token) throw new Error('No valid Apify tokens available for runApifyActor');
    
    const url = `https://api.apify.com/v2/acts/${formattedId}/run-sync-get-dataset-items?token=${token}&timeout=180`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      const errText = await response.text();
      // SMART FALLBACK: Only evict if it's a genuine Apify billing/usage limit
      if (errText.includes('Monthly usage hard limit exceeded')) {
        const deadToken = new URL(url).searchParams.get('token');
        const idx = ALL_APIFY_TOKENS.indexOf(deadToken);
        if (idx > -1) {
          ALL_APIFY_TOKENS.splice(idx, 1);
          console.log(`[ScanEngine] 🚨 APIFY TOKEN DEAD. Evicted token. Remaining keys: ${ALL_APIFY_TOKENS.length}`);
        }
        attempt++;
        console.log(`[ScanEngine] Smart Fallback: Instantly retrying request with backup token...`);
        continue;
      }
      throw new Error(`Apify error (${formattedId}): ${errText}`);
    }
    return await response.json();
  }
  throw new Error(`Apify error: All available tokens are completely exhausted for this cycle.`);
}

// --- YouTube Helpers ---
async function getChannelIdFromUrl(url) {
    if (!url) return null;
    const channelIdMatch = url.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (channelIdMatch) return channelIdMatch[1];
    const handleMatch = url.match(/@([a-zA-Z0-9._-]+)/);
    if (handleMatch) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handleMatch[1]}&key=${getYouTubeKey()}`);
        const data = await res.json();
        if (data.items?.[0]) return data.items[0].id;
    }
    return null;
}

async function getChannelVideos(channelId, maxResults = 10) {
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${getYouTubeKey()}`);
    const channelData = await channelRes.json();
    if (!channelData.items?.[0]) return [];
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${getYouTubeKey()}`);
    const playlistData = await playlistRes.json();
    if (!playlistData.items) return [];
    const videoIds = playlistData.items.map(item => item.contentDetails.videoId);
    const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${getYouTubeKey()}`);
    const vData = await vRes.json();
    return vData.items || [];
}

function parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return parseInt(match[1] || '0') * 3600 + parseInt(match[2] || '0') * 60 + parseInt(match[3] || '0');
}

// --- Platform Scan Functions ---
async function scanYouTube(accountId, accountLink) {
  const channelId = await getChannelIdFromUrl(accountLink);
  if (!channelId) return null;
  const items = await getChannelVideos(channelId, 10);
  return items.map(item => ({
    id: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.high?.url || '',
    views: parseInt(item.statistics?.viewCount || '0'),
    likes: parseInt(item.statistics?.likeCount || '0'),
    comments: parseInt(item.statistics?.commentCount || '0'),
    shares: 0,
    link: `https://www.youtube.com/watch?v=${item.id}`,
    date: item.snippet.publishedAt,
    type: parseDuration(item.contentDetails?.duration || '') < 65 ? 'short' : 'video',
    platform: 'youtube',
  })).sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function scanTikTok(accountId, accountLink) {
  // Strip query params (?_r=1...) to ensure clean profile lookup
  const cleanLink = accountLink.split('?')[0];
  const handleMatch = cleanLink.match(/@([a-zA-Z0-9._-]+)/);
  const profile = handleMatch ? handleMatch[1] : cleanLink.replace(/https?:\/\/(www\.)?tiktok\.com\/@/, '').replace(/\//g, '');
  const items = await runApifyActor('clockworks/tiktok-scraper', {
    profiles: [`https://www.tiktok.com/@${profile}`],
    resultsPerPage: 20,
  });
  return (items || []).map(item => {
    const rawThumb = item.covers?.default || item.covers?.origin || item.cover || item.videoMeta?.coverUrl || item.video?.cover || '';
    return {
      id: item.id || item.webVideoUrl || String(Math.random()),
      title: item.text || '',
      thumbnail: rawThumb ? `https://wsrv.nl/?url=${encodeURIComponent(rawThumb)}` : '',
      views: item.playCount || item.stats?.playCount || 0,
      likes: item.diggCount || item.stats?.diggCount || 0,
      comments: item.commentCount || item.stats?.commentCount || 0,
      shares: item.shareCount || item.stats?.shareCount || 0,
      link: item.webVideoUrl || accountLink,
      date: item.createTime ? new Date(item.createTime * 1000).toISOString() : new Date().toISOString(),
      type: 'video',
      platform: 'tiktok',
    };
  });
}

async function scanInstagram(accountId, accountLink) {
  const items = await runApifyActor('apify/instagram-scraper', {
    directUrls: [accountLink],
    resultsLimit: 20,
    resultsType: 'posts',
  });
  return (items || []).map(item => {
    const rawThumb = item.displayUrl || item.imageUrl || '';
    return {
      id: item.id || item.shortCode || String(Math.random()),
      title: item.caption || item.alt || '',
      thumbnail: rawThumb ? `https://wsrv.nl/?url=${encodeURIComponent(rawThumb)}` : '',
      // Fallback: If it's a photo post, use likes as a proxy for 'reach/views' for the pie chart
      views: item.videoViewCount || item.videoPlayCount || ( (item.likesCount || item.likes || 0) * 5 ),
      likes: item.likesCount || item.likes || 0,
      comments: item.commentsCount || item.comments || 0,
      shares: 0,
      link: item.url || `https://instagram.com/p/${item.shortCode}`,
      date: item.timestamp || new Date().toISOString(),
      type: item.type === 'Video' ? 'video' : 'post',
      platform: 'instagram',
    };
  });
}

async function scanHashtag(tag, platform = 'instagram') {
  const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
  if (platform === 'instagram') {
    const items = await runApifyActor('apify/instagram-hashtag-scraper', {
      hashtags: [cleanTag],
      resultsLimit: 20
    });
    return (items || []).map(item => ({
      id: item.id || item.shortCode,
      platform: 'instagram',
      views: item.videoViewCount || 0,
      likes: item.likesCount || 0,
      comments: item.commentsCount || 0,
      link: item.url,
      thumbnail: item.displayUrl,
      owner: item.ownerUsername,
      date: item.timestamp
    }));
  } else if (platform === 'tiktok') {
    const items = await runApifyActor('clockworks/tiktok-scraper', {
      hashtags: [cleanTag],
      resultsPerPage: 20
    });
    return (items || []).map(item => ({
      id: item.id,
      platform: 'tiktok',
      views: item.playCount || 0,
      likes: item.diggCount || 0,
      comments: item.commentCount || 0,
      link: item.webVideoUrl,
      thumbnail: item.cover,
      owner: item.authorMeta?.name,
      date: item.createTime ? new Date(item.createTime * 1000).toISOString() : null
    }));
  }
  return [];
}

// --- High-Water Mark system (works for all platforms) ---
function applyHighWaterMark(data, posts) {
  if (!data.peakViews) data.peakViews = {};
  posts.forEach(p => {
    const existing = data.peakViews[p.id];
    if (!existing || p.views >= existing.views) {
      data.peakViews[p.id] = { views: p.views, likes: p.likes, comments: p.comments, shares: p.shares || 0, title: p.title };
    }
  });
  const allPeaks = Object.values(data.peakViews);
  return {
    peakTotalViews: allPeaks.reduce((s, p) => s + p.views, 0),
    peakTotalLikes: allPeaks.reduce((s, p) => s + p.likes, 0),
    peakTotalComments: allPeaks.reduce((s, p) => s + p.comments, 0),
    peakTotalShares: allPeaks.reduce((s, p) => s + (p.shares || 0), 0),
  };
}

// --- Scan Engine State ---
const activeScans = new Map();

async function executeScan(accountId, accountLink, platform, isManual = false) {
  let scan = activeScans.get(accountId);
  if (!scan && isManual) {
    scan = { accountId, accountLink, platform, isScraping: true };
    activeScans.set(accountId, scan);
  } else if (!scan) return;
  
  scan.isScraping = true;
  console.log(`[ScanEngine] ${new Date().toLocaleTimeString()} - Scanning ${accountId} (${platform})...`);
  try {
    let posts = [];
    if (platform === 'youtube') posts = await scanYouTube(accountId, accountLink);
    else if (platform === 'tiktok') posts = await scanTikTok(accountId, accountLink);
    else if (platform === 'instagram') posts = await scanInstagram(accountId, accountLink);

    if (!posts || posts.length === 0) {
      console.log(`[ScanEngine] No posts returned for ${accountId}`);
      scan.lastError = "No posts returned - possible rate limit or empty profile.";
      scan.lastErrorTime = new Date().toISOString();
      return;
    }

    // Success - clear errors
    scan.lastError = null;
    scan.lastErrorTime = null;

    const data = readScanData(accountId);
    data.posts = posts;
    data.platform = platform;

    const { peakTotalViews, peakTotalLikes, peakTotalComments, peakTotalShares } = applyHighWaterMark(data, posts);

    data.history = [...(data.history || []), {
      time: new Date().toISOString(),
      totalViews: peakTotalViews,
      totalLikes: peakTotalLikes,
      totalComments: peakTotalComments,
      totalShares: peakTotalShares,
    }].slice(-50);

    if (!data.videoHistory) data.videoHistory = {};
    posts.forEach(p => {
      if (!data.videoHistory[p.id]) data.videoHistory[p.id] = [];
      data.videoHistory[p.id] = [...data.videoHistory[p.id], {
        time: new Date().toISOString(),
        views: p.views,
      }].slice(-50);
    });

    writeScanData(accountId, data);
    scan.scanCount++;
    scan.lastScanTime = new Date().toISOString();

    // --- Smart Engine: Relative Pulse Algorithm (Phase 7) ---
    // Default fallback interval
    let nextInterval = scan.intervalMinutes || globalDefaultInterval;
    
    if (smartEngineEnabled && data.history && data.history.length > 1) {
      const latest = data.history[data.history.length - 1].totalViews;
      const previous = data.history[data.history.length - 2].totalViews;
      const delta = Math.max(0, latest - previous);
      
      const timeOld = new Date(data.history[data.history.length - 2].time).getTime();
      const timeNew = new Date(data.history[data.history.length - 1].time).getTime();
      const hoursElapsed = Math.max(0.1, (timeNew - timeOld) / (1000 * 60 * 60));
      const currentHourlyGain = delta / hoursElapsed;
      
      const firstRecord = data.history[0];
      const totalHours = Math.max(1, (timeNew - new Date(firstRecord.time).getTime()) / (1000 * 60 * 60));
      const avgHourlyGain = Math.max(1, (latest - firstRecord.totalViews) / totalHours);
      
      const multiplier = currentHourlyGain / avgHourlyGain;
      
      // Instagram Economy Mode defaulting
      const baseInterval = platform === 'instagram' ? 4320 : 4320; // 3 Days resting baseline
      
      if (multiplier > 5 || delta > 50000) {
        nextInterval = 180; // 3 Hours (Ultra Viral)
        console.log(`[SmartEngine] 🚀 Node ${accountId} went ULTRA VIRAL (M=${multiplier.toFixed(1)}x, Delta=${delta})! Escalating to 3h.`);
      } else if (multiplier > 2 || delta > 10000) {
        nextInterval = 720; // 12 Hours (Viral Traction)
        console.log(`[SmartEngine] 🔥 Node ${accountId} is trending (M=${multiplier.toFixed(1)}x, Delta=${delta})! Escalating to 12h.`);
      } else {
        nextInterval = baseInterval; // 3 Days Resting Stage
        console.log(`[SmartEngine] 💤 Node ${accountId} resting (M=${multiplier.toFixed(1)}x). Setting to ${nextInterval / 60}h.`);
      }
    }
    
    scan.currentInterval = nextInterval;
    
    // Only reschedule if this isn't a manual "instant refresh"
    if (!isManual) {
      scheduleNextScan(scan, nextInterval);
    }

    saveAllState();
    console.log(`[ScanEngine] ✓ ${accountId}: ${posts.length} posts, ${peakTotalViews.toLocaleString()} total views`);
  } catch (e) {
    console.error(`[ScanEngine] Error scanning ${accountId}:`, e.message);
    const scan = activeScans.get(accountId);
    if(scan) {
      scan.lastError = e.message;
      scan.lastErrorTime = new Date().toISOString();
      scheduleNextScan(scan, scan.intervalMinutes);
    }
  } finally {
    const freshScan = activeScans.get(accountId);
    if (freshScan) freshScan.isScraping = false;
  }
}

function saveAllState() {
  ensureDataDir();
  const state = {};
  activeScans.forEach((v, k) => {
    const { timer, ...clean } = v;
    state[k] = clean;
  });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function scheduleNextScan(scan, overrideMinutes = null) {
  if (scan.timer) clearTimeout(scan.timer);
  const mins = overrideMinutes || scan.intervalMinutes;
  let msRemaining = mins * 60 * 1000;

  // Preserve the countdown across server restarts
  if (scan.lastScanTime) {
    const msSinceLastScan = Date.now() - new Date(scan.lastScanTime).getTime();
    msRemaining = Math.max(0, (mins * 60 * 1000) - msSinceLastScan);
  }

  scan.nextScanAt = new Date(Date.now() + msRemaining).toISOString();
  scan.timer = setTimeout(async () => {
    await executeScan(scan.accountId, scan.accountLink, scan.platform || 'youtube');
  }, msRemaining);
}

function startScanInternal(scan) {
  activeScans.set(scan.accountId, scan);
  // Initialize currentInterval tracking if missing
  if (!scan.currentInterval) scan.currentInterval = scan.intervalMinutes;
  scheduleNextScan(scan, scan.currentInterval);
}

function restoreState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      for (const [id, scan] of Object.entries(state)) {
        startScanInternal(scan);
      }
      console.log(`[ScanEngine] Restored ${Object.keys(state).length} active scans from disk.`);
      return Object.keys(state).length;
    }
  } catch (e) { console.error('Failed to restore state:', e); }
  return 0;
}

// --- Auto-start default accounts if none are running ---
async function autoStartDefaults() {
  const restored = restoreState();
  if (restored > 0) return; // No need — already running from disk
  console.log('[ScanEngine] No saved state found. Auto-starting default LinkMe accounts...');
  for (const acc of DEFAULT_ACCOUNTS) {
    const scan = { ...acc, scanCount: 0, lastScanTime: null, nextScanAt: null };
    startScanInternal(scan);
    await executeScan(acc.accountId, acc.accountLink, acc.platform);
  }
}

// --- API Routes ---
let globalDefaultInterval = 360; // Back to 6h for Testing Phase
let smartEngineEnabled = true; // Enabled to allow viral acceleration override

app.post('/api/start', async (req, res) => {
  const { accountId, accountLink, intervalMinutes, platform } = req.body;
  const existing = activeScans.get(accountId);
  if (existing && existing.timer) clearTimeout(existing.timer);
  const selectedInterval = intervalMinutes || globalDefaultInterval;
  const normPlatform = (platform || 'youtube').toLowerCase();
  const scan = { accountId, accountLink, intervalMinutes: selectedInterval, platform: normPlatform, scanCount: 0, lastScanTime: null, nextScanAt: null, currentInterval: selectedInterval };
  startScanInternal(scan);
  
  // FIXED: Save state IMMEDIATELY so interval isn't lost if the first scan fails
  saveAllState();
  
  await executeScan(accountId, accountLink, scan.platform);
  res.json({ success: true });
});

app.post('/api/stop', (req, res) => {
  const { accountId } = req.body;
  const existing = activeScans.get(accountId);
  if (existing && existing.timer) clearTimeout(existing.timer);
  activeScans.delete(accountId);
  saveAllState();
  res.json({ success: true });
});

app.get('/api/status', (req, res) => {
  const accountId = req.query.accountId;
  const scan = activeScans.get(accountId);
  const data = readScanData(accountId);
  let cleanStatus = null;
  if (scan) {
    const { timer, ...rest } = scan;
    cleanStatus = {
      ...rest,
      secondsRemaining: scan.nextScanAt ? Math.max(0, Math.floor((new Date(scan.nextScanAt) - Date.now()) / 1000)) : 0
    };
  }
  res.json({ active: !!scan, status: cleanStatus, data });
});

// New: list all active scans
app.get('/api/scans', (req, res) => {
  const scans = [];
  activeScans.forEach((v, k) => {
    const { timer, ...rest } = v;
    const diskData = readScanData(k);
    const lastHistory = diskData.history && diskData.history.length > 0 ? diskData.history[diskData.history.length - 1] : {};
    scans.push({
      ...rest,
      secondsRemaining: v.nextScanAt ? Math.max(0, Math.floor((new Date(v.nextScanAt) - Date.now()) / 1000)) : 0,
      lastViews: lastHistory.totalViews || 0,
      lastLikes: lastHistory.totalLikes || 0,
      lastComments: lastHistory.totalComments || 0,
      lastShares: lastHistory.totalShares || 0,
      history: diskData.history || [],
      posts: (diskData.posts || []).slice(0, 20),
      platform: v.platform || diskData.platform || 'youtube',
    });
  });
  res.json({ scans, globalDefaultInterval, smartEngineEnabled });
});

// Admin Route: SmartEngine Toggle
app.post('/api/settings/smart-engine', (req, res) => {
  const { enabled } = req.body;
  smartEngineEnabled = !!enabled;
  console.log(`[ScanEngine] ⚙️ SmartEngine auto-escalation ${smartEngineEnabled ? 'ENABLED' : 'DISABLED'} by Admin.`);
  res.json({ success: true, smartEngineEnabled });
});

// Admin Route: Global Cadence Control
app.post('/api/settings/global-interval', (req, res) => {
  const { interval } = req.body;
  if (!interval) return res.status(400).json({ error: 'interval required' });
  globalDefaultInterval = parseInt(interval);
  
  activeScans.forEach((scan, accountId) => {
    scan.intervalMinutes = globalDefaultInterval;
    scan.currentInterval = globalDefaultInterval;
    scheduleNextScan(scan, globalDefaultInterval);
  });
  saveAllState();
  console.log(`[ScanEngine] ⚙️ Admin changed Global Cadence to ${globalDefaultInterval}m for all ${activeScans.size} nodes.`);
  res.json({ success: true, newInterval: globalDefaultInterval });
});

app.post('/api/settings/force-sync', async (req, res) => {
  console.log(`[ScanEngine] ⚡ Admin initiated FORCE GLOBAL SYNC. Scraping ${activeScans.size} nodes immediately.`);
  activeScans.forEach((scan, accountId) => {
    // Execute immediate scan without clearing or resetting the main background timer
    executeScan(accountId, scan.accountLink, scan.platform, true); 
  });
  res.json({ success: true });
});

// New: Global content feed
app.get('/api/scans/latest-posts', (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  const allPosts = [];
  
  // Read all data files
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);
    files.forEach(file => {
      if (file.endsWith('.json') && file !== 'state.json') {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
        if (data.posts) {
          data.posts.forEach(p => allPosts.push({
            ...p,
            nodeId: file.replace('.json', '')
          }));
        }
      }
    });
  }
  
  // Sort by date (desc) and limit
  const latest = allPosts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
    
  res.json({ posts: latest });
});

// API Credit Usage Monitor
app.get('/api/apify-usage', async (req, res) => {
  try {
    const results = [];
    // Query Apify's billing API for each token we have (including evicted ones from env)
    const allTokensFromEnv = Object.keys(process.env).filter(k => k.startsWith('APIFY_API_TOKEN')).map(k => process.env[k]).filter(Boolean);
    
    await Promise.all(allTokensFromEnv.map(async (token, i) => {
      try {
        const limitsRes = await fetch(`https://api.apify.com/v2/users/me/limits?token=${token}`);
        if (!limitsRes.ok) {
          results.push({ key: `TOKEN_${i + 1}`, status: 'error', error: 'Failed to fetch' });
          return;
        }
        const limitsRaw = await limitsRes.json();
        const limitsData = limitsRaw.data || limitsRaw; // Apify wraps in { data: { ... } }
        const isAlive = ALL_APIFY_TOKENS.includes(token);
        results.push({
          key: `TOKEN_${i + 1}`,
          status: isAlive ? 'active' : 'exhausted',
          monthlyUsageUsd: limitsData.current?.monthlyUsageUsd || 0,
          maxMonthlyUsageUsd: limitsData.limits?.maxMonthlyUsageUsd || 5,
          usagePct: 0,
        });
        const last = results[results.length - 1];
        last.usagePct = last.maxMonthlyUsageUsd > 0 ? +((last.monthlyUsageUsd / last.maxMonthlyUsageUsd) * 100).toFixed(1) : 0;
      } catch (e) {
        results.push({ key: `TOKEN_${i + 1}`, status: 'error', error: e.message });
      }
    }));
    
    const totalUsed = results.reduce((s, r) => s + (r.monthlyUsageUsd || 0), 0);
    const totalLimit = results.reduce((s, r) => s + (r.maxMonthlyUsageUsd || 0), 0);
    
    res.json({
      tokens: results,
      activeTokenCount: ALL_APIFY_TOKENS.length,
      totalUsedUsd: +totalUsed.toFixed(2),
      totalLimitUsd: +totalLimit.toFixed(2),
      totalPct: totalLimit > 0 ? +((totalUsed / totalLimit) * 100).toFixed(1) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real: Payouts Ledger Persistence
app.get('/api/payouts', (req, res) => {
  res.json({ payouts: readLedger() }); 
});

app.post('/api/payouts', (req, res) => {
  const payout = req.body;
  if (!payout) return res.status(400).json({ error: 'Payout data required' });
  const ledger = readLedger();
  ledger.unshift(payout);
  writeLedger(ledger);
  res.json({ success: true, payouts: ledger });
});

// New: Hashtag Intelligence
app.get('/api/hashtags/scan', async (req, res) => {
  const { tag, platform } = req.query;
  if (!tag) return res.status(400).json({ error: 'Hashtag required' });
  
  try {
    const results = await scanHashtag(tag, platform || 'instagram');
    res.json({ tag, platform: platform || 'instagram', results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Scan Engine running on http://0.0.0.0:${PORT}`);
  autoStartDefaults().catch(console.error);
});
