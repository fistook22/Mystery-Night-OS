// Animation timeline for frames.html ("long cut", ~32s). Active only with ?video in the URL.
// window.setTime(t) poses every element deterministically for time t (seconds), so any
// frame can be rendered independently. window.DURATION is the cut length.
// The earlier 15s cut lives in git history (commit 206f4fb) and out/commercial-15s.webm.
(function () {
  if (!location.search.includes('video')) return;

  const css = document.createElement('style');
  css.textContent = `body.video{width:1080px;height:1920px;overflow:hidden;position:relative}
    body.video .frame{position:absolute;top:0;left:0;margin:0}
    .blk{position:absolute;inset:0;background:#000;z-index:80;pointer-events:none}`;
  document.head.appendChild(css);
  document.body.classList.add('video');

  // Chronological order builds the tension: preview → blackout → fake → "someone is lying" → the call → the evidence → brand.
  // [id, start, end, fade-in seconds]
  const S = [
    ['c0', 0.0, 2.6, 0], ['f3', 2.4, 6.8, .5], ['f4', 6.8, 11.0, 0], ['f5', 11.0, 15.8, .2],
    ['c1', 15.8, 17.9, 0], ['f1', 17.9, 20.6, .2], ['f2', 20.5, 24.2, .15], ['f6', 24.1, 27.0, .2],
    ['f7', 26.9, 29.8, .2], ['f8', 29.7, 32.01, .3],
  ];
  window.DURATION = 32;

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (x) => 1 - Math.pow(1 - x, 3);
  const eInOut = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eBack = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const $ = (id, sel) => document.querySelector(`#${id} ${sel}`);
  const $$ = (id, sel) => [...document.querySelectorAll(`#${id} ${sel}`)];
  const set = (el, tr, op) => { if (!el) return; if (tr != null) el.style.transform = tr; if (op != null) el.style.opacity = op; };
  const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const caption = (id, lt, a, d = .6) => { const k = eOut(p(lt, a, a + d)); set($(id, '.lt'), `translateY(${(1 - k) * 60}px)`, k); };
  const type = (el, text, lt, a, cps) => { const n = Math.floor(clamp((lt - a) * cps, 0, text.length)); el.innerHTML = text.slice(0, n) + (n < text.length && lt >= a ? '<span class="cur"></span>' : ''); };

  const blk4 = document.createElement('div'); blk4.className = 'blk'; document.getElementById('f4').appendChild(blk4);
  const blk5 = document.createElement('div'); blk5.className = 'blk'; document.getElementById('f5').appendChild(blk5);

  const SCENES = {
    // Cold open: type-on text on black
    c0(lt) {
      set($('c0', '.k'), null, eOut(p(lt, .2, .8)));
      type($('c0', '.l1'), 'תל אביב. 21:00.', lt, .5, 14);
      type($('c0', '.l2'), 'ערב תצוגה פרטי.', lt, 1.6, 16);
      set($('c0', '.tc'), null, 1 - p(lt, 2.3, 2.6));
    },
    // The card: slow push-in, the shine crosses once, caption lands late
    f3(lt) {
      set($('f3', '.museum'), `scale(${1 + .09 * eInOut(p(lt, 0, 4.4))})`);
      set($('f3', '.dust'), `translateY(${-30 * lt}px)`);
      set($('f3', '.cone'), null, .85 + .15 * Math.sin(lt * 7) * Math.sin(lt * 2.3));
      $$('f3', '.mainslab .wl-sheen').forEach((s) => set(s, `translateX(${-110 + 220 * eInOut(p(lt, .8, 2.6))}%)`));
      caption('f3', lt, 1.6, .8);
      set($('f3', '.placard'), `translateX(-50%)`, eOut(p(lt, .9, 1.6)));
    },
    // Blackout: a full second of black, two flickers, then night vision. The counter ticks
    // up slowly and eases out; the hand creeps in.
    f4(lt) {
      const fl = [[0, .95, 1], [.95, 1.0, .15], [1.0, 1.12, 1], [1.12, 1.16, .3], [1.16, 1.3, .9]];
      const f = fl.find(([a, b]) => lt >= a && lt < b);
      blk4.style.opacity = f ? f[2] : 0;
      const n = Math.round(94 * eOut(p(lt, 1.35, 4.0)));
      $('f4', '.led b').textContent = `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
      const k = eInOut(p(lt, 1.4, 3.9));
      set($('f4', '.arm'), `translate(${(1 - k) * -420}px,${(1 - k) * 140}px) rotate(-16deg)`);
      const fi = Math.floor(lt * 30);
      $$('f4', '.tear').forEach((el, i) => { el.style.top = `${200 + hash(fi * 3 + i) * 1500}px`; el.style.opacity = hash(fi + i * 7) > .55 ? 1 : 0; });
      set($$('f4', '.osd').find((o) => o.textContent.includes('REC')), null, Math.floor(lt * 2.5) % 2 ? .25 : 1);
      set($('f4', '.ir'), `scale(${1.06 - .06 * p(lt, 1, 4.2)}) translateX(${(hash(fi) - .5) * 5}px)`);
      set($('f4', '.led'), null, eOut(p(lt, 1.3, 1.6)));
      caption('f4', lt, 2.2, .8);
    },
    // UV test: lights stay off, the torch clicks on, a long hold on the card, then the stamp
    f5(lt) {
      blk5.style.opacity = 1 - eOut(p(lt, 0, .5)) * .9 - (lt > .5 ? .1 : 0);
      const on = lt < .9 ? 0 : lt < .96 ? .7 : lt < 1.05 ? .1 : lt < 1.1 ? .8 : eOut(p(lt, 1.1, 1.5));
      set($('f5', '.uvbeam'), null, on); set($('f5', '.uvwash'), null, on);
      const tk = eOut(p(lt, .2, .9));
      set($('f5', '.torch'), `rotate(36deg) translate(${(1 - tk) * 220}px,${(1 - tk) * -220}px)`);
      set($('f5', '.mainslab'), `translateX(-50%) scale(${.78 + .05 * eInOut(p(lt, .5, 2.6))})`);
      const SA = 2.6, s = p(lt, SA, SA + .18);
      set($('f5', '.stamp'), `rotate(-13deg) scale(${lt < SA ? 2.6 : 2.6 - 1.6 * eBack(s)})`, lt < SA ? 0 : clamp(s * 3));
      const shake = lt > SA + .16 && lt < SA + .5 ? (hash(Math.floor(lt * 60)) - .5) * 30 * (1 - p(lt, SA + .16, SA + .5)) : 0;
      set(document.getElementById('f5'), `translate(${shake}px,${shake * .6}px)`);
      set($('f5', '.ref'), `translateX(${(1 - eOut(p(lt, 3.4, 3.9))) * -460}px)`);
      caption('f5', lt, SA + .15, .5);
      set($('f5', '.lt p'), null, eOut(p(lt, 3.2, 3.7)));
    },
    // Beat on black: "Someone in this room is lying."
    c1(lt) {
      const a = eOut(p(lt, .2, .9)); set($('c1', '.big .a'), `translateY(${(1 - a) * 30}px)`, a);
      const k = p(lt, 1.0, 1.2); set($('c1', '.big em'), `scale(${lt < 1 ? 1.6 : 1.6 - .6 * eBack(k)})`, clamp(k * 2));
      set($('c1', '.glow'), null, lt > 1 ? .6 + .4 * Math.sin((lt - 1) * 6) : 0);
      $('c1', '.big em').style.display = 'inline-block';
    },
    // Incoming call: two vibration bursts before the answer
    f1(lt) {
      set($('f1', '.poster'), `scale(${1.12 - .06 * p(lt, 0, 2.7)}) translateX(${-15 * lt}px)`);
      const burst = (a) => (lt > a && lt < a + .6 ? Math.sin((lt - a) * 70) * 8 * (1 - (lt - a) / .6) : 0);
      set($('f1', '.who'), `translateX(${burst(0) + burst(1.1)}px)`, eOut(p(lt, 0, .3)));
      const press = lt > 2.2 ? .88 + .12 * (1 - p(lt, 2.2, 2.4)) : 1 + .05 * Math.sin(lt * 9);
      set($('f1', '.ba.yes .c'), `scale(${press})`);
      set($('f1', '.big-actions'), `translateY(${(1 - eOut(p(lt, 0, .4))) * 120}px)`);
      set($('f1', '.mini-actions'), null, eOut(p(lt, .1, .5)));
      caption('f1', lt, .7);
    },
    // The live call: replies land with pauses between them
    f2(lt) {
      set($('f2', '.poster'), `scale(${1.06 + .03 * p(lt, 0, 3.7)})`);
      $('f2', '.incall .t').textContent = `00:${String(Math.floor(3 + lt * 3)).padStart(2, '0')}`;
      set($('f2', '.tx'), `translateY(${(1 - eOut(p(lt, 0, .4))) * 80}px)`, eOut(p(lt, 0, .3)));
      $$('f2', '.tx .bub').forEach((b, i) => { const a = .5 + i * .9; const k = eBack(p(lt, a, a + .3)); set(b, `translateY(${(1 - k) * 30}px) scale(${.9 + .1 * k})`, clamp(k)); });
      set($('f2', '.typing'), null, p(lt, 3.0, 3.1));
      $$('f2', '.typing i').forEach((d, i) => { d.style.opacity = .3 + .7 * Math.max(0, Math.sin(lt * 8 - i * 1.1)); });
      caption('f2', lt, .2);
    },
    f6(lt) {
      set($('f6', '.story'), `scale(${1.05 - .05 * eOut(p(lt, 0, 2.9))})`);
      const seg = $('f6', '.segs i.h'); const w = 20 + 70 * p(lt, 0, 2.9);
      seg.style.background = `linear-gradient(90deg,#fff ${w}%,rgba(255,255,255,.4) ${w}%)`;
      set($('f6', '.recov'), `translateX(-50%) scale(${lt < .35 ? .01 : eBack(p(lt, .35, .65))})`);
      const opts = $$('f6', '.opt i'); const pk = eOut(p(lt, .9, 1.7));
      if (opts[0]) opts[0].style.width = `${71 * pk}%`; if (opts[1]) opts[1].style.width = `${29 * pk}%`;
      set($('f6', '.poll'), `rotate(-2deg) scale(${eBack(p(lt, .5, .8))})`);
      set($('f6', '.save'), `scale(${1 + (lt > 1.7 ? .08 * Math.max(0, Math.sin((lt - 1.7) * 7)) : 0)})`, eOut(p(lt, 1.4, 1.6)));
      caption('f6', lt, .9);
    },
    f7(lt) {
      set($('f7', '.party'), `translateX(${-18 * lt}px) scale(1.05)`);
      const sc = 58 + 8 * eOut(p(lt, 0, .8));
      $('f7', '.scrub b').style.width = `${sc}%`; $('f7', '.scrub i').style.left = `${sc}%`;
      const h = eBack(p(lt, .7, .95));
      set($('f7', '.hl'), `rotate(-10deg) scale(${lt < .7 ? 1.6 : 1.6 - .6 * h})`, clamp(p(lt, .7, .8)));
      set($('f7', '.hl-tag'), `scale(${eBack(p(lt, .85, 1.05))})`);
      $$('f7', '.chat .m').forEach((m, i) => { const a = .35 + i * .3 + (i === 3 ? .35 : 0); const k = eOut(p(lt, a, a + .25));
        set(m, `translateY(${(1 - k) * 40}px) scale(${i === 3 ? .9 + .1 * eBack(p(lt, a, a + .3)) : 1})`, k); });
      caption('f7', lt, 1.7);
    },
    f8(lt) {
      const ph = (sel, d, x0, y0, r0, r1) => { const k = eBack(p(lt, d, d + .6)); set($('f8', sel), `translate(${(1 - k) * x0}px,${(1 - k) * y0}px) rotate(${r0 + (r1 - r0) * k}deg)`, clamp(p(lt, d, d + .15))); };
      ph('.phone.a', 0, -260, 400, -30, -11); ph('.phone.b', .1, 0, 500, 0, 0); ph('.phone.c', .2, 260, 400, 30, 11);
      const wm = eOut(p(lt, .45, 1.0)); set($('f8', '.endbrand .wm'), `scale(${.85 + .15 * wm})`, wm);
      set($('f8', '.endbrand .sub'), null, p(lt, .8, 1.1));
      const h2 = eOut(p(lt, .8, 1.2)); set($('f8', '.endbrand h2'), `translateY(${(1 - h2) * 40}px)`, h2);
      $$('f8', '.chips span').forEach((c, i) => { const k = eOut(p(lt, 1.1 + i * .15, 1.4 + i * .15)); set(c, `translateY(${(1 - k) * 30}px)`, k); });
      const ck = eBack(p(lt, 1.6, 1.9));
      set($('f8', '.cta'), `scale(${lt < 1.6 ? 0 : ck * (1 + .03 * Math.max(0, Math.sin((lt - 1.9) * 6)))})`);
      set($('f8', '.fine'), null, p(lt, 1.8, 2.1));
    },
  };

  window.setTime = (t) => {
    let z = 1;
    for (const [id, a, b, f] of S) {
      const el = document.getElementById(id);
      const on = t >= a && t < b;
      el.style.display = on ? 'block' : 'none';
      if (!on) continue;
      el.style.zIndex = z++;
      el.style.opacity = f ? eOut(p(t, a, a + f)) : 1;
      SCENES[id](t - a);
    }
  };
  window.setTime(0);
})();
