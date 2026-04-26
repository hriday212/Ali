// Persistent Accounts Store (localStorage-backed)
// Shared between the Network Inventory and Forensic Terminal

export interface Account {
  id: string;
  name: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  followers: string;
  status: string;
  hasNew: boolean;
  link: string;
  avatarUrl?: string;
  channelId?: string; // YouTube channel ID for API calls
  addedAt: string;
  settlements?: {
    date: string;
    viewLevel: number;
    amount: number;
  }[];
}

const STORAGE_KEY = 'command_center_accounts_v1';

export function getAccounts(): Account[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: Account[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function addAccount(account: Account) {
  const accounts = getAccounts();
  accounts.unshift(account);
  saveAccounts(accounts);
  return accounts;
}

export function deleteAccount(id: string) {
  const accounts = getAccounts().filter(a => a.id !== id);
  saveAccounts(accounts);
  return accounts;
}

export function getAccountById(id: string): Account | null {
  return getAccounts().find(a => a.id === id) || null;
}
