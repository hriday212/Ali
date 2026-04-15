const fs = require('fs');
const token = fs.readFileSync('.env.local', 'utf8').match(/APIFY_API_TOKEN=(.*)/)[1].trim();

async function checkLastRun(actorId) {
    const formattedId = actorId.replace('/', '~');
    const url = `https://api.apify.com/v2/acts/${formattedId}/runs?limit=1&token=${token}`;
    
    console.log(`\n--- CHECKING LAST RUN FOR ${formattedId} ---`);
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.data.items.length === 0) {
            console.log("No runs found.");
            return;
        }
        
        const lastRun = data.data.items[0];
        console.log(`Run ID: ${lastRun.id}`);
        console.log(`Status: ${lastRun.status}`);
        
        if (lastRun.status === 'FAILED') {
            const logUrl = `https://api.apify.com/v2/logs/${lastRun.id}?token=${token}`;
            const logRes = await fetch(logUrl);
            const logText = await logRes.text();
            console.log("\n--- LOG EXCERPT ---");
            console.log(logText.slice(-2000));
        }
    } catch (e) {
        console.error(`Error checking run: ${e.message}`);
    }
}

async function main() {
    await checkLastRun("GdWCkxBtKWOsKjdch"); // clockworks/tiktok-scraper
}

main();
