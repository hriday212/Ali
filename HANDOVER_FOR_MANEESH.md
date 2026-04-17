# 🚀 Clypso Monetization Intelligence: Project Handover
**To: Maneesh**
**From: Antigravity AI**
**Status: Phase 3.2 Production Ready**

---

## 📋 Executive Summary
The Clypso platform has been transformed from a prototype into a high-performance, role-based monetization dashboard. It is now capable of cross-platform reach auditing (YouTube, TikTok, Instagram) with integrated engagement intelligence.

---

## 🛠️ Operational Guide

### 1. Starting the Neural Engine (Backend)
The backend handles the scraping logic and data persistence.
- **Navigate to**: `scan-engine/`
- **Run**: `node server.js`
- **Default Port**: 4000
- **Note**: Ensure the `.env` file contains a valid `APIFY_API_TOKEN` and `YOUTUBE_API_KEY`.

### 2. Starting the Control Center (Frontend)
The frontend is a Next.js 14 application.
- **Navigate to**: Root directory
- **Run**: `npm run dev`
- **Default Port**: 3000
- **Config**: Centralized API routes are located in `lib/apiConfig.ts`.

---

## 🔐 Credentials Matrix

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Agency Admin** | `admin@clypso.io` | `LinkMe@Admin1` | Full Network Audit, Ledger, Settings |
| **Creator Client** | `client@clypso.io` | `LinkMe@Client1` | Personalized Analytics, Content Feeds |

---

## 🧬 Analytics Dictionary
*A short guide on what each visualization signifies:*

1. **Engagement Funnel**: Measures **Conversion**. How many viewers took action (likes/comments). High drop-off = weak connection.
2. **Viral Velocity Radar**: Measures **Health**. Maps views, growth, and shares. Large shapes = high viral potential.
3. **Save-to-Share Matrix**: Measures **Intent**. 
   - High Saves = Useful/Educational content.
   - High Shares = Viral/Entertaining content.
4. **Hook Velocity Chart**: Measures **Retention**. Analyzes the first 10 seconds. Steep drops = failed "hooks".
5. **Post Markers**: Measures **Impact**. Dash lines on the view graph show exactly which video caused a growth spike.

---

## 📡 Intelligence Features
- **Network Content Pulse**: A horizontal video feed on the home dashboard showing the latest hits from across the network.
- **Hashtag Audit**: Located in the "Intelligence" tab. Enter any hashtag (e.g., #LinkMe) to see real-time aggregate reach and top contributors across TikTok and Instagram.
- **Live Leaderboard**: Ranks all connected creator nodes by view velocity and total reach.

---

## 🛰️ Deployment Notes
- **Vercel**: The frontend is ready for Vercel. Ensure `NEXT_PUBLIC_BACKEND_URL` is set to your production Railway URL.
- **Railway**: The backend is ready for Railway. Use the provided `Procfile` and `railway.json`.
- **Data Persistence**: Scan data is stored in `~/.forensic-scan-data/`. On Railway, consider using a Volume if persistence is required across restarts.

---
*End of Handover Protocol.*
