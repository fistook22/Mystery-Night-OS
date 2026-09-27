// 15s animation timeline for frames.html. Active only with ?video in the URL.
// window.setTime(t) poses every element deterministically for time t (seconds),
// so any frame can be rendered independently.
(function () {
  if (!location.search.includes('video')) return;

  const css = document.createElement('style');
  css.textContent = `body.video{width:1080px;height:1920px;overflow:hidden;position:relative}
    body.video .frame{position:absolute;top:0;left:0;margin:0}
    .blk{position:absolute;inset:0;background:#000;z-index:80;pointer-events:none}`;
  document.head.appendChild(css);
  document.body.classList.add('video');

  // [id, start, end] — each scene fades in over the previous one
  const S = [['f1', 0, 1.7], ['f2', 1.6, 3.5], ['f3', 3.4, 5.5], ['f4', 5.4, 7.0], ['f5', 6.9, 9.0], ['f6', 8.9, 11.0], ['f7', 10.9, 13.0], ['f8', 12.9, 15.01]];
  const FADE = { f2: .12, f3: .15, f4: 0, f5: .12, f6: .15, f7: .15, f8: .2 };

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (x) => 1 - Math.pow(1 - x, 3);
  const eIn = (x) => x * x * x;
  const eBack = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const $ = (id, sel) => document.querySelector(`#${id} ${sel}`);
  const $$ = (id, sel) => [...document.querySelectorAll(`#${id} ${sel}`)];
  const set = (el, tr, op) => { if (!el) return; if (tr != null) el.style.transform = tr; if (op != null) el.style.opacity = op; };
  const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

  // caption: slide up + fade, starting at local time a
  const caption = (id, lt, a) => { const k = eOut(p(lt, a, a + .35)); set($(id, '.lt'), `translateY(${(1 - k) * 60}px)`, k); };

  const blk4 = document.createElement('div'); blk4.className = 'blk'; document.getElementById('f4').appendChild(blk4);

  const SCENES = {
    f1(lt) {
      set($('f1', '.poster'), `scale(${1.12 - .06 * p(lt, 0, 1.7)}) translateX(${-20 * lt}px)`);
      const shake = lt < .9 ? Math.sin(lt * 70) * 7 * (1 - lt / .9) : 0;
      set($('f1', '.who'), `translateX(${shake}px)`, eOut(p(lt, 0, .25)));
      const press = lt > 1.35 ? .88 + .12 * (1 - p(lt, 1.35, 1.5)) : 1 + .05 * Math.sin(lt * 11);
      set($('f1', '.ba.yes .c'), `scale(${press})`);
      set($('f1', '.big-actions'), `translateY(${(1 - eOut(p(lt, 0, .35))) * 120}px)`);
      set($('f1', '.mini-actions'), null, eOut(p(lt, .1, .4)));
      caption('f1', lt, .3);
    },
    f2(lt) {
      set($('f2', '.poster'), `scale(${1.06 + .03 * p(lt, 0, 1.9)})`);
      $('f2', '.incall .t').textContent = `00:${String(Math.floor(4 + lt * 6)).padStart(2, '0')}`;
      set($('f2', '.tx'), `translateY(${(1 - eOut(p(lt, 0, .3))) * 80}px)`, eOut(p(lt, 0, .25)));
      $$('f2', '.tx .bub').forEach((b, i) => { const k = eBack(p(lt, .2 + i * .42, .45 + i * .42)); set(b, `translateY(${(1 - k) * 30}px) scale(${.9 + .1 * k})`, clamp(k)); });
      const ty = $('f2', '.typing'); set(ty, null, p(lt, 1.45, 1.55));
      $$('f2', '.typing i').forEach((d, i) => { d.style.opacity = .3 + .7 * Math.max(0, Math.sin(lt * 10 - i * 1.1)); });
      caption('f2', lt, .1);
    },
    f3(lt) {
      set($('f3', '.museum'), `scale(${1 + .07 * eOut(p(lt, 0, 2.1))})`);
      set($('f3', '.dust'), `translateY(${-50 * lt}px)`);
      set($('f3', '.cone'), null, .85 + .15 * Math.sin(lt * 9) * Math.sin(lt * 3.3));
      $$('f3', '.mainslab .wl-sheen').forEach((s) => set(s, `translateX(${-110 + 220 * eOut(p(lt, .3, 1.4))}%)`));
      caption('f3', lt, .45);
    },
    f4(lt) {
      // hard cut to black, one flicker, then the night-vision camera
      const flick = lt < .12 ? 1 : lt < .18 ? .2 : lt < .24 ? .9 : 0;
      blk4.style.opacity = flick;
      const n = Math.round(94 * eOut(p(lt, .25, 1.35)));
      $('f4', '.led b').textContent = `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
      const k = eOut(p(lt, .3, 1.4));
      set($('f4', '.arm'), `translate(${(1 - k) * -380}px,${(1 - k) * 120}px) rotate(-16deg)`);
      const fi = Math.floor(lt * 30);
      $$('f4', '.tear').forEach((el, i) => { el.style.top = `${200 + hash(fi * 3 + i) * 1500}px`; el.style.opacity = hash(fi + i * 7) > .4 ? 1 : 0; });
      set($$('f4', '.osd').find((o) => o.textContent.includes('REC')), null, Math.floor(lt * 3) % 2 ? .25 : 1);
      set($('f4', '.ir'), `scale(${1.04 - .04 * p(lt, 0, 1.6)}) translateX(${(hash(fi) - .5) * 6}px)`);
      caption('f4', lt, .35);
    },
    f5(lt) {
      const on = lt < .08 ? 0 : lt < .14 ? .6 : lt < .2 ? .1 : eOut(p(lt, .2, .45));
      set($('f5', '.uvbeam'), null, on); set($('f5', '.uvwash'), null, on);
      set($('f5', '.torch'), `rotate(36deg) translate(${(1 - eOut(p(lt, 0, .3))) * 200}px,${(1 - eOut(p(lt, 0, .3))) * -200}px)`);
      const s = p(lt, .7, .88);
      set($('f5', '.stamp'), `rotate(-13deg) scale(${lt < .7 ? 2.6 : 2.6 - 1.6 * eBack(s)})`, lt < .7 ? 0 : clamp(s * 3));
      const shake = lt > .86 && lt < 1.1 ? (hash(Math.floor(lt * 60)) - .5) * 26 * (1 - p(lt, .86, 1.1)) : 0;
      set(document.getElementById('f5'), `translate(${shake}px,${shake * .6}px)`);
      set($('f5', '.ref'), `translateX(${(1 - eOut(p(lt, 1.1, 1.45))) * -460}px)`);
      set($('f5', '.mainslab'), `translateX(-50%) scale(${.8 + .03 * p(lt, 0, 2.1)})`);
      caption('f5', lt, .8);
    },
    f6(lt) {
      set($('f6', '.story'), `scale(${1.05 - .05 * eOut(p(lt, 0, 2.1))})`);
      const seg = $('f6', '.segs i.h'); const w = 20 + 70 * p(lt, 0, 2.1);
      seg.style.background = `linear-gradient(90deg,#fff ${w}%,rgba(255,255,255,.4) ${w}%)`;
      set($('f6', '.recov'), `translateX(-50%) scale(${lt < .25 ? .01 : eBack(p(lt, .25, .5))})`);
      const opts = $$('f6', '.opt i'); const pk = eOut(p(lt, .6, 1.2));
      if (opts[0]) opts[0].style.width = `${71 * pk}%`; if (opts[1]) opts[1].style.width = `${29 * pk}%`;
      set($('f6', '.poll'), `rotate(-2deg) scale(${eBack(p(lt, .35, .6))})`);
      set($('f6', '.save'), `scale(${1 + .08 * Math.max(0, Math.sin((lt - 1.2) * 8)) * (lt > 1.2 ? 1 : 0)})`, eOut(p(lt, .9, 1.1)));
      caption('f6', lt, .55);
    },
    f7(lt) {
      set($('f7', '.party'), `translateX(${-24 * lt}px) scale(1.05)`);
      const sc = 58 + 8 * p(lt, 0, .5);
      $('f7', '.scrub b').style.width = `${sc}%`; $('f7', '.scrub i').style.left = `${sc}%`;
      const h = eBack(p(lt, .45, .7));
      set($('f7', '.hl'), `rotate(-10deg) scale(${lt < .45 ? 1.6 : 1.6 - .6 * h})`, clamp(p(lt, .45, .55)));
      set($('f7', '.hl-tag'), `scale(${eBack(p(lt, .6, .8))})`);
      $$('f7', '.chat .m').forEach((m, i) => { const a = .25 + i * .22 + (i === 3 ? .15 : 0); const k = eOut(p(lt, a, a + .2));
        set(m, `translateY(${(1 - k) * 40}px) scale(${i === 3 ? .9 + .1 * eBack(p(lt, a, a + .25)) : 1})`, k); });
      caption('f7', lt, 1.15);
    },
    f8(lt) {
      const ph = (sel, d, x0, y0, r0, r1) => { const k = eBack(p(lt, d, d + .5)); set($('f8', sel), `translate(${(1 - k) * x0}px,${(1 - k) * y0}px) rotate(${r0 + (r1 - r0) * k}deg)`, clamp(p(lt, d, d + .15))); };
      ph('.phone.a', 0, -260, 400, -30, -11); ph('.phone.b', .08, 0, 500, 0, 0); ph('.phone.c', .16, 260, 400, 30, 11);
      const wm = eOut(p(lt, .35, .8)); set($('f8', '.endbrand .wm'), `scale(${.85 + .15 * wm})`, wm);
      set($('f8', '.endbrand .sub'), null, p(lt, .6, .9));
      const h2 = eOut(p(lt, .6, .9)); set($('f8', '.endbrand h2'), `translateY(${(1 - h2) * 40}px)`, h2);
      $$('f8', '.chips span').forEach((c, i) => { const k = eOut(p(lt, .8 + i * .12, 1.05 + i * .12)); set(c, `translateY(${(1 - k) * 30}px)`, k); });
      const ck = eBack(p(lt, 1.2, 1.5));
      set($('f8', '.cta'), `scale(${lt < 1.2 ? 0 : ck * (1 + .03 * Math.max(0, Math.sin((lt - 1.5) * 9)))})`);
      set($('f8', '.fine'), null, p(lt, 1.4, 1.7));
    },
  };

  window.setTime = (t) => {
    let z = 1;
    for (const [id, a, b] of S) {
      const el = document.getElementById(id);
      const on = t >= a && t < b;
      el.style.display = on ? 'block' : 'none';
      if (!on) continue;
      el.style.zIndex = z++;
      const f = FADE[id] ?? 0;
      el.style.opacity = f ? eOut(p(t, a, a + f)) : 1;
      SCENES[id](t - a);
    }
  };
  window.setTime(0);
})();
