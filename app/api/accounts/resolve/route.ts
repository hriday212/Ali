import { NextRequest, NextResponse } from 'next/server';
import { getChannelIdFromUrl, getChannelProfile } from '@/lib/youtube';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ message: 'URL is required' }, { status: 400 });
    }

    const platform = url.includes('youtube') ? 'youtube' :
      url.includes('instagram') ? 'instagram' : 'tiktok';

    let channelId = '';
    let avatarUrl = '';
    let name = url.split('/').pop()?.replace('@', '') || 'New Account';

    if (platform === 'youtube') {
      try {
        channelId = await getChannelIdFromUrl(url) || '';
        if (channelId) {
          avatarUrl = await getChannelProfile(channelId) || '';
        }

        // Try to get channel name from the API
        if (channelId) {
          const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
          const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`);
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const channel = data.items[0];
            name = channel.snippet.title || name;
            const subs = channel.statistics?.subscriberCount;
            const subsFormatted = subs ? formatSubs(parseInt(subs)) : '0';

            return NextResponse.json({
              channelId,
              avatarUrl,
              name,
              platform,
              followers: subsFormatted,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching YT channel info:', err);
      }
    }

    return NextResponse.json({
      channelId,
      avatarUrl,
      name,
      platform,
      followers: '0',
    });
  } catch (error: any) {
    console.error('Add Account Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

function formatSubs(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
