// Browser run-through of a whole party: host, TV and a guest phone, with screenshots.
// Needs a running server (npm run build && npm start) and Playwright.
// Usage: BASE=http://localhost:3000 OUT=./e2e-shots node scripts/e2e-party.mjs
const { chromium } = await import('playwright').catch(() => import('/opt/node22/lib/node_modules/playwright/index.mjs'));
const B = process.env.BASE ?? 'http://localhost:3000', OUT = process.env.OUT ?? 'e2e-shots';
await import('node:fs').then((fs) => fs.mkdirSync(OUT, { recursive: true }));
const api = async (method, url, token, body) => {
  const r = await fetch(B + url, { method, headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json(); if (!r.ok) throw new Error(url + ' ' + JSON.stringify(j)); return j;
};
const browser = await chromium.launch();
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const errors = [];
const watch = (p, name) => { p.on('pageerror', e => errors.push(`${name}: ${e.message}`)); p.on('console', m => m.type() === 'error' && errors.push(`${name} console: ${m.text()}`)); };

// Host creates the party from the home page
const hostCtx = await browser.newContext(phone); const host = await hostCtx.newPage(); watch(host, 'host');
await host.goto(B); await host.screenshot({ path: `${OUT}/01-home.png` });
await host.getByText('צרו ערב חדש').click(); await host.waitForURL(/\/host\//);
const hostToken = host.url().split('/host/')[1];
const hv = await api('GET', '/api/view', hostToken);
const code = hv.inviteCode, tvToken = hv.links.tv.split('/tv/')[1];

// TV lobby
const tvCtx = await browser.newContext({ viewport: { width: 1920, height: 1080 } }); const tv = await tvCtx.newPage(); watch(tv, 'tv');
await tv.goto(`${B}/tv/${tvToken}`);

// One guest joins through the UI, five through the API
const gCtx = await browser.newContext(phone); const g = await gCtx.newPage(); watch(g, 'guest');
await g.goto(`${B}/join/${code}`); await g.waitForSelector('#name');
await g.fill('#name', 'דנה'); await g.getByText('🔍 הבלש/ית').click();
await g.screenshot({ path: `${OUT}/02-join.png` });
await g.getByText('קבלו את הדמות שלי').click(); await g.waitForURL(/\/g\//);
const others = [];
for (const n of ['אבי', 'מיכל', 'יואב', 'נועם', 'שני']) others.push((await api('POST', `/api/join/${code}`, null, { name: n })).token);
await g.waitForTimeout(600);
await g.screenshot({ path: `${OUT}/03-guest-file.png` });
await g.locator('.secret').click(); await g.screenshot({ path: `${OUT}/04-guest-secret.png` });
await tv.waitForTimeout(400); await tv.screenshot({ path: `${OUT}/05-tv-lobby.png` });
await host.waitForTimeout(400); await host.screenshot({ path: `${OUT}/06-host-pregame.png`, fullPage: true });

// Start and jump through the story
await host.getByText('🎬 התחלת הערב').click(); await host.waitForTimeout(500);
const skip = async (n = 1) => { for (let i = 0; i < n; i++) await api('POST', '/api/host/skip', hostToken); await g.waitForTimeout(350); };
await skip(3);  // welcome → maya → live → blackout
await tv.waitForTimeout(600); await tv.screenshot({ path: `${OUT}/07-tv-blackout.png` });
await skip(2);  // calm → UV
await tv.waitForTimeout(500); await tv.screenshot({ path: `${OUT}/08-tv-uv.png` });
await g.locator('.tab').nth(1).click(); await g.waitForTimeout(300);
await g.locator('.evidence').first().click(); await g.waitForTimeout(200);
await g.screenshot({ path: `${OUT}/09-guest-evidence.png` });

// Cert lookup in the Case tab
await g.locator('.tab').nth(4).click(); await g.waitForTimeout(200);
await g.locator('input[inputmode=numeric]').fill('48213307'); await g.getByText('בדיקה', { exact: true }).click(); await g.waitForTimeout(600);
await g.screenshot({ path: `${OUT}/10-guest-tool.png` });

// Hotline opens; chat with Avner
await skip(1); await g.locator('.tab').nth(3).click(); await g.waitForTimeout(300);
await g.screenshot({ path: `${OUT}/11-guest-contacts.png` });
await g.getByText('אבנר', { exact: true }).click();
await g.locator('.composer input').fill('מי התקשר אליך הבוקר? תאר לי את הבחור'); await g.getByText('שלח', { exact: true }).click();
await g.waitForTimeout(900); await g.screenshot({ path: `${OUT}/12-guest-chat.png` });

// VOD + missions; social feed
await skip(2); await g.locator('.tab').nth(2).click(); await g.waitForTimeout(300);
await g.screenshot({ path: `${OUT}/13-guest-pixelgram.png`, fullPage: true });
await g.getByText('Streamly', { exact: true }).click(); await g.waitForTimeout(200);
await g.screenshot({ path: `${OUT}/14-guest-streamly.png`, fullPage: true });
await tv.screenshot({ path: `${OUT}/15-tv-clue.png` });

// QR sticker via the camera link
const qrPage = await gCtx.newPage(); watch(qrPage, 'qr');
await qrPage.goto(`${B}/qr/HUDDLE-7`); await qrPage.waitForTimeout(700);
await qrPage.screenshot({ path: `${OUT}/16-qr-landing.png` });
await g.getByRole('button', { name: /Huddle/ }).click(); await g.waitForTimeout(300);
await g.screenshot({ path: `${OUT}/17-guest-huddle.png` });

// Host mid-game
await host.waitForTimeout(300); await host.screenshot({ path: `${OUT}/18-host-live.png`, fullPage: true });

// Vote and finale
await skip(4);  // noa fallback, gal fallback, leaks, vote
await g.locator('.tab').nth(4).click(); await g.waitForTimeout(300);
await g.locator('.mission .btn.block').filter({ hasText: 'איתן' }).click();
await g.locator('.mission .btn.block').filter({ hasText: 'גל' }).click();
await g.screenshot({ path: `${OUT}/19-guest-vote.png`, fullPage: true });
await g.getByText('הגשת האשמה').click(); await g.waitForTimeout(300);
await api('POST', '/api/guest/accuse', others[0], { suspects: ['rotem'] });
await skip(1); await g.waitForTimeout(700);
await g.screenshot({ path: `${OUT}/20-guest-finale.png` });
await tv.waitForTimeout(300); await tv.screenshot({ path: `${OUT}/21-tv-finale.png` });

// Print page
const pr = await hostCtx.newPage(); watch(pr, 'print'); await pr.goto(`${B}/host/${hostToken}/print`); await pr.waitForTimeout(600);
await pr.screenshot({ path: `${OUT}/22-print.png` });

console.log('errors:', errors.length ? errors : 'none');
await browser.close();
