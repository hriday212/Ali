import { NextRequest, NextResponse } from 'next/server';
import { runInstagramScraper } from '../../../../lib/apify';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('instagram.com')) {
      return NextResponse.json({ message: 'Invalid Instagram URL' }, { status: 400 });
    }

    const items = await runInstagramScraper(url);

    if (!items || items.length === 0) {
        return NextResponse.json({ message: 'No posts found via Apify Instagram.' }, { status: 404 });
    }

    // Map Apify results to our frontend structure
    const posts = items.map((item: any) => ({
      id: item.shortCode || item.id,
      title: item.caption || 'Instagram Post',
      thumbnail: item.displayUrl || (item.images && item.images[0]) ? `/api/proxy/image?url=${encodeURIComponent(item.displayUrl || item.images[0])}` : '',
      views: item.videoViewCount !== undefined ? item.videoViewCount.toLocaleString() : 'N/A',
      likes: item.likesCount !== undefined ? item.likesCount.toLocaleString() : 'N/A',
      comments: item.commentsCount !== undefined ? item.commentsCount.toLocaleString() : 'N/A',
      link: item.url || `https://www.instagram.com/p/${item.shortCode}/`,
      date: item.timestamp || 'N/A',
      type: item.isVideo ? 'video' : 'photo'
    })).sort((a: any, b: any) => {
      if (a.date === 'N/A') return 1;
      if (b.date === 'N/A') return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Instagram Scrape error:', error);
    return NextResponse.json({ message: error.message || 'Instagram scraping failed' }, { status: 500 });
  }
}
