export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const API_ROUTES = {
  SCANS: `${BACKEND_URL}/api/scans`,
  STATUS: `${BACKEND_URL}/api/status`,
  START: `${BACKEND_URL}/api/start`,
  STOP: `${BACKEND_URL}/api/stop`,
  // Next.js internal routes
  RESOLVE: '/api/accounts/resolve',
};
