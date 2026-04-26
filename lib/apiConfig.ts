export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const API_ROUTES = {
  SCANS: `${BACKEND_URL}/api/scans`,
  STATUS: `${BACKEND_URL}/api/status`,
  START: `${BACKEND_URL}/api/start`,
  STOP: `${BACKEND_URL}/api/stop`,
  HASHTAG_SCAN: `${BACKEND_URL}/api/hashtags/scan`,
  PAYOUTS: `${BACKEND_URL}/api/payouts`,
  GLOBAL_INTERVAL: `${BACKEND_URL}/api/settings/global-interval`,
  SMART_ENGINE: `${BACKEND_URL}/api/settings/smart-engine`,
  FORCE_SYNC: `${BACKEND_URL}/api/settings/force-sync`,
  LATEST_POSTS: `${BACKEND_URL}/api/scans/latest-posts`,
  APIFY_USAGE: `${BACKEND_URL}/api/apify-usage`,
  APIFY_HISTORY: `${BACKEND_URL}/api/usage/history`,
  SYNC_ACCOUNT: (id: string) => `${BACKEND_URL}/api/scans/${id}/sync`,
  TOGGLE_VIDEO_PAYMENT: (acc: string, vid: string) => `${BACKEND_URL}/api/scans/${acc}/videos/${vid}/toggle-payment`,
  // Next.js internal routes
  RESOLVE: '/api/accounts/resolve',
};
