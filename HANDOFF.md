# Clypso Infrastructure & Handoff Guide

This document outlines the steps to deploy and hand off the Clypso Monetization platform, specifically focusing on the Scan Engine persistence and Environment Variable requirements.

## 1. Backend Scan Engine (Railway Deployment)

The `scan-engine` is a Node.js process that requires disk persistence to remember configured nodes and scan history.

### persistence Volume Setup
To prevent data loss during redeployments:
1. In your Railway project, click **New** > **Volume**.
2. Name it `forensic-data` (1GB is sufficient).
3. Mount it to the `scan-engine` service at the path: `/data`.
4. Add the following Environment Variable to your `scan-engine` service:
   - `DATA_PATH=/data`

### Required Environment Variables
Ensure the following are set in Railway for the `scan-engine` to function:

| Variable | Description |
|----------|-------------|
| `PORT` | Set to `4000` (or leave default). |
| `DATA_PATH` | `/data` (points to your persistent volume). |
| `YOUTUBE_API_KEY` | Your primary Google Cloud API key. |
| `YOUTUBE_API_KEY_2` | (Optional) Secondary key for rotation. |
| `APIFY_API_TOKEN` | Your primary Apify token. |
| `APIFY_API_TOKEN_2` | (Optional) Secondary token for rotation. |

## 2. Frontend (Vercel/Railway Deployment)

The Next.js frontend needs to point to your live Scan Engine URL.

### Required Environment Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | The URL of your `scan-engine` service (e.g., `https://clypso-engine.up.railway.app`). |

## 3. Data Migration (Old to New Account)

If you are moving to a new Railway account:
1. **Locally**: Zip your `C:\Users\Hrida\.forensic-scan-data` folder.
2. **On New Service**: Use the Railway CLI or an SFTP tool to upload the contents of that zip into the `/data` volume on your new Railway instance.
3. **Verification**: Restart the `scan-engine`. The "Command Center" should immediately show your existing nodes and previous scan counts.

## 4. Maintenance Notes
- **API Charges**: The "ApiPulse" tracker on the Dashboard shows your current Apify spend. Monitor this to avoid hitting the $5-10 limits.
- **Smart Cadence**: The system uses a "Relative Multiplier" (Smart Cadence). If you set a node to "120m" and it has high engagement, it will auto-accelerate to "60m" to capture spikes. Check the "Safety Guide" on the Settings page for full logic.
