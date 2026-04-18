const API_TOKEN = process.env.APIFY_API_TOKEN;

async function runApifyActorSync(actorId: string, input: Record<string, unknown>) {
    const formattedId = actorId.replace('/', '~');
    // Using a longer timeout for sync runs
    const url = `https://api.apify.com/v2/acts/${formattedId}/run-sync-get-dataset-items?token=${API_TOKEN}&timeout=180`;
    
    console.log(`Running Apify Actor: ${formattedId}`);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error(`Apify error (${formattedId}):`, err);
        throw new Error(`Apify error: ${err}`);
    }

    return await response.json();
}

export async function runYouTubeScraper(url: string) {
    const input = {
        "startUrls": [{ "url": url }],
        "maxResults": 100,
        "maxShorts": 100,
        "downloadShorts": true,
        "maxComments": 0
    };
    return await runApifyActorSync("streamers/youtube-scraper", input);
}

export async function runInstagramScraper(url: string) {
    const input = {
        "directUrls": [url],
        "resultsLimit": 100,
        "resultsType": "posts"
    };
    return await runApifyActorSync("apify/instagram-scraper", input);
}

export async function runTikTokScraper(url: string) {
    const input = {
        "profiles": [url],
        "resultsPerPage": 30
    };
    return await runApifyActorSync("GdWCkxBtKWOsKjdchBvGIgVaZLIUUY", input);
}
