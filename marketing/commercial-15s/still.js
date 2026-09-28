// Grab stills of the animation at given times: node still.js 0.5 2.2 ...
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await pg.goto('file://' + path.join(__dirname, 'frames.html') + '?video'); await pg.waitForTimeout(400);
  for (const t of process.argv.slice(2)) { await pg.evaluate((x) => window.setTime(x), +t); await pg.screenshot({ path: path.join(__dirname, 'out', `still-${t}.jpg`), type: 'jpeg', quality: 80 }); }
  await b.close(); })();
