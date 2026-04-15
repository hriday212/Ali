const { ApifyClient } = require('apify-client');
const fs = require('fs');

const token = fs.readFileSync('.env.local', 'utf8').match(/APIFY_API_TOKEN=(.*)/)[1].trim();
const client = new ApifyClient({ token });

async function main() {
    console.log('Testing TikTok with client...');
    try {
        const run = await client.actor("apify/tiktok-scraper").call({
            "startUrls": ["https://www.tiktok.com/@mrbeast"],
            "resultsPerPage": 1
        });
        console.log(`Success! Run ID: ${run.id}`);
    } catch (e) {
        console.log(`apify/tiktok-scraper failed: ${e.message}`);
        
        console.log('Trying alternative: clockworks/tiktok-scraper...');
        try {
            const run2 = await client.actor("clockworks/tiktok-scraper").call({
                "startUrls": [{ "url": "https://www.tiktok.com/@mrbeast" }],
                "resultsPerPage": 1
            });
            console.log(`Success with clockworks! Run ID: ${run2.id}`);
        } catch (e2) {
            console.log(`clockworks failed: ${e2.message}`);
        }
    }
}

main();
