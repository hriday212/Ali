// Default LinkMe test accounts — auto-started on scan-engine boot
const DEFAULT_ACCOUNTS = [
  { accountId: 'linkmetalks-yt',    accountLink: 'https://youtube.com/@linkmetalks',    platform: 'youtube',   intervalMinutes: 30 },
  { accountId: 'linkmevision-yt',   accountLink: 'https://youtube.com/@linkmevision',   platform: 'youtube',   intervalMinutes: 30 },
  { accountId: 'linkme-snipes-tt',  accountLink: 'https://www.tiktok.com/@linkme.snipes', platform: 'tiktok', intervalMinutes: 30 },
  { accountId: 'linkmeprime-tt',    accountLink: 'https://www.tiktok.com/@linkmeprime', platform: 'tiktok',   intervalMinutes: 30 },
  { accountId: 'linkmevision-ig',   accountLink: 'https://www.instagram.com/linkmevision', platform: 'instagram', intervalMinutes: 60 },
];

module.exports = { DEFAULT_ACCOUNTS };
