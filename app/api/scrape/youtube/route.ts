import { NextRequest, NextResponse } from 'next/server';
import { getChannelIdFromUrl, getChannelVideos, getVideoData } from '../../../../lib/youtube';

interface Post {
  id: string;
  thumbnail: string;
  title: string;
  views: string | number;
  likes: string | number;
  comments: string | number;
  link: string;
  date?: string;
  type?: 'video' | 'short';
}

function parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
}

export async function POST(req: NextRequest) {
  try {
    const { url, limit = 10 } = await req.json();

    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
      return NextResponse.json({ message: 'Invalid YouTube URL' }, { status: 400 });
    }

    console.log(`Scraping YouTube URL: ${url} (limit: ${limit})`);

    let items: any[] = [];
    
    // Check if it's a direct video URL
    const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    const isDirectVideo = (url.includes('watch?v=') || url.includes('youtu.be/') || url.includes('/shorts/')) && videoIdMatch;

    if (isDirectVideo) {
        const videoId = videoIdMatch[1];
        const videoData = await getVideoData(videoId);
        if (videoData) {
            items = [videoData];
        }
    } else {
        // It's a channel URL
        const channelId = await getChannelIdFromUrl(url);
        if (!channelId) {
            return NextResponse.json({ message: 'Could not find YouTube channel ID for this URL.' }, { status: 404 });
        }
        items = await getChannelVideos(channelId, Math.min(limit, 50));
    }

    if (!items || items.length === 0) {
        return NextResponse.json({ message: 'No videos found.' }, { status: 404 });
    }

    const posts: Post[] = items.map((item: any) => {
      const id = item.id;
      const snippet = item.snippet;
      const stats = item.statistics;
      const contentDetails = item.contentDetails;
      
      const durationSeconds = contentDetails ? parseDuration(contentDetails.duration) : 0;
      const isShort = durationSeconds > 0 && durationSeconds < 65; // Simple heuristic for shorts via API

      return {
        id: id,
        title: snippet.title || 'YouTube Video',
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        views: parseInt(stats?.viewCount || '0'),
        likes: parseInt(stats?.likeCount || '0'),
        comments: parseInt(stats?.commentCount || '0'),
        link: `https://www.youtube.com/watch?v=${id}`,
        date: snippet.publishedAt,
        type: isShort ? 'short' : 'video'
      };
    });

    // Sort by date descending
    posts.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('YouTube Scrape Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
