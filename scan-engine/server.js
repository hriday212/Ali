const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { DEFAULT_ACCOUNTS } = require('./defaultAccounts');

const app = express();
const PORT = 4000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

app.use(cors());
app.use(express.json());

// --- Setup Persistence ---
const DATA_DIR = path.join(os.homedir(), '.forensic-scan-data');
const STATE_FILE = path.join(DATA_DIR, 'active-scans.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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
  const formattedId = actorId.replace('/', '~');
  const url = `https://api.apify.com/v2/acts/${formattedId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}&timeout=180`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Apify error (${formattedId}): ${err}`);
  }
  return await response.json();
}

// --- YouTube Helpers ---
async function getChannelIdFromUrl(url) {
    if (!url) return null;
    const channelIdMatch = url.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (channelIdMatch) return channelIdMatch[1];
    const handleMatch = url.match(/@([a-zA-Z0-9._-]+)/);
    if (handleMatch) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handleMatch[1]}&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        if (data.items?.[0]) return data.items[0].id;
    }
    return null;
}

async function getChannelVideos(channelId, maxResults = 10) {
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`);
    const channelData = await channelRes.json();
    if (!channelData.items?.[0]) return [];
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`);
    const playlistData = await playlistRes.json();
    if (!playlistData.items) return [];
    const videoIds = playlistData.items.map(item => item.contentDetails.videoId);
    const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`);
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
  const handleMatch = accountLink.match(/@([a-zA-Z0-9._-]+)/);
  const profile = handleMatch ? handleMatch[1] : accountLink;
  const items = await runApifyActor('clockworks/tiktok-scraper', {
    profiles: [`https://www.tiktok.com/@${profile}`],
    resultsPerPage: 20,
  });
  return (items || []).map(item => ({
    id: item.id || item.webVideoUrl || String(Math.random()),
    title: item.text || '',
    thumbnail: item.covers?.default || item.cover || '',
    views: item.playCount || item.stats?.playCount || 0,
    likes: item.diggCount || item.stats?.diggCount || 0,
    comments: item.commentCount || item.stats?.commentCount || 0,
    shares: item.shareCount || item.stats?.shareCount || 0,
    link: item.webVideoUrl || accountLink,
    date: item.createTime ? new Date(item.createTime * 1000).toISOString() : new Date().toISOString(),
    type: 'video',
    platform: 'tiktok',
  }));
}

async function scanInstagram(accountId, accountLink) {
  const items = await runApifyActor('apify/instagram-scraper', {
    directUrls: [accountLink],
    resultsLimit: 20,
    resultsType: 'posts',
  });
  return (items || []).map(item => ({
    id: item.id || item.shortCode || String(Math.random()),
    title: item.caption || item.alt || '',
    thumbnail: item.displayUrl || item.imageUrl || '',
    views: item.videoViewCount || item.videoPlayCount || 0,
    likes: item.likesCount || item.likes || 0,
    comments: item.commentsCount || item.comments || 0,
    shares: 0,
    link: item.url || `https://instagram.com/p/${item.shortCode}`,
    date: item.timestamp || new Date().toISOString(),
    type: item.type === 'Video' ? 'video' : 'post',
    platform: 'instagram',
  }));
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

async function executeScan(accountId, accountLink, platform) {
  const scan = activeScans.get(accountId);
  if (!scan) return;
  console.log(`[ScanEngine] ${new Date().toLocaleTimeString()} - Scanning ${accountId} (${platform})...`);
  try {
    let posts = [];
    if (platform === 'youtube') posts = await scanYouTube(accountId, accountLink);
    else if (platform === 'tiktok') posts = await scanTikTok(accountId, accountLink);
    else if (platform === 'instagram') posts = await scanInstagram(accountId, accountLink);

    if (!posts || posts.length === 0) {
      console.log(`[ScanEngine] No posts returned for ${accountId}`);
      return;
    }

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
    scan.nextScanAt = new Date(Date.now() + scan.intervalMinutes * 60 * 1000).toISOString();
    saveAllState();
    console.log(`[ScanEngine] ✓ ${accountId}: ${posts.length} posts, ${peakTotalViews.toLocaleString()} total views`);
  } catch (e) {
    console.error(`[ScanEngine] Error scanning ${accountId}:`, e.message);
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

function startScanInternal(scan) {
  activeScans.set(scan.accountId, scan);
  scan.timer = setInterval(() => executeScan(scan.accountId, scan.accountLink, scan.platform || 'youtube'), scan.intervalMinutes * 60 * 1000);
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
app.post('/api/start', async (req, res) => {
  const { accountId, accountLink, intervalMinutes, platform } = req.body;
  const existing = activeScans.get(accountId);
  if (existing) clearInterval(existing.timer);
  const scan = { accountId, accountLink, intervalMinutes, platform: platform || 'youtube', scanCount: 0, lastScanTime: null, nextScanAt: null };
  startScanInternal(scan);
  await executeScan(accountId, accountLink, scan.platform);
  res.json({ success: true });
});

app.post('/api/stop', (req, res) => {
  const { accountId } = req.body;
  const existing = activeScans.get(accountId);
  if (existing) clearInterval(existing.timer);
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
    scans.push({ ...rest, secondsRemaining: v.nextScanAt ? Math.max(0, Math.floor((new Date(v.nextScanAt) - Date.now()) / 1000)) : 0 });
  });
  res.json({ scans });
});

app.listen(PORT, () => {
  console.log(`🚀 Scan Engine running on http://localhost:${PORT}`);
  autoStartDefaults();
});
