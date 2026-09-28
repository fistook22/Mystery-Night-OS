// Renders the 15s commercial: poses frames.html?video at each frame time, screenshots it,
// appends the JPEGs to one MJPEG stream file, then encodes it with Playwright's bundled ffmpeg
// (VP8 WebM, silent). That ffmpeg build has no pipe protocol, hence the intermediate file.
// Usage: NODE_PATH=/opt/node22/lib/node_modules node video.js [fps]
const { chromium } = require('playwright');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = +(process.argv[2] || 30), FFMPEG = '/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux';

(async () => {
  const MJPEG = path.join(__dirname, 'out', 'frames.mjpeg');
  const fd = fs.openSync(MJPEG, 'w');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(__dirname, 'frames.html') + '?video');
  await page.waitForTimeout(500);
  const DUR = await page.evaluate(() => window.DURATION || 15);
  const OUT = path.join(__dirname, 'out', `commercial-${DUR}s.webm`);
  const N = Math.round(FPS * DUR);
  for (let i = 0; i < N; i++) {
    await page.evaluate((t) => window.setTime(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    fs.writeSync(fd, buf);
    if (i % 60 === 0) console.log(`frame ${i}/${N}`);
  }
  fs.closeSync(fd);
  await browser.close();
  const r = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', MJPEG,
    '-c:v', 'libvpx', '-b:v', '7M', '-crf', '8', '-qmin', '0', '-qmax', '30', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', OUT], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + r.status);
  fs.unlinkSync(MJPEG);
  console.log('wrote', OUT);
})();
