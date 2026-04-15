const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const PORT = 4000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

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
  return { posts: [], history: [] };
}

function writeScanData(accountId, data) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${accountId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

// --- Scan Engine State ---
const activeScans = new Map();

async function executeScan(accountId, accountLink) {
    const scan = activeScans.get(accountId);
    if (!scan) return;
    console.log(`[ScanEngine] ${new Date().toLocaleTimeString()} - Scanning ${accountId}...`);
    try {
        const channelId = await getChannelIdFromUrl(accountLink);
        if (!channelId) return;
        const items = await getChannelVideos(channelId, 10);
        const posts = items.map(item => ({
            id: item.id,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.high?.url || '',
            views: parseInt(item.statistics?.viewCount || '0'),
            likes: parseInt(item.statistics?.likeCount || '0'),
            comments: parseInt(item.statistics?.commentCount || '0'),
            link: `https://www.youtube.com/watch?v=${item.id}`,
            date: item.snippet.publishedAt,
            type: parseDuration(item.contentDetails?.duration || '') < 65 ? 'short' : 'video'
        })).sort((a,b) => new Date(b.date) - new Date(a.date));

        const data = readScanData(accountId);
        data.posts = posts;
        
        // ========== HIGH-WATER MARK SYSTEM ==========
        // Peak Views: remembers the HIGHEST view count ever seen for each video.
        // Even if a scan misses a video, its peak is still counted in the total.
        // This guarantees the graph ONLY goes up.
        if (!data.peakViews) data.peakViews = {};   // { videoId: { views, likes, comments, title } }

        // Update peaks: only store if current views >= stored peak
        posts.forEach(p => {
          const existing = data.peakViews[p.id];
          if (!existing || p.views >= existing.views) {
            data.peakViews[p.id] = {
              views: p.views,
              likes: p.likes,
              comments: p.comments,
              title: p.title
            };
          }
        });

        // Calculate totals from ALL peaks (not just current scan)
        const allPeakValues = Object.values(data.peakViews);
        const peakTotalViews = allPeakValues.reduce((s, p) => s + p.views, 0);
        const peakTotalLikes = allPeakValues.reduce((s, p) => s + p.likes, 0);
        const peakTotalComments = allPeakValues.reduce((s, p) => s + p.comments, 0);

        // 1. Update Global Account History (using peak totals — never drops)
        data.history = [...(data.history || []), {
            time: new Date().toISOString(),
            totalViews: peakTotalViews,
            totalLikes: peakTotalLikes,
            totalComments: peakTotalComments
        }].slice(-50);

        // 2. Update Atomic Video History (raw API data, no special logic)
        // Individual video views only go up on YouTube, so just store what the API returns.
        if (!data.videoHistory) data.videoHistory = {};
        posts.forEach(p => {
          if (!data.videoHistory[p.id]) data.videoHistory[p.id] = [];
          data.videoHistory[p.id] = [...data.videoHistory[p.id], {
            time: new Date().toISOString(),
            views: p.views
          }].slice(-50);
        });

        writeScanData(accountId, data);

        scan.scanCount++;
        scan.lastScanTime = new Date().toISOString();
        scan.nextScanAt = new Date(Date.now() + scan.intervalMinutes * 60 * 1000).toISOString();
        saveAllState();
    } catch (e) { console.error(e); }
}

function saveAllState() {
    ensureDataDir();
    const state = {};
    activeScans.forEach((v, k) => {
        const { timer, ...clean } = v; // Remove the circular timer object
        state[k] = clean;
    });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function restoreState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
            for (const [id, scan] of Object.entries(state)) {
                startScanInternal(scan);
            }
        }
    } catch (e) {}
}

function startScanInternal(scan) {
    activeScans.set(scan.accountId, scan);
    scan.timer = setInterval(() => executeScan(scan.accountId, scan.accountLink), scan.intervalMinutes * 60 * 1000);
}

// --- API Routes ---
app.post('/api/start', async (req, res) => {
    const { accountId, accountLink, intervalMinutes } = req.body;
    const existing = activeScans.get(accountId);
    if (existing) clearInterval(existing.timer);

    const scan = { accountId, accountLink, intervalMinutes, scanCount: 0, lastScanTime: null, nextScanAt: null };
    startScanInternal(scan);
    await executeScan(accountId, accountLink);
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
        const { timer, ...rest } = scan; // Remove the circular timer object
        cleanStatus = { 
            ...rest, 
            secondsRemaining: scan.nextScanAt ? Math.max(0, Math.floor((new Date(scan.nextScanAt) - Date.now()) / 1000)) : 0 
        };
    }

    res.json({
        active: !!scan,
        status: cleanStatus,
        data
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Scan Engine running on http://localhost:${PORT}`);
    restoreState();
});
