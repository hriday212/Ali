// API Meter: Tracking Request Counts
// In Phase 2, we use a simple localStorage/Cache approach.
// In Phase 3, this will be moved to a PostgreSQL database.

export type Platform = 'youtube' | 'instagram' | 'tiktok';

interface QuotaData {
  totalRequests: number;
  todayRequests: number;
  lastReset: string;
  breakdown: Record<Platform, number>;
}

const STORAGE_KEY = 'clipper_quota_v1';

const INITIAL_QUOTA: QuotaData = {
  totalRequests: 0,
  todayRequests: 0,
  lastReset: new Date().toISOString(),
  breakdown: {
    youtube: 0,
    instagram: 0,
    tiktok: 0,
  }
};

export class ApiMeter {
  private static getQuota(): QuotaData {
    if (typeof window === 'undefined') return INITIAL_QUOTA;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_QUOTA;
    
    const data = JSON.parse(stored) as QuotaData;
    
    // Reset daily counter if it's a new day
    const lastReset = new Date(data.lastReset);
    const now = new Date();
    if (lastReset.toDateString() !== now.toDateString()) {
      data.todayRequests = 0;
      data.lastReset = now.toISOString();
    }
    
    return data;
  }

  private static saveQuota(data: QuotaData) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static trackRequest(platform: Platform, units: number = 1) {
    const data = this.getQuota();
    data.totalRequests += units;
    data.todayRequests += units;
    data.breakdown[platform] += units;
    this.saveQuota(data);
  }

  static getStats() {
    return this.getQuota();
  }
}
