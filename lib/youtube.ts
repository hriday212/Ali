const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function getChannelIdFromUrl(url: string) {
    if (!url) return null;

    // Direct channel ID
    const channelIdMatch = url.match(/channel\/(UC[a-zA-Z0-9_-]{22})/);
    if (channelIdMatch) return channelIdMatch[1];

    // Handle handle (@username)
    const handleMatch = url.match(/@([a-zA-Z0-9._-]+)/);
    if (handleMatch) {
        const handle = handleMatch[1];
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].id;
        }
    }

    // Direct video ID (to find channel)
    const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].snippet.channelId;
        }
    }

    return null;
}

export async function getChannelVideos(channelId: string, maxResults: number = 10) {
    // 1. Get the "Uploads" playlist ID for the channel
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`);
    const channelData = await channelRes.json();
    
    if (!channelData.items || channelData.items.length === 0) {
        throw new Error('Channel not found');
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // 2. Fetch the latest videos from that playlist
    const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`);
    const playlistData = await playlistRes.json();

    if (!playlistData.items || playlistData.items.length === 0) {
        return [];
    }

    const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId);

    // 3. Fetch detailed statistics for those videos
    const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`);
    const videosData = await videosRes.json();

    return videosData.items || [];
}

export async function getVideoData(videoId: string) {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    const data = await res.json();
    return data.items ? data.items[0] : null;
}
export async function getChannelProfile(channelId: string) {
    if (!channelId) return null;
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`);
    const data = await res.json();
    return data.items?.[0]?.snippet?.thumbnails?.high?.url || null;
}
