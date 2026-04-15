const { ApifyClient } = require('apify-client');
const fs = require('fs');

async function main() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const token = envContent.match(/APIFY_API_TOKEN=(.*)/)[1].trim();
    const client = new ApifyClient({ token });
    
    const actorId = "clockwork/youtube-shorts-scraper";
    console.log(`Testing ${actorId} with ApifyClient...`);
    
    try {
        const input = {
            "startUrls": [{ "url": "https://www.youtube.com/@MrBeast" }],
            "maxResults": 10
        };
        
        const run = await client.actor(actorId).call(input);
        console.log(`Run started: ${run.id}`);
        
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Found ${items.length} items.`);
        
        items.forEach((item, i) => {
            console.log(`${i+1}. ${item.title} (${item.duration}) - ${item.url || item.videoUrl}`);
        });
        
        fs.writeFileSync('clockwork_shorts_sample.json', JSON.stringify(items, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
