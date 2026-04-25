const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.forensic-scan-data');

if (!fs.existsSync(DATA_DIR)) {
  console.log('Data directory not found:', DATA_DIR);
  process.exit(1);
}

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && f !== 'active-scans.json' && f !== 'ledger.json');

files.forEach(file => {
  const filePath = path.join(DATA_DIR, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let changed = false;

    const cleanThumbnail = (url) => {
      if (!url || typeof url !== 'string') return url;
      if (url.startsWith('https://wsrv.nl/?url=')) {
        try {
          const searchParams = new URLSearchParams(url.split('?')[1]);
          const rawUrl = searchParams.get('url');
          if (rawUrl) {
            changed = true;
            return decodeURIComponent(rawUrl);
          }
        } catch (e) {
          console.error(`Failed to parse URL ${url} in ${file}:`, e.message);
        }
      }
      return url;
    };

    if (Array.isArray(data.posts)) {
      data.posts.forEach(p => {
        p.thumbnail = cleanThumbnail(p.thumbnail);
      });
    }

    if (Array.isArray(data.history)) {
      data.history.forEach(h => {
        h.thumbnail = cleanThumbnail(h.thumbnail);
      });
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`[Cleaned] ${file}`);
    } else {
      console.log(`[No Change] ${file}`);
    }
  } catch (e) {
    console.error(`Failed to process ${file}:`, e.message);
  }
});

console.log('Cleanup complete!');
