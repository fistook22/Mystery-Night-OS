// Renders each storyboard frame in frames.html to a 1080x1920 PNG, then a contact sheet.
// Usage: NODE_PATH=/opt/node22/lib/node_modules node render.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FRAMES = [
  ['f1', '0:00–0:01.5', 'Incoming call'],
  ['f2', '0:01.5–0:03', 'Live AI call'],
  ['f3', '0:03–0:05', 'The card'],
  ['f4', '0:05–0:06.5', 'Blackout'],
  ['f5', '0:06.5–0:08.5', 'UV: fake'],
  ['f6', '0:08.5–0:10.5', 'Pixelgram'],
  ['f7', '0:10.5–0:12.5', 'Streamly'],
  ['f8', '0:12.5–0:15', 'End card'],
];

(async () => {
  const out = path.join(__dirname, 'out');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'frames.html'));
  await page.evaluate(() => document.fonts.ready);
  for (const [id] of FRAMES) {
    await page.locator('#' + id).screenshot({ path: path.join(out, `${id}.png`) });
  }
  const tiles = FRAMES.map(([id, tc, label], i) => `
    <figure><img src="${id}.png"><figcaption><b>${i + 1}</b> ${tc} · ${label}</figcaption></figure>`).join('');
  fs.writeFileSync(path.join(out, 'sheet.html'), `<!doctype html><meta charset="utf-8">
    <style>body{margin:0;background:#0b0b0e;font:600 22px 'Liberation Sans',sans-serif;color:#ddd;padding:40px}
    h1{font-size:34px;color:#ffd98a;margin:0 0 30px}
    .g{display:grid;grid-template-columns:repeat(4,360px);gap:30px}
    figure{margin:0}img{width:360px;height:640px;display:block;border-radius:14px;border:1px solid #333}
    figcaption{margin-top:10px}b{color:#ffd98a}</style>
    <h1>Mystery Night: 15s commercial storyboard (option A, motion graphics)</h1><div class="g">${tiles}</div>`);
  const sheet = await browser.newPage({ viewport: { width: 1640, height: 1600 } });
  await sheet.goto('file://' + path.join(out, 'sheet.html'));
  await sheet.screenshot({ path: path.join(out, 'contact-sheet.png'), fullPage: true });
  await browser.close();
  console.log('done');
})();
