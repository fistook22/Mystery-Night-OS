// WILDLORE TCG — fictional creature collection "Nightglass (1998)".
// Every creature, name, symbol and card layout here is original artwork for Mystery Night.
(function () {
  const TYPES = {
    lunar: { o: ['#e2dbff', '#5b4bd1'], c: ['#6e62c9', '#171238'], g: '<path d="M15.5 2.5a9.5 9.5 0 1 0 6 16.8A8 8 0 0 1 15.5 2.5z" fill="#1b1540"/>' },
    ore:   { o: ['#fff0c2', '#b58a2a'], c: ['#b39866', '#35291a'], g: '<path d="M12 2 20 7v10l-8 5-8-5V7z" fill="#3b2a0c"/><path d="M12 2v20M4 7l16 10M20 7 4 17" stroke="#f6e3a6" stroke-width="1.2"/>' },
    tide:  { o: ['#c4f1ff', '#1473c9'], c: ['#2a86bd', '#071c33'], g: '<path d="M2 9c3.3 0 3.3-3 6.7-3s3.3 3 6.6 3S18.7 6 22 6M2 15c3.3 0 3.3-3 6.7-3s3.3 3 6.6 3 3.4-3 6.7-3" stroke="#062a4a" stroke-width="2.6" fill="none" stroke-linecap="round"/>' },
    spore: { o: ['#dcffc8', '#2f9e5b'], c: ['#4b8f63', '#0e2a1b'], g: '<circle cx="12" cy="7" r="4" fill="#0f3a22"/><circle cx="6.5" cy="16" r="3.4" fill="#0f3a22"/><circle cx="17.5" cy="16" r="3.4" fill="#0f3a22"/>' },
    ember: { o: ['#ffd9b0', '#d8421b'], c: ['#c24e27', '#330b05'], g: '<path d="M12 1.5c1.2 4.4 6.5 6.4 6.5 12a6.5 6.5 0 0 1-13 0c0-3.3 2.2-4.6 3.3-6.6 0 2.2 1.1 3.3 2.2 3.3 0-3.3-1.1-5.5 1-8.7z" fill="#4a1004"/>' },
    void:  { o: ['#f0d6ff', '#6a1fb3'], c: ['#77409f', '#160726'], g: '<path d="M12 12m-2 0a2 2 0 1 0 4 0a4 4 0 1 0-8 0a6 6 0 1 0 12 0a8 8 0 1 0-16 0" stroke="#2a0a45" stroke-width="2" fill="none"/>' },
    plain: { o: ['#ffffff', '#9a9aa6'], c: ['#999', '#333'], g: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z" fill="#333"/>' },
  };

  const orb = (t) => {
    const T = TYPES[t];
    return `<span class="wl-orb" style="background:radial-gradient(circle at 35% 30%,${T.o[0]},${T.o[1]})"><svg viewBox="0 0 24 24">${T.g}</svg></span>`;
  };

  // deterministic pseudo-random for particles
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dots = (n, seed, fn) => { const r = rnd(seed); let s = ''; for (let i = 0; i < n; i++) s += fn(r, i); return s; };
  const glow = (p, sd = 6) => `<filter id="${p}-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${sd}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

  // ───────────────────────── creature art (600×420) ─────────────────────────
  const ART = {
    // Stained-glass moth leviathan. Legendary. Wing cells hold UV-reactive ink on genuine prints.
    noctyra(p, opt = {}) {
      const uv = opt.uv; // 'real' | 'fake' | undefined
      const cols = uv === 'fake' ? ['#3a2a5a', '#4a3570', '#2f2450', '#43306a', '#382a60', '#4d3a78']
        : uv === 'real' ? ['#7dfff0', '#ff6ff2', '#fff27a', '#8affa0', '#7ab8ff', '#ffffff']
        : ['#1fb5a8', '#6a3fd1', '#e0a43a', '#c83a7a', '#2f6fe0', '#88e0d0'];
      const q = (pts, i) => `<polygon points="${pts}" fill="${cols[i % cols.length]}" opacity=".92"/>`;
      const A = [[300,30],[372,30],[445,30],[515,30],[600,30]], B = [[300,100],[365,92],[452,108],[520,86],[600,100]],
            C = [[300,160],[378,148],[440,168],[525,150],[600,160]], D = [[300,235],[370,235],[445,235],[515,235],[600,235]];
      const rows = [A, B, C, D]; let cellsU = ''; let k = 0;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const a = rows[r][c], b = rows[r][c + 1], d = rows[r + 1][c + 1], e = rows[r + 1][c];
        if ((r + c) % 2) { cellsU += q(`${a} ${b} ${d}`, k++) + q(`${a} ${d} ${e}`, k++); }
        else cellsU += q(`${a} ${b} ${d} ${e}`, k++);
      }
      const E = [[300,212],[370,212],[440,212],[520,212]], F = [[300,275],[360,268],[430,288],[520,270]], G = [[300,380],[368,380],[440,380],[520,380]];
      const rows2 = [E, F, G]; let cellsL = '';
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        const a = rows2[r][c], b = rows2[r][c + 1], d = rows2[r + 1][c + 1], e = rows2[r + 1][c];
        cellsL += q(`${a} ${b} ${d} ${e}`, k++ + 2);
      }
      const UW = 'M300 205 C 350 110, 450 40, 578 55 C 592 120, 540 185, 440 212 C 390 224, 340 220, 300 212 Z';
      const LW = 'M300 218 C 360 228, 455 245, 505 318 C 480 368, 405 360, 355 312 C 328 285, 308 255, 300 232 Z';
      const lead = uv === 'real' ? '#1b0b3a' : '#0b0816';
      const wing = `
        <g clip-path="url(#${p}-uw)">${cellsU}</g>
        <path d="M305 208 C 360 170, 420 120, 560 62 M305 208 C 380 190, 470 175, 585 120 M305 208 C 350 140, 380 90, 420 45" stroke="${lead}" stroke-width="3" fill="none"/>
        <path d="${UW}" fill="none" stroke="${lead}" stroke-width="7"/><path d="${UW}" fill="none" stroke="#f3d98f" stroke-width="1.6" opacity=".8"/>
        <g ${uv === 'fake' ? '' : `filter="url(#${p}-glow)"`}><circle cx="472" cy="122" r="36" fill="${uv === 'fake' ? '#4a3a60' : '#f0b43c'}"/><circle cx="472" cy="122" r="25" fill="${lead}"/><circle cx="472" cy="122" r="15" fill="${uv === 'fake' ? '#5a4a70' : '#3ff0e0'}"/><circle cx="476" cy="117" r="4" fill="#fff"/></g>
        <g clip-path="url(#${p}-lw)">${cellsL}</g>
        <path d="M305 225 C 360 250, 420 280, 490 318 M305 225 C 340 270, 360 300, 380 330" stroke="${lead}" stroke-width="3" fill="none"/>
        <path d="${LW}" fill="none" stroke="${lead}" stroke-width="6"/><path d="${LW}" fill="none" stroke="#f3d98f" stroke-width="1.4" opacity=".8"/>
        <g ${uv === 'fake' ? '' : `filter="url(#${p}-glow)"`}><circle cx="436" cy="306" r="21" fill="${uv === 'fake' ? '#4a3a60' : '#c83a7a'}"/><circle cx="436" cy="306" r="13" fill="${lead}"/><circle cx="436" cy="306" r="6" fill="${uv === 'fake' ? '#5a4a70' : '#ffe98a'}"/></g>
        <path d="M478 340 C 505 375, 525 398, 548 414 C 520 402, 492 388, 462 352 Z" fill="${lead}" stroke="#3ff0e0" stroke-width="1.5" opacity=".95"/>`;
      const bg = uv ? `<rect width="600" height="420" fill="${uv === 'fake' ? '#140a26' : '#10062a'}"/>`
        : `<rect width="600" height="420" fill="url(#${p}-sky)"/><circle cx="300" cy="150" r="170" fill="url(#${p}-moon)" opacity=".6"/>
           ${dots(40, 7, (r) => `<circle cx="${(r() * 600).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(r() * 1.6 + .3).toFixed(1)}" fill="#fff" opacity="${(r() * .7 + .2).toFixed(2)}"/>`)}`;
      return `<svg class="art" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice"><defs>
        <radialGradient id="${p}-sky" cx="50%" cy="36%" r="75%"><stop offset="0" stop-color="#4a3a9a"/><stop offset=".45" stop-color="#1a1244"/><stop offset="1" stop-color="#05030f"/></radialGradient>
        <radialGradient id="${p}-moon"><stop offset="0" stop-color="#fff8e0"/><stop offset=".55" stop-color="#f3d98f" stop-opacity=".7"/><stop offset="1" stop-color="#f3d98f" stop-opacity="0"/></radialGradient>
        <linearGradient id="${p}-body" x1="0" x2="1"><stop offset="0" stop-color="#140c24"/><stop offset=".5" stop-color="#43306e"/><stop offset="1" stop-color="#140c24"/></linearGradient>
        <clipPath id="${p}-uw"><path d="${UW}"/></clipPath><clipPath id="${p}-lw"><path d="${LW}"/></clipPath>${glow(p)}</defs>
        ${bg}
        <g id="${p}-wr">${wing}</g><use href="#${p}-wr" transform="translate(600,0) scale(-1,1)"/>
        <path d="M300 352 C 300 400, 352 410, 384 394 C 414 378, 408 348, 386 350" stroke="url(#${p}-body)" stroke-width="15" fill="none" stroke-linecap="round"/>
        <path d="M300 352 C 300 400, 352 410, 384 394 C 414 378, 408 348, 386 350" stroke="#3ff0e0" stroke-width="3" fill="none" stroke-dasharray="3 9" opacity=".8"/>
        <path d="M300 228 C 324 262, 320 330, 300 362 C 280 330, 276 262, 300 228 Z" fill="url(#${p}-body)"/>
        ${[250, 272, 294, 316, 338].map((y) => `<path d="M${283 + (y - 250) * .08} ${y} Q300 ${y + 8} ${317 - (y - 250) * .08} ${y}" stroke="#0b0816" stroke-width="2.5" fill="none"/>`).join('')}
        <ellipse cx="300" cy="205" rx="25" ry="40" fill="url(#${p}-body)"/>
        <path d="M268 182 Q300 204 332 182 Q322 199 300 202 Q278 199 268 182Z" fill="#e6dcff" opacity=".85"/>
        <circle cx="300" cy="160" r="25" fill="#140c24"/>
        <g filter="url(#${p}-glow)"><ellipse cx="287" cy="157" rx="10" ry="12" fill="${uv === 'fake' ? '#5a4a70' : '#3ff0e0'}"/><ellipse cx="313" cy="157" rx="10" ry="12" fill="${uv === 'fake' ? '#5a4a70' : '#3ff0e0'}"/></g>
        <path d="M292 140 C 280 100, 250 70, 212 54" stroke="#e6dcff" stroke-width="2.5" fill="none"/><path d="M292 140 C 280 100, 250 70, 212 54" stroke="#e6dcff" stroke-width="16" stroke-dasharray="1.6 5" fill="none" opacity=".75"/>
        <path d="M308 140 C 320 100, 350 70, 388 54" stroke="#e6dcff" stroke-width="2.5" fill="none"/><path d="M308 140 C 320 100, 350 70, 388 54" stroke="#e6dcff" stroke-width="16" stroke-dasharray="1.6 5" fill="none" opacity=".75"/>
        ${uv ? '' : dots(26, 3, (r) => `<circle cx="${(r() * 600).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(r() * 2.4 + .6).toFixed(1)}" fill="#ffe7a0" opacity="${(r() * .6 + .3).toFixed(2)}" filter="url(#${p}-glow)"/>`)}
      </svg>`;
    },

    // Blue-and-white porcelain golem mended with gold (kintsugi); a bonsai grows on its shoulder.
    kintsu(p) {
      const seams = ['M300 206 L291 240 L311 262 L295 300 L319 342 L304 402', 'M214 282 L240 293 L235 320 L263 332 L258 360', 'M138 276 L165 298 L157 330 L186 352',
        'M300 168 L291 188 L307 202', 'M458 288 L430 309 L442 342 L420 372', 'M372 250 L352 268 L366 290'];
      return `<svg class="art" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice"><defs>
        <linearGradient id="${p}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1030"/><stop offset=".5" stop-color="#7a3b4a"/><stop offset=".72" stop-color="#e2874d"/><stop offset="1" stop-color="#2a1a12"/></linearGradient>
        <radialGradient id="${p}-porc" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#e9e4d8"/><stop offset="1" stop-color="#8d8577"/></radialGradient>${glow(p, 4)}</defs>
        <rect width="600" height="420" fill="url(#${p}-sky)"/>
        <circle cx="440" cy="250" r="70" fill="#ffd79a" opacity=".55" filter="url(#${p}-glow)"/>
        <path d="M0 290 L90 228 L160 266 L250 206 L340 268 L430 222 L520 262 L600 236 L600 420 L0 420Z" fill="#3a2233" opacity=".85"/>
        <rect y="352" width="600" height="68" fill="#1a110d"/>
        <ellipse cx="168" cy="322" rx="64" ry="80" fill="url(#${p}-porc)"/>
        <ellipse cx="432" cy="322" rx="64" ry="80" fill="url(#${p}-porc)"/>
        <path d="M198 404 C 176 300, 214 214, 300 204 C 386 214, 424 300, 402 404 Z" fill="url(#${p}-porc)"/>
        <g stroke="#1f3f9a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85">
          <path d="M232 300 q18 -28 38 0 t38 0 t38 0"/><path d="M246 340 q14 -20 28 0 t28 0 t28 0 t28 0"/><circle cx="300" cy="262" r="18"/><path d="M300 244 v36 M282 262 h36"/>
          <path d="M140 300 q14 -18 28 0 t28 0"/><path d="M404 300 q14 -18 28 0 t28 0"/><path d="M226 380 h148" stroke-dasharray="10 8"/></g>
        <ellipse cx="160" cy="394" rx="52" ry="28" fill="url(#${p}-porc)"/><ellipse cx="440" cy="394" rx="52" ry="28" fill="url(#${p}-porc)"/>
        <path d="M254 214 C 248 158, 352 158, 346 214 C 330 232, 270 232, 254 214 Z" fill="url(#${p}-porc)"/>
        <path d="M262 176 q38 -22 76 0" stroke="#1f3f9a" stroke-width="4" fill="none"/>
        <path d="M200 404 C 180 330, 220 270, 300 262 C 380 270, 420 330, 400 404Z" fill="#000" opacity=".12"/>
        <g filter="url(#${p}-glow)">${seams.map((d) => `<path d="${d}" stroke="#ffcc4a" stroke-width="6.5" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="#fff4c2" stroke-width="2" fill="none"/>`).join('')}
          <path d="M282 199 L320 196" stroke="#ffb13b" stroke-width="6" stroke-linecap="round"/></g>
        <ellipse cx="206" cy="236" rx="22" ry="9" fill="#5e7d3a"/><ellipse cx="196" cy="242" rx="12" ry="6" fill="#7a9c46"/>
        <path d="M404 236 C 398 214, 414 204, 406 186" stroke="#4a2e1a" stroke-width="7" fill="none" stroke-linecap="round"/>
        <circle cx="398" cy="180" r="17" fill="#3f6b2f"/><circle cx="416" cy="175" r="13" fill="#527f38"/><circle cx="388" cy="190" r="11" fill="#355a28"/>
        ${dots(22, 11, (r) => { const x = (r() * 600).toFixed(0), y = (r() * 330).toFixed(0); return `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6" transform="rotate(${(r() * 180).toFixed(0)} ${x} ${y})" fill="#f7a6b8" opacity=".85"/>`; })}
      </svg>`;
    },

    // Abyssal angler-monarch crowned with bioluminescent lures.
    tidecrown(p) {
      let teeth = '';
      for (let i = 0; i < 14; i++) { const t = i / 13, x = 132 + t * 180, y = 256 + t * 40; teeth += `<polygon points="${x},${y} ${x + 6},${y} ${x + 3},${y + 18 + (i % 3) * 5}" fill="#e8f4f0"/>`; }
      for (let i = 0; i < 12; i++) { const t = i / 11, x = 150 + t * 160, y = 290 + t * 18; teeth += `<polygon points="${x},${y} ${x + 6},${y} ${x + 3},${y - 16 - (i % 2) * 6}" fill="#d4e6e0"/>`; }
      const lures = [[250, 150, 'M250 150 C 232 92, 186 66, 150 76', 150, 76, '#7ff6ff'], [285, 136, 'M285 136 C 276 72, 236 40, 200 36', 200, 36, '#ff5fd2'],
        [322, 134, 'M322 134 C 324 70, 296 30, 262 22', 262, 22, '#b3ff6b'], [356, 142, 'M356 142 C 370 90, 356 50, 330 30', 330, 30, '#7ff6ff'], [388, 156, 'M388 156 C 410 116, 414 76, 396 52', 396, 52, '#ffd36b']];
      return `<svg class="art" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice"><defs>
        <radialGradient id="${p}-w" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#0d4a6b"/><stop offset=".5" stop-color="#031a2a"/><stop offset="1" stop-color="#01080f"/></radialGradient>
        <linearGradient id="${p}-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b6a86"/><stop offset=".55" stop-color="#0f3040"/><stop offset="1" stop-color="#041018"/></linearGradient>${glow(p, 7)}</defs>
        <rect width="600" height="420" fill="url(#${p}-w)"/>
        <g fill="#bff3ff" opacity=".05"><polygon points="120,0 170,0 60,420 0,420"/><polygon points="300,0 330,0 280,420 220,420"/><polygon points="470,0 520,0 600,300 600,420"/></g>
        ${dots(70, 5, (r) => `<circle cx="${(r() * 600).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(r() * 1.5 + .4).toFixed(1)}" fill="#dff" opacity="${(r() * .4 + .1).toFixed(2)}"/>`)}
        <path d="M448 250 L566 176 L542 252 L568 330 Z" fill="#0b2a3a" stroke="#2ad4ff" stroke-opacity=".35" stroke-width="2"/>
        <path d="M296 152 L318 86 L334 150 L360 76 L372 160 L402 96 L406 176 Z" fill="#0e3346" opacity=".85" stroke="#2ad4ff" stroke-opacity=".4"/>
        <path d="M110 260 C 130 160, 320 110, 440 190 C 490 222, 500 280, 450 312 C 350 372, 170 360, 110 260 Z" fill="url(#${p}-b)" stroke="#2ad4ff" stroke-opacity=".35" stroke-width="2.5"/>
        <path d="M120 256 C 160 292, 240 308, 322 300 C 252 286, 182 272, 152 248 Z" fill="#2a0612"/>
        <path d="M112 262 C 150 334, 252 352, 332 322 C 262 322, 184 302, 150 266 Z" fill="#06141d" stroke="#2ad4ff" stroke-opacity=".3"/>
        ${teeth}
        <circle cx="214" cy="214" r="19" fill="#0a0f14" stroke="#d8b24a" stroke-width="3"/><g filter="url(#${p}-glow)"><circle cx="214" cy="214" r="8" fill="#7ff6ff"/></g><circle cx="218" cy="210" r="3" fill="#fff"/>
        ${dots(18, 9, (r, i) => { const t = i / 17; return `<circle cx="${(250 + t * 190).toFixed(0)}" cy="${(250 + Math.sin(t * 3) * 18).toFixed(0)}" r="3" fill="#7ff6ff" filter="url(#${p}-glow)" opacity=".85"/>`; })}
        ${lures.map(([, , d, x, y, c]) => `<path d="${d}" stroke="#0e3346" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#2ad4ff" stroke-opacity=".35" stroke-width="1.5" fill="none"/>
          <circle cx="${x}" cy="${y}" r="26" fill="${c}" opacity=".18"/><g filter="url(#${p}-glow)"><circle cx="${x}" cy="${y}" r="10" fill="${c}"/></g><circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#fff"/>`).join('')}
      </svg>`;
    },

    // Six-eyed swamp shaman: pale axolotl-like elder whose gills are glowing mushrooms.
    mirelotl(p) {
      const gills = [['M206 148 C 176 116, 156 84, 146 50', 146, 50], ['M198 172 C 150 158, 116 136, 88 112', 88, 112], ['M206 196 C 160 208, 122 210, 92 200', 92, 200]];
      const gillSide = gills.map(([d, x, y]) => `<path d="${d}" stroke="#b83a62" stroke-width="13" fill="none" stroke-linecap="round"/>
        <path d="${d}" stroke="#ff8fb0" stroke-width="34" stroke-dasharray="2.2 6" fill="none" opacity=".85"/>
        <g transform="translate(${x},${y})"><path d="M-17 4 C -16 -18, 16 -18, 17 4 Z" fill="#ff6a33"/><ellipse cx="0" cy="4" rx="17" ry="4" fill="#7ff6c8" filter="url(#${p}-glow)"/>
        <circle cx="-6" cy="-6" r="2.6" fill="#fff4e0"/><circle cx="6" cy="-9" r="2" fill="#fff4e0"/></g>`).join('');
      return `<svg class="art" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice"><defs>
        <linearGradient id="${p}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1f1a"/><stop offset=".6" stop-color="#1f4a38"/><stop offset="1" stop-color="#07120e"/></linearGradient>
        <radialGradient id="${p}-skin" cx="42%" cy="30%" r="75%"><stop offset="0" stop-color="#fbeef8"/><stop offset=".6" stop-color="#d9bfd9"/><stop offset="1" stop-color="#9a7aa6"/></radialGradient>
        <linearGradient id="${p}-robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a6b36"/><stop offset="1" stop-color="#101c0d"/></linearGradient>${glow(p, 5)}</defs>
        <rect width="600" height="420" fill="url(#${p}-bg)"/>
        <g fill="#fff" opacity=".07"><ellipse cx="110" cy="330" rx="210" ry="40"/><ellipse cx="500" cy="300" rx="220" ry="34"/></g>
        <path d="M30 420 C 50 300, 20 200, 60 90 M570 420 C 550 280, 590 200, 560 60" stroke="#0b1a14" stroke-width="22" fill="none"/>
        <path d="M190 420 C 194 320, 222 244, 300 232 C 378 244, 406 320, 410 420 Z" fill="url(#${p}-robe)"/>
        ${dots(16, 31, (r) => `<circle cx="${(230 + r() * 140).toFixed(0)}" cy="${(280 + r() * 130).toFixed(0)}" r="${(r() * 5 + 2).toFixed(1)}" fill="#9cc46a" opacity=".5"/>`)}
        <path d="M232 262 C 212 300, 206 340, 214 372" stroke="url(#${p}-skin)" stroke-width="18" fill="none" stroke-linecap="round"/>
        <path d="M372 262 C 402 262, 424 248, 436 222" stroke="url(#${p}-skin)" stroke-width="18" fill="none" stroke-linecap="round"/>
        <path d="M446 70 L 432 418" stroke="#3b2a1a" stroke-width="10" stroke-linecap="round"/>
        <path d="M446 70 C 470 60, 478 90, 458 100" stroke="#3b2a1a" stroke-width="6" fill="none"/>
        <circle cx="458" cy="118" r="30" fill="#b3ff6b" opacity=".22"/><g filter="url(#${p}-glow)"><circle cx="458" cy="118" r="13" fill="#d6ff7a"/></g>
        <ellipse cx="436" cy="222" rx="16" ry="13" fill="url(#${p}-skin)"/>
        <g id="${p}-gl">${gillSide}</g><use href="#${p}-gl" transform="translate(600,0) scale(-1,1)"/>
        <ellipse cx="300" cy="172" rx="106" ry="68" fill="url(#${p}-skin)"/>
        <ellipse cx="300" cy="200" rx="80" ry="30" fill="#000" opacity=".06"/>
        <path d="M232 196 Q300 226 368 196" stroke="#5e3d66" stroke-width="4" fill="none" stroke-linecap="round"/>
        <g fill="#c98fb4" opacity=".6"><circle cx="228" cy="178" r="6"/><circle cx="372" cy="178" r="6"/></g>
        <g filter="url(#${p}-glow)" fill="#ffd24a">${[[252, 166, 8], [270, 152, 6.5], [288, 144, 5], [348, 166, 8], [330, 152, 6.5], [312, 144, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
        <g fill="#2a1030">${[[252, 166, 3], [270, 152, 2.4], [288, 144, 2], [348, 166, 3], [330, 152, 2.4], [312, 144, 2]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r * .5}" ry="${r}"/>`).join('')}</g>
        ${dots(24, 21, (r) => `<circle cx="${(r() * 600).toFixed(0)}" cy="${(r() * 360).toFixed(0)}" r="${(r() * 2 + 1).toFixed(1)}" fill="#d6ff7a" filter="url(#${p}-glow)" opacity="${(r() * .6 + .3).toFixed(2)}"/>`)}
      </svg>`;
    },

    // Skeletal ember-wyrm; a live furnace burns inside its ribcage.
    ossyx(p) {
      let ribs = ''; for (let i = 0; i < 7; i++) { const x = 226 + i * 24; ribs += `<path d="M${x} ${258 - i * 1.5} C ${x - 24} 300, ${x - 12} 342, ${x + 10} 354" stroke="#efe3cc" stroke-width="7" fill="none" stroke-linecap="round"/>`; }
      const spine = 'M70 336 C 150 252, 230 242, 300 262 C 380 286, 432 230, 470 160 C 490 120, 520 110, 545 118';
      return `<svg class="art" viewBox="60 0 600 420" preserveAspectRatio="xMidYMid slice"><defs>
        <radialGradient id="${p}-bg" cx="50%" cy="100%" r="100%"><stop offset="0" stop-color="#ff6a1a"/><stop offset=".35" stop-color="#7a1a08"/><stop offset="1" stop-color="#140403"/></radialGradient>
        <radialGradient id="${p}-core"><stop offset="0" stop-color="#fff6c0"/><stop offset=".4" stop-color="#ffb020"/><stop offset="1" stop-color="#ff3a0a"/></radialGradient>${glow(p, 9)}</defs>
        <rect x="-60" width="760" height="420" fill="url(#${p}-bg)"/>
        <g fill="#000" opacity=".35"><ellipse cx="120" cy="80" rx="160" ry="50"/><ellipse cx="480" cy="40" rx="190" ry="60"/></g>
        <g filter="url(#${p}-glow)" stroke="#ffb020" stroke-width="3" fill="none"><path d="M0 400 L60 380 L90 404 L150 386 L200 410"/><path d="M380 408 L430 386 L470 402 L540 380 L600 396"/></g>
        <path d="M400 250 C 380 150, 330 100, 270 76 L 300 150 L 250 120 L 300 200 L 260 190 L 330 240 Z" fill="#2a0804" opacity=".8"/>
        <path d="M400 250 C 380 150, 330 100, 270 76 M400 250 C 350 180, 320 160, 250 120 M400 250 C 420 170, 440 120, 472 88" stroke="#efe3cc" stroke-width="8" fill="none" stroke-linecap="round"/>
        <circle cx="300" cy="302" r="62" fill="#ff7a1a" opacity=".35" filter="url(#${p}-glow)"/>
        <g filter="url(#${p}-glow)"><circle cx="300" cy="302" r="36" fill="url(#${p}-core)"/></g>
        ${ribs}
        <path d="${spine}" stroke="#7a6a55" stroke-width="26" fill="none" stroke-dasharray="7 9" stroke-linecap="round"/>
        <path d="${spine}" stroke="#efe3cc" stroke-width="13" fill="none" stroke-linecap="round"/>
        <path d="M70 336 L40 350 L62 322 L30 318 L66 306" fill="#efe3cc"/>
        <path d="M540 96 C 520 68, 500 62, 482 68 M552 92 C 548 60, 534 44, 516 38" stroke="#efe3cc" stroke-width="7" fill="none" stroke-linecap="round"/>
        <path d="M520 110 C 530 88, 578 84, 594 100 C 600 112, 592 124, 576 126 L 560 144 L 548 130 C 534 132, 520 124, 520 110 Z" fill="#efe3cc"/>
        <path d="M560 144 l4 -10 4 8 4 -10 4 8" stroke="#1a0604" stroke-width="2" fill="none"/>
        <circle cx="560" cy="106" r="8" fill="#1a0604"/><g filter="url(#${p}-glow)"><circle cx="560" cy="106" r="3.5" fill="#ffb020"/></g>
        ${dots(40, 13, (r) => `<circle cx="${(r() * 600).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(r() * 2 + .6).toFixed(1)}" fill="#ffb020" opacity="${(r() * .8 + .2).toFixed(2)}"/>`)}
      </svg>`;
    },

    // Low-poly obsidian wolf whose skull splits open into an amethyst geode.
    glassmaw(p) {
      const L = [[[190,40],[175,150],[250,120],'#4b3c78'],[[175,150],[250,120],[250,190],'#5e4d92'],[[250,120],[300,110],[250,190],'#7a68b4'],[[300,110],[250,190],[286,212],'#9a88d6'],
        [[300,110],[286,212],[300,232],'#6f5ea8'],[[175,150],[160,232],[250,190],'#3d3066'],[[160,232],[250,190],[256,290],'#4f4082'],[[250,190],[286,212],[256,290],'#6a5aa0'],
        [[286,212],[300,300],[256,290],'#56478a'],[[286,212],[300,232],[300,300],'#8474c2'],[[160,232],[200,322],[256,290],'#342a58'],[[200,322],[256,290],[300,372],'#43366e'],[[256,290],[300,300],[300,372],'#5a4b90']];
      const tri = (a, b, c, f) => `<polygon points="${a} ${b} ${c}" fill="${f}" stroke="#c9b6ff" stroke-opacity=".35" stroke-width="1.2"/>`;
      const left = L.map(([a, b, c, f]) => tri(a, b, c, f)).join('');
      const right = L.map(([a, b, c, f]) => tri([600 - a[0], a[1]], [600 - b[0], b[1]], [600 - c[0], c[1]], f.replace(/#(..)(..)(..)/, (m, r, g, bb) => '#' + [r, g, bb].map((h) => Math.max(0, parseInt(h, 16) - 34).toString(16).padStart(2, '0')).join('')))).join('');
      const prism = (x, y, h, w, a) => `<g transform="translate(${x},${y}) rotate(${a})"><polygon points="${-w},0 ${-w},${-h} 0,${-h - w} ${w},${-h} ${w},0" fill="url(#${p}-am)" stroke="#f3e0ff" stroke-width="1.2"/><line x1="0" y1="0" x2="0" y2="${-h - w}" stroke="#fff" stroke-opacity=".5"/></g>`;
      return `<svg class="art" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid slice"><defs>
        <radialGradient id="${p}-bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#3a1060"/><stop offset=".5" stop-color="#150626"/><stop offset="1" stop-color="#05020a"/></radialGradient>
        <linearGradient id="${p}-am" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5a1aa8"/><stop offset=".6" stop-color="#b76cff"/><stop offset="1" stop-color="#f6e2ff"/></linearGradient>${glow(p, 6)}</defs>
        <rect width="600" height="420" fill="url(#${p}-bg)"/>
        <g fill="none" stroke="#b76cff" stroke-opacity=".14">${[60, 110, 160, 210, 260].map((r) => `<ellipse cx="300" cy="200" rx="${r * 1.5}" ry="${r * .8}"/>`).join('')}</g>
        ${left}${right}
        <polygon points="220,62 205,118 238,108" fill="#7a3fd0"/><polygon points="380,62 395,118 362,108" fill="#7a3fd0"/>
        <g filter="url(#${p}-glow)">${prism(300, 128, 70, 16, 0)}${prism(276, 132, 48, 12, -24)}${prism(326, 132, 52, 12, 22)}${prism(256, 142, 30, 9, -48)}${prism(346, 142, 34, 9, 44)}</g>
        <path d="M300 128 L296 170 L304 200 L298 240 L302 290" stroke="#d9a6ff" stroke-width="3" fill="none" filter="url(#${p}-glow)"/>
        <g filter="url(#${p}-glow)" fill="#f3dcff"><path d="M236 186 L262 180 L256 196 Z"/><path d="M364 186 L338 180 L344 196 Z"/></g>
        <polygon points="288,296 312,296 300,312" fill="#0a0610"/>
        <polygon points="262,330 270,330 266,356" fill="#efe6ff"/><polygon points="330,330 338,330 334,356" fill="#efe6ff"/>
        ${dots(14, 17, (r) => { const x = r() * 600, y = r() * 420, s = r() * 10 + 4; return `<polygon points="${x},${y - s} ${x + s * .5},${y} ${x},${y + s} ${x - s * .5},${y}" fill="#c98bff" opacity="${(r() * .5 + .3).toFixed(2)}"/>`; })}
      </svg>`;
    },
  };

  // ───────────────────────── card data ─────────────────────────
  const CARDS = {
    noctyra: { name: 'Noctyra', hp: 170, type: 'lunar', stage: 'LEGENDARY', dex: 'Moth Leviathan · Ht. 9\'2" · Wt. 3.1 t · Stained-glass wings',
      ability: { name: 'Nightglass Veil', text: 'While the moon is out, attacks against Noctyra cost one more energy.' },
      attacks: [{ cost: ['lunar', 'lunar', 'plain'], name: 'Stained Eclipse', dmg: 130, text: 'Your opponent\'s Active creature is now Dazed. It cannot retreat next turn.' }],
      weak: 'ember', res: 'void', retreat: 2, flavor: 'Sailors swore its wings were cathedral windows drifting over the sea at night.',
      illus: 'Illus. Mira Oshiro-Katz', num: '001/040', set: 'ILLUSTRATOR PRIZE · 1998' },
    kintsu: { name: 'Kintsu', hp: 150, type: 'ore', stage: 'MYTHIC', dex: 'Mended Colossus · Ht. 11\'0" · Wt. 7.8 t',
      ability: { name: 'Broken & Mended', text: 'The first time Kintsu would be knocked out, it survives with 10 HP.' },
      attacks: [{ cost: ['ore', 'ore', 'plain'], name: 'Golden Seam', dmg: 110, text: 'Heal 30 damage from this creature.' }],
      weak: 'tide', res: 'ember', retreat: 3, flavor: 'Every crack it survived was filled with gold. It is heavier every century.', illus: 'Illus. Daniel Ofer', num: '014/102', set: 'NIGHTGLASS' },
    tidecrown: { name: 'Tidecrown', hp: 140, type: 'tide', stage: 'STAGE 2', dex: 'Abyss Monarch · Ht. 14\'5" · Wt. 2.2 t',
      attacks: [{ cost: ['tide'], name: 'Lure Court', dmg: '', text: 'Look at your opponent\'s hand. Choose a card; they shuffle it into their deck.' },
        { cost: ['tide', 'tide', 'plain'], name: 'Needle Tide', dmg: 120, text: '' }],
      weak: 'spore', res: 'ember', retreat: 2, flavor: 'Five lights in the deep. By the time you count them, you are already swimming toward one.', illus: 'Illus. Yarden Shai', num: '031/102', set: 'NIGHTGLASS' },
    mirelotl: { name: 'Mirelotl', hp: 90, type: 'spore', stage: 'STAGE 1', dex: 'Bog Oracle · Ht. 4\'7" · Wt. 38 kg',
      attacks: [{ cost: ['spore'], name: 'Six-Eyed Omen', dmg: '', text: 'Look at the top 6 cards of your deck and put them back in any order.' },
        { cost: ['spore', 'plain'], name: 'Sporelight', dmg: 50, text: 'Your opponent\'s Active creature is now Asleep.' }],
      weak: 'ember', res: 'tide', retreat: 1, flavor: 'It answers any question once. Nobody has ever liked the answer.', illus: 'Illus. Noam Brill', num: '047/102', set: 'NIGHTGLASS' },
    ossyx: { name: 'Ossyx', hp: 160, type: 'ember', stage: 'MYTHIC', dex: 'Furnace Wyrm · Ht. 26\'3" · Wt. 0.9 t (bone)',
      ability: { name: 'Caged Sun', text: 'Once per turn, attach an Ember energy from your discard pile to Ossyx.' },
      attacks: [{ cost: ['ember', 'ember', 'plain', 'plain'], name: 'Ribcage Inferno', dmg: 180, text: 'Discard 2 energy from this creature.' }],
      weak: 'tide', res: 'spore', retreat: 3, flavor: 'Its flesh burned away a thousand years ago. The fire inside never noticed.', illus: 'Illus. Tamar Glick', num: '066/102', set: 'NIGHTGLASS' },
    glassmaw: { name: 'Glassmaw', hp: 120, type: 'void', stage: 'STAGE 1', dex: 'Geode Wolf · Ht. 5\'1" · Wt. 410 kg',
      attacks: [{ cost: ['void'], name: 'Split Howl', dmg: 30, text: 'Each player\'s Active creature is now Confused.' },
        { cost: ['void', 'void', 'plain'], name: 'Amethyst Fang', dmg: 100, text: 'If your opponent has more cards in hand, this attack does 40 more.' }],
      weak: 'ore', res: 'lunar', retreat: 2, flavor: 'The pack sleeps inside a single stone. Crack it, and they wake hungry.', illus: 'Illus. Ido Raz', num: '088/102', set: 'NIGHTGLASS' },
  };

  let uid = 0;
  function card(id, o = {}) {
    const c = CARDS[id], T = TYPES[c.type], p = `${id}${uid++}`;
    const abil = c.ability ? `<div class="wl-ability"><span></span><div class="wl-an"><small>ABILITY</small>${c.ability.name}</div><span></span><div class="wl-txt">${c.ability.text}</div></div>` : '';
    const atks = c.attacks.map((a) => `<div class="wl-attack"><span class="wl-cost">${a.cost.map(orb).join('')}</span><div class="wl-an">${a.name}</div><div class="wl-dmg">${a.dmg}</div>${a.text ? `<div class="wl-txt">${a.text}</div>` : ''}</div>`).join('');
    return `<div class="wl-card" style="${o.style || ''}"><div class="wl-inner" style="--t1:${T.c[0]};--t2:${T.c[1]}">
      <div class="wl-stage">${c.stage}</div>
      <div class="wl-head"><div class="wl-name">${c.name}</div><div class="wl-hp">HP <b>${c.hp}</b>${orb(c.type)}</div></div>
      <div class="wl-art">${ART[id](p, { uv: o.uv })}${(o.holo ?? c.stage === 'LEGENDARY') ? '<div class="wl-holo"></div><div class="wl-sparkle"></div>' : ''}<div class="wl-sheen"></div></div>
      ${o.seal ? `<div class="wl-seal"><svg viewBox="0 0 24 24"><path d="M3 21l3.5-1 11-11-2.5-2.5-11 11zM16 5.5l2.5 2.5 1.8-1.8a1.2 1.2 0 0 0 0-1.7l-.8-.8a1.2 1.2 0 0 0-1.7 0z" fill="#3b2604"/></svg>ILLUSTRATOR<br>1998</div>` : ''}
      <div class="wl-dex">${c.dex}</div>
      ${abil}${atks}
      <div class="wl-rule"></div>
      <div class="wl-stats"><span>WEAKNESS ${orb(c.weak)}×2</span><span>RESISTANCE ${orb(c.res)}−30</span><span>RETREAT ${Array(c.retreat).fill(orb('plain')).join('')}</span></div>
      <div class="wl-flavor">${c.flavor}</div>
      <div class="wl-foot"><span>${c.illus}</span><span>${c.set} · ${c.num} ★</span></div>
    </div></div>`;
  }

  function slab(id, o = {}) {
    const c = CARDS[id];
    return `<div class="slab" style="${o.style || ''}"><div class="slab-label">
      <div class="l"><span class="brand">SLABCERT</span><br>1998 WILDLORE JPN PROMO<br>${c.name.toUpperCase()} <i>${o.variant || 'ILLUSTRATOR'}</i><br><span style="font-weight:400">CERT #48213307</span><div class="bc"></div></div>
      <div class="r"><small>GEM MT</small><b>10</b></div></div>
      <div class="slab-well">${card(id, o)}</div></div>`;
  }

  window.WL = { card, slab, ART, CARDS, TYPES, orb };
})();
