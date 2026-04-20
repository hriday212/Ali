# Clypso Monetization Platform - Project Handover

## 🚀 Project Overview
Clypso is an advanced monetization intelligence platform that aggregates analytics from YouTube, TikTok, and Instagram to track "Clipper" performance and automate payout ledgers.

---

## ✅ Major Completions

### 1. Backend Reliability & Persistence
- **Persistent Storage**: Configured Railway Volumes mounted at `/root/.forensic-scan-data` to prevent data wipe on redeploy.
- **Smart Scraper Engine**: Implemented `while` loop token rotation to automatically handle Apify usage limits.
- **Instagram Integration**: Fully wired `apify/instagram-scraper` into the scan engine.

### 2. Premium Analytics (Phase 5)
- **Forecast Dashboard**: New route at `/forecast` featuring:
  - **DateRange Controller**: Presets (Today, 7D, 14D, 30D) + Custom Calendar selection.
  - **Dynamic KPI Cards**: Views, Likes, Comments, Shares with `% vs Previous Period` indicators.
  - **Hourly Activity Pattern**: Dual-line area chart comparing scan intensity by hour.
  - **Platform Split**: Interactive pie chart with drill-down per-node breakdown.

### 3. Core Bug Fixes
- **Thumbnail Stability**: Added `referrerPolicy="no-referrer"` and `crossOrigin="anonymous"` to all images to unblock TikTok/Instagram CDN restrictions.
- **PDF Export**: Fixed `html2canvas` failure by enabling `allowTaint: true` for cross-origin thumbnails.
- **Data Integrity**: Fixed mapping of `totalViews` in charts to ensure history loads correctly.

---

## 🛠 Operational Guide

### Local Development
1. `cd scan-engine && node server.js` (Starts backend on 3001)
2. `npm run dev` (Starts frontend on 3000)

### Deployment
- **Platform**: Railway
- **Persistence**: Ensure `DATA_PATH` env var points to the mounted volume path.
- **Tokens**: Manage `APIFY_TOKEN_1` through `APIFY_TOKEN_4` in Railway variables.

---

## 📋 Remaining Roadmap
- [ ] **Data Refinement**: Replace remaining mock visualizers (SentimentCloud, HookDecay) as specialized scrapers are added.
- [ ] **Payout Automation**: Wire the "Ledger" tab to the backend payout history objects.
- [ ] **Thumbnail Proxy**: Long-term fix for signed URLs – implement a backend proxy to cache images if they expire too quickly.

---

**Handover Status**: Current build is stable and features Phase 5 completion.
**Push Timestamp**: 2026-04-21 05:12 AM
