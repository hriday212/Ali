const fs = require('fs');

async function main() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const token = envContent.match(/APIFY_API_TOKEN=(.*)/)[1].trim();
    const actorId = "p_m_c_s/youtube-shorts-scraper".replace('/', '~');
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
    
    console.log(`Checking data for MrBeast Shorts (using p_m_c_s/youtube-shorts-scraper with string array)...`);
    const input = {
        "startUrls": ["https://www.youtube.com/@MrBeast/shorts"],
        "maxResults": 3
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
    });
    
    const items = await res.json();
    console.log(`Found ${items.length} items.`);
    if (items.length > 0) {
        items.forEach((item, i) => {
            const isShort = item.type === 'short' || item.url?.includes('/shorts/') || item.videoUrl?.includes('/shorts/');
            console.log(`${i+1}. [${isShort ? 'SHORT' : 'VIDEO'}] ${item.title} (${item.duration}) - ${item.url}`);
        });
        fs.writeFileSync('all_items_sample.json', JSON.stringify(items, null, 2));
    } else {
        console.log('No items found.');
    }
}

main();
