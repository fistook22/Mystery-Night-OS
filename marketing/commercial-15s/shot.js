// Screenshot a local page: node shot.js <html> <out.png> <width> <height>
const { chromium } = require('playwright'); const path = require('path');
(async () => { const [, , f, o, w, h] = process.argv; const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: +w, height: +h } }); pg.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await pg.goto('file://' + path.resolve(f)); await pg.waitForTimeout(300);
  await pg.screenshot({ path: o, fullPage: true }); await b.close(); })();
