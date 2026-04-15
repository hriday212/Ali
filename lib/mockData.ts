export interface PayoutEvent {
  date: string;
  amount: number;
  status: 'paid' | 'pending';
}

export interface VideoData {
  id: string;
  title: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  views: number;
  likes: number;
  comments: number;
  earnings: number;
  status: 'paid' | 'unpaid';
  checkpointViews: number;
  lastUpdated: string;
  thumbnail: string;
  link: string;
  payoutHistory?: PayoutEvent[];
}

export interface DailyStats {
  time: string;
  views: number;
  likes: number;
}

export interface PlatformStats {
  name: string;
  value: number;
  color: string;
}

export const MOCK_ACCOUNTS = [
  { id: '1', name: 'ClipperMaster YT', platform: 'youtube', followers: '125k', status: 'connected', hasNew: true, link: 'https://youtube.com/@clippermaster', payouts: [
    { date: '2024-03-10', amount: 450 },
    { date: '2024-03-22', amount: 820 }
  ]},
  { id: '2', name: 'TrendingReels IG', platform: 'instagram', followers: '89k', status: 'connected', hasNew: false, link: 'https://instagram.com/trendingreels', payouts: [
    { date: '2024-03-15', amount: 320 }
  ]},
  { id: '3', name: 'FastClips TikTok', platform: 'tiktok', followers: '210k', status: 'connected', hasNew: true, link: 'https://tiktok.com/@fastclips', payouts: []},
  { id: '4', name: 'EliteMoments YT', platform: 'youtube', followers: '45k', status: 'connected', hasNew: false, link: 'https://youtube.com', payouts: []},
  { id: '5', name: 'ViralShorts IG', platform: 'instagram', followers: '62k', status: 'connected', hasNew: true, link: 'https://instagram.com', payouts: []},
  { id: '6', name: 'DailyDose TikTok', platform: 'tiktok', followers: '1.2M', status: 'connected', hasNew: false, link: 'https://tiktok.com', payouts: [
    { date: '2024-03-05', amount: 1200 }
  ]},
  { id: '7', name: 'GamingCenter YT', platform: 'youtube', followers: '28k', status: 'connected', hasNew: false, link: 'https://youtube.com', payouts: []},
  { id: '8', name: 'TechRevealed IG', platform: 'instagram', followers: '15k', status: 'connected', hasNew: false, link: 'https://instagram.com', payouts: []},
];

export const MOCK_VIDEOS: VideoData[] = [
  {
    id: '1',
    title: 'How to Clip Like a Pro - Tutorial',
    platform: 'youtube',
    views: 125400,
    likes: 8400,
    comments: 420,
    earnings: 450.50,
    status: 'paid',
    checkpointViews: 100000,
    lastUpdated: '2024-03-30T08:00:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop',
    link: 'https://youtube.com'
  },
  {
    id: '2',
    title: 'Top 10 Gaming Moments #Shorts',
    platform: 'youtube',
    views: 45200,
    likes: 3200,
    comments: 156,
    earnings: 125.75,
    status: 'unpaid',
    checkpointViews: 0,
    lastUpdated: '2024-03-30T09:30:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop',
    link: 'https://youtube.com'
  },
  {
    id: '3',
    title: 'Insane Workout Motivation 😤',
    platform: 'instagram',
    views: 89000,
    likes: 12400,
    comments: 890,
    earnings: 320.00,
    status: 'paid',
    checkpointViews: 80000,
    lastUpdated: '2024-03-30T07:15:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=225&fit=crop',
    link: 'https://instagram.com'
  },
  {
    id: '4',
    title: 'Life in Tokyo - Cinematic',
    platform: 'tiktok',
    views: 210000,
    likes: 45000,
    comments: 2100,
    earnings: 850.25,
    status: 'unpaid',
    checkpointViews: 0,
    lastUpdated: '2024-03-30T10:00:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=225&fit=crop',
    link: 'https://tiktok.com'
  }
];

export const MOCK_STATS_24H: DailyStats[] = [
  { time: '00:00', views: 4500, likes: 400 },
  { time: '02:00', views: 5200, likes: 450 },
  { time: '04:00', views: 3800, likes: 320 },
  { time: '06:00', views: 6100, likes: 580 },
  { time: '08:00', views: 8900, likes: 820 },
  { time: '10:00', views: 12400, likes: 1100 },
  { time: '12:00', views: 15600, likes: 1400 },
  { time: '14:00', views: 14200, likes: 1300 },
  { time: '16:00', views: 18900, likes: 1750 },
  { time: '18:00', views: 22400, likes: 2100 },
  { time: '20:00', views: 21000, likes: 1950 },
  { time: '22:00', views: 19500, likes: 1800 }
];

export const PLATFORM_DISTRIBUTION: PlatformStats[] = [
  { name: 'YouTube', value: 45, color: '#FF0000' },
  { name: 'Instagram', value: 30, color: '#E1306C' },
  { name: 'TikTok', value: 25, color: '#000000' }
];

export const SUMMARY_STATS = {
  totalViews: 471600,
  viewsGrowth: 12.5,
  totalLikes: 69000,
  likesGrowth: 8.2,
  totalComments: 3566,
  commentsGrowth: 5.4,
  estimatedEarnings: 1746.50,
  earningsGrowth: 15.8
};
