// Persistent Payouts Store (localStorage-backed)
// Shared between Payments page and Forensic Terminal

export interface PayoutRecord {
  id: string;
  videoId: string;
  videoTitle: string;
  platform: string;
  amount: number;
  viewsAtPayment: number;
  paidAt: string;
  accountId?: string; // Links payout to a specific account
  thumbnail?: string;
}

const STORAGE_KEY = 'command_center_payouts_v1';

export function getPayouts(): PayoutRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function savePayouts(payouts: PayoutRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payouts));
}

export function addPayout(payout: PayoutRecord) {
  const payouts = getPayouts();
  payouts.unshift(payout);
  savePayouts(payouts);
  return payouts;
}

export function getPayoutsForAccount(accountId: string): PayoutRecord[] {
  return getPayouts().filter(p => p.accountId === accountId);
}

export function getTotalPaid(): number {
  return getPayouts().reduce((sum, p) => sum + p.amount, 0);
}

export function getLatestPayoutForVideo(videoId: string): PayoutRecord | null {
  const payouts = getPayouts();
  // Find the most recent payout for this video
  return payouts.find(p => p.videoId === videoId) || null;
}
