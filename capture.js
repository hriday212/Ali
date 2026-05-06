const { spawn } = require('child_process');
const fs = require('fs');
const http = require('https');

console.log('📡 Connecting to Railway logs...');
const log = spawn('railway', ['logs'], { shell: true });
let capturing = false;
let base64 = '';

log.stdout.on('data', (data) => {
  const str = data.toString();
  if (str.includes('BEGIN_RECOVERY_BLOCK')) {
    capturing = true;
    console.log('✅ Capture STARTED! Please wait...');
    return;
  }
  if (str.includes('END_RECOVERY_BLOCK')) {
    capturing = false;
    console.log('🏁 Capture COMPLETE! Saving file...');
    fs.writeFileSync('final_recovery.tar.gz', Buffer.from(base64.replace(/2026-.*?\[inf\]\s+/g, '').replace(/[^A-Za-z0-9+/=]/g, ''), 'base64'));
    console.log('🏆 SUCCESS! File saved as final_recovery.tar.gz');
    process.exit(0);
  }
  if (capturing) {
    process.stdout.write('.'); // Show progress
    base64 += str;
  }
});

log.stderr.on('data', (data) => {
  console.error('Railway Error:', data.toString());
});

setTimeout(() => {
  console.log('\n🚀 Triggering dump on server...');
  http.get('https://ali-copy-production.up.railway.app/trigger-dump', (res) => {
    console.log('📡 Server acknowledged trigger.');
  }).on('error', (e) => {
    console.log('⚠️ Trigger ping failed (likely 502), but the listener is still waiting for logs.');
  });
}, 3000);
