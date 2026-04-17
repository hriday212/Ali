export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const API_ROUTES = {
  SCANS: `${BACKEND_URL}/api/scans`,
  STATUS: `${BACKEND_URL}/api/status`,
  START: `${BACKEND_URL}/api/start`,
  STOP: `${BACKEND_URL}/api/stop`,
  HASHTAG_SCAN: `${BACKEND_URL}/api/hashtags/scan`,
  PAYOUTS: `${BACKEND_URL}/api/payouts`,
  LATEST_POSTS: `${BACKEND_URL}/api/scans/latest-posts`,
  // Next.js internal routes
  RESOLVE: '/api/accounts/resolve',
};
