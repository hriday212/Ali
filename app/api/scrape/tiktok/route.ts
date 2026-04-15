import { NextRequest, NextResponse } from 'next/server';
import { runTikTokScraper } from '../../../../lib/apify';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('tiktok.com')) {
      return NextResponse.json({ message: 'Invalid TikTok URL' }, { status: 400 });
    }

    const items = await runTikTokScraper(url);

    if (!items || items.length === 0) {
        return NextResponse.json({ message: 'No posts found via Apify TikTok.' }, { status: 404 });
    }

    // Map Apify results to our frontend structure
    const posts = items.map((item: any) => ({
      id: item.id,
      title: item.text || 'TikTok Video',
      thumbnail: (item.covers?.default || item.coverUrl) ? `/api/proxy/image?url=${encodeURIComponent(item.covers?.default || item.coverUrl)}` : '',
      views: item.playCount !== undefined ? item.playCount.toLocaleString() : 'N/A',
      likes: item.diggCount !== undefined ? item.diggCount.toLocaleString() : 'N/A',
      comments: item.commentCount !== undefined ? item.commentCount.toLocaleString() : 'N/A',
      link: item.webVideoUrl || `https://www.tiktok.com/v/${item.id}`,
      date: item.createTime || 'N/A',
      type: 'video'
    })).sort((a: any, b: any) => {
      if (a.date === 'N/A') return 1;
      if (b.date === 'N/A') return -1;
      // TikTok createTime is often a Unix timestamp (number or string)
      return Number(b.date) - Number(a.date);
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('TikTok Scrape error:', error);
    return NextResponse.json({ message: error.message || 'TikTok scraping failed' }, { status: 500 });
  }
}
