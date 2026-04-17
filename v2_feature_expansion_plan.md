# Clypso v2: Feature Expansion Roadmap

## Project Vision
To transform Clypso from a simple scraper dashboard into a **premium monetization protocol** that provides creator-clients with deep insights while giving admins an automated workflow for managing a high-volume media network.

---

## 🚀 Phase 1: High-Impact Client Experience
*Goal: Move beyond the "bare minimum" to make clients feel they are using a high-end SaaS product.*

### 1. Dedicated Client Video Library `/videos`
- **Grid Layout**: A beautiful, glassmorphic grid of all scanned videos across all platforms.
- **Micro-Stats**: Hover over a thumbnail to see Engagement Rate, View Count, and "Growth Velocity".
- **Filtering**: Filter by platform (YT/IG/TT) or performance tier.

### 2. Live Engagement Cards
- **The "Pulse" Metric**: Real-time Engagement Rate calculation [(Likes + Comments) / Views * 100](file:///c:/Users/Hrida/Downloads/Clypso-main/check_tiktok_run.js#35-38).
- **Engagement Health**: A color-coded badge (e.g., "Elite 12%", "Healthy 5%") to provide context.

### 3. Top Performer "Hall of Fame"
- **Automatic Highlighting**: A dedicated section on the dashboard that pins the #1 trending video from the last 7 days.
- **"Viral Potential" Tag**: Using view-over-time data to flag videos that are trending up significantly.

---

## 📊 Phase 2: Advanced Analytics & Insights
*Goal: Provide data that creators can't get from the native apps alone.*

### 1. Cross-Platform Comparison
- **Unified Charts**: Side-by-side performance comparison (e.g., how the same clip performed on YouTube Shorts vs. TikTok).
- **Platform Bias Detection**: Identify which platform's algorithm is favoring the creator's specific style.

### 2. Content Cadence & Consistency
- **Activity Heatmap**: A Github-style contribution graph showing posting frequency.
- **Consistency Score**: A percentage score based on their goal (e.g., "Posting 3x Weekly: 100% On Track").

### 3. Basic Sentiment Analysis
- **Tone Detector**: Use a lightweight client-side library (like `sentiment`) to analyze top comments and give a "Positivity Score".

---

## 🛠️ Phase 3: Admin & Agency Automation
*Goal: Scale the network to 50+ accounts without increasing manual work.*

### 1. Milestone & Viral Alerts
- **System Notifications**: Dashboard alerts when an account hits 10k/100k views or a video gains >1k views in an hour.
- **Priority List**: Automatically bubble up the most active/high-growth accounts to the top of the admin sidebar.

### 2. One-Click White-Label Reports
- **Generate PDF**: A button to export a beautiful, branded performance summary that the admin can send to creators or sponsors.
- **Custom Branding**: Options to toggle "Clypso Branding" on/off for professional agency use.

### 3. Auto-Threshold Payout Summaries (Admin Only)
- **Ready for Payment**: A list of creators who have crossed a specific view/revenue threshold and are "Ready for Payout".

---

## 💰 Resource Efficiency & Cost Management
- **Token Optimization**: Implement "Smart Intervals" — scan active/viral accounts every 30m, but dormant accounts only every 6h to save Apify/YouTube credits.
- **Caching Layer**: Store all scan results in the local `scan-engine` JSON store to ensure the frontend loads instantly without hitting APIs on every page refresh.

---

## 📅 Verification Plan
### Automated Tests
- **Performance Stress Test**: Run the scan-engine with 20 dummy accounts to monitor memory/CPU usage before scaling.
- **Formula Validation**: Unit tests for the Engagement Rate and View Velocity calculations to ensure accuracy.

### Manual Verification
- **Role Toggle Check**: Verify that "/videos" and other new features behave differently (or are hidden) based on the `isClient` flag.
- **Export Test**: Verify the generated PDF layout is centered and premium-looking across different screen sizes.
