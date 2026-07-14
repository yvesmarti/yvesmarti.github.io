// Hero topographic background — production version
// Drop-in script for the existing #isoline-canvas in the hero section.
// Renders an animated topographic relief (hillshade + isolines) that
// responds subtly to mouse movement and supports light/dark themes.
//
// Usage in your existing HTML (replaces the old canvas script):
//
//   <canvas id="isoline-canvas" aria-hidden="true"></canvas>
//   <script src="hero-background.js"></script>
//
// The script auto-boots on DOMContentLoaded. It reads the theme from
// `document.documentElement.dataset.theme` ("dark" by default; "light" supported).
// Call `window.HeroBg.setTheme(true|false)` from your theme toggle.

(function () {
  // ====== CONFIG — tweak here ======
  const CONFIG = {
    levels: 20,            // number of contour lines
    warpRadius: 320,       // cursor influence radius (px)
    warpStrength: 25,      // cursor displacement strength
    speed: 0.5,            // animation speed (1 = default)
    cellSize: 7,           // grid resolution; smaller = smoother but slower
    accentDark: '#5fc6a8', // line/relief tint — dark theme
    accentLight: '#1f6b50',// line/relief tint — light theme
    bgDark: '#0a2418',     // base tone behind relief — dark theme
    bgLight: '#f1f5f1',    // base tone behind relief — light theme
    reliefIntensity: { dark: 0.75, light: 0.55 }, // relief layer opacity
    canvasSelector: '#isoline-canvas',
    heroSelector: '.hero', // element that captures mouse for cursor warp
  };

  // ====== Perlin-ish value noise ======
  function makeNoise(seed) {
    const perm = new Uint8Array(512);
    const base = new Uint8Array(256);
    for (let i = 0; i < 256; i++) base[i] = i;
    let s = (seed * 2654435761) >>> 0;
    const rand = () => ((s = ((s * 1664525) + 1013904223) >>> 0) / 0xffffffff);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + (b - a) * t;
    const grad = (h, x, y) => {
      const g = h & 7;
      const u = g < 4 ? x : y;
      const v = g < 4 ? y : x;
      return ((g & 1) ? -u : u) + ((g & 2) ? -2 * v : 2 * v);
    };
    return (x, y) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      const u = fade(x), v = fade(y);
      const A = (perm[X] + Y) & 255, B = (perm[X + 1] + Y) & 255;
      return lerp(
        lerp(grad(perm[A], x, y), grad(perm[B], x - 1, y), u),
        lerp(grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1), u),
        v
      ) * 0.5;
    };
  }
  const noise = makeNoise(11);
  function fbm(x, y, z) {
    return noise(x + z * 0.6, y - z * 0.4) * 0.55
         + noise(x * 2.07 + z * 0.4, y * 2.07 + 13.2) * 0.27
         + noise(x * 4.13 + 7.3, y * 4.13 + z * 0.2) * 0.13
         + noise(x * 8.31, y * 8.31 + 5.1) * 0.05;
  }

  // ====== State ======
  const S = {
    canvas: null, ctx: null,
    w: 0, h: 0, dpr: 1,
    cell: CONFIG.cellSize, gw: 0, gh: 0, field: null,
    levels: CONFIG.levels,
    speed: CONFIG.speed,
    warpR: CONFIG.warpRadius, warpA: CONFIG.warpStrength,
    isDark: true,
    mx: -9999, my: -9999, tmx: -9999, tmy: -9999,
    raf: 0, running: false,
    shadeCanvas: null, shadeCtx: null, shadeImg: null,
    reducedMotion: false, heroVisible: true, tabVisible: true,
    io: null,
  };

  function resize() {
    const c = S.canvas;
    const r = c.getBoundingClientRect();
    S.dpr = Math.min(window.devicePixelRatio || 1, 2);
    S.w = Math.max(1, Math.round(r.width));
    S.h = Math.max(1, Math.round(r.height));
    c.width = S.w * S.dpr;
    c.height = S.h * S.dpr;
    S.ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    S.gw = Math.ceil(S.w / S.cell) + 1;
    S.gh = Math.ceil(S.h / S.cell) + 1;
    S.field = new Float32Array(S.gw * S.gh);
    S.shadeCanvas = null; // force re-alloc
  }

  function computeField(t) {
    const { gw, gh, cell, field } = S;
    const sx = 0.0024, sy = 0.0024;
    const breath = 1 + Math.sin(t * 0.00012) * 0.04;
    const z = t * 0.00007;
    const mx = S.mx, my = S.my, warpR = S.warpR, r2 = warpR * warpR, warpA = S.warpA;
    for (let y = 0; y < gh; y++) {
      const py = y * cell;
      for (let x = 0; x < gw; x++) {
        let wx = x * cell, wy = py;
        const dx = wx - mx, dy = wy - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2 && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = 1 - d / warpR;
          const force = f * f * warpA;
          wx += dx / d * force;
          wy += dy / d * force;
        }
        field[y * gw + x] = fbm(wx * sx * breath, wy * sy * breath, z);
      }
    }
  }

  function emitSegments(idx, tl, tr, br, bl, th, out, x, y, sw, sh) {
    const topT = (th - tl) / (tr - tl);
    const rightT = (th - tr) / (br - tr);
    const botT = (th - bl) / (br - bl);
    const leftT = (th - tl) / (bl - tl);
    const tx = x + topT * sw, ty = y;
    const rx = x + sw, ry = y + rightT * sh;
    const bx = x + botT * sw, by = y + sh;
    const lx = x, ly = y + leftT * sh;
    switch (idx) {
      case 1: case 14: out.push(lx, ly, tx, ty); break;
      case 2: case 13: out.push(tx, ty, rx, ry); break;
      case 3: case 12: out.push(lx, ly, rx, ry); break;
      case 4: case 11: out.push(rx, ry, bx, by); break;
      case 6: case 9:  out.push(tx, ty, bx, by); break;
      case 7: case 8:  out.push(lx, ly, bx, by); break;
      case 5: out.push(lx, ly, tx, ty, rx, ry, bx, by); break;
      case 10: out.push(lx, ly, bx, by, tx, ty, rx, ry); break;
    }
  }

  function gatherIsoline(threshold) {
    const { field, gw, gh, w, h } = S;
    const sw = w / (gw - 1), sh = h / (gh - 1);
    const segs = [];
    for (let y = 0; y < gh - 1; y++) {
      const py = y * sh;
      for (let x = 0; x < gw - 1; x++) {
        const i = y * gw + x;
        const tl = field[i], tr = field[i + 1];
        const bl = field[i + gw], br = field[i + gw + 1];
        let idx = 0;
        if (tl > threshold) idx |= 1;
        if (tr > threshold) idx |= 2;
        if (br > threshold) idx |= 4;
        if (bl > threshold) idx |= 8;
        if (idx === 0 || idx === 15) continue;
        emitSegments(idx, tl, tr, br, bl, threshold, segs, x * sw, py, sw, sh);
      }
    }
    return segs;
  }

  function strokeSegs(segs, color, width, alpha) {
    if (!segs.length) return;
    const ctx = S.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i < segs.length; i += 4) {
      ctx.moveTo(segs[i], segs[i + 1]);
      ctx.lineTo(segs[i + 2], segs[i + 3]);
    }
    ctx.stroke();
  }

  function hexToRgb(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
  }

  function drawTopographic() {
    const { ctx, w, h, gw, gh, field } = S;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    const accent = hexToRgb(S.isDark ? CONFIG.accentDark : CONFIG.accentLight);
    const bg = hexToRgb(S.isDark ? CONFIG.bgDark : CONFIG.bgLight);

    // Hillshade layer (low-res, stretched)
    if (!S.shadeCanvas || S.shadeCanvas.width !== gw || S.shadeCanvas.height !== gh) {
      S.shadeCanvas = document.createElement('canvas');
      S.shadeCanvas.width = gw;
      S.shadeCanvas.height = gh;
      S.shadeCtx = S.shadeCanvas.getContext('2d');
      S.shadeImg = S.shadeCtx.createImageData(gw, gh);
    }
    const data = S.shadeImg.data;
    const lx = -0.6, ly = -0.6, lz = 0.55;
    const nlen = Math.sqrt(lx*lx + ly*ly + lz*lz);
    const lxn = lx / nlen, lyn = ly / nlen, lzn = lz / nlen;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = y * gw + x;
        const v = field[i];
        const vx = field[i + (x < gw - 1 ? 1 : 0)] - field[i - (x > 0 ? 1 : 0)];
        const vy = field[i + (y < gh - 1 ? gw : 0)] - field[i - (y > 0 ? gw : 0)];
        const nlx = -vx * 5, nly = -vy * 5, nlz = 1;
        const nl = Math.sqrt(nlx*nlx + nly*nly + nlz*nlz);
        let shade = (nlx * lxn + nly * lyn + nlz * lzn) / nl;
        shade = Math.max(0, Math.min(1, shade * 0.5 + 0.5));
        const elev = (v + 0.7) / 1.4;
        const t = elev * 0.55 + shade * 0.45;
        const mixT = (t - 0.5) * 0.35 + 0.5;
        const col = mix(bg, accent, mixT * (S.isDark ? 0.55 : 0.35));
        const idx = i * 4;
        data[idx] = col[0];
        data[idx + 1] = col[1];
        data[idx + 2] = col[2];
        data[idx + 3] = 255;
      }
    }
    S.shadeCtx.putImageData(S.shadeImg, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = S.isDark ? CONFIG.reliefIntensity.dark : CONFIG.reliefIntensity.light;
    ctx.drawImage(S.shadeCanvas, 0, 0, w, h);
    ctx.globalAlpha = 1;

    // Isolines over the relief
    const lineColor = S.isDark ? 'rgb(255,255,255)' : 'rgb(10,40,28)';
    const lo = -0.7, hi = 0.7;
    for (let i = 0; i < S.levels; i++) {
      const t = i / (S.levels - 1);
      const v = lo + t * (hi - lo);
      const segs = gatherIsoline(v);
      const major = (i % 5 === 0);
      const alpha = (major ? 0.6 : 0.3) * (S.isDark ? 1 : 0.85);
      const width = major ? 1.0 : 0.45;
      strokeSegs(segs, lineColor, width, alpha);
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    if (!S.running) return;
    S.mx = S.mx === -9999 ? S.tmx : S.mx + (S.tmx - S.mx) * 0.18;
    S.my = S.my === -9999 ? S.tmy : S.my + (S.tmy - S.my) * 0.18;
    computeField(now * S.speed);
    drawTopographic();
    S.raf = requestAnimationFrame(tick);
  }

  // Starts/stops the rAF loop based on combined visibility state, so no
  // frames (and none of their per-frame noise/isoline/hillshade work) are
  // scheduled while the hero is off-screen, the tab is hidden, or reduced
  // motion is requested.
  function updateRunning() {
    const shouldRun = S.heroVisible && S.tabVisible && !S.reducedMotion;
    if (shouldRun && !S.running) {
      S.running = true;
      S.raf = requestAnimationFrame(tick);
    } else if (!shouldRun && S.running) {
      S.running = false;
      cancelAnimationFrame(S.raf);
    }
  }

  function boot() {
    const canvas = document.querySelector(CONFIG.canvasSelector);
    if (!canvas) {
      console.warn('[HeroBg] canvas not found:', CONFIG.canvasSelector);
      return;
    }
    S.canvas = canvas;
    S.ctx = canvas.getContext('2d');
    S.isDark = document.documentElement.dataset.theme !== 'light';
    resize();
    window.addEventListener('resize', resize);

    const hero = document.querySelector(CONFIG.heroSelector) || canvas.parentElement;
    if (hero) {
      // Cache the canvas rect: getBoundingClientRect() forces a layout read,
      // too costly to run on every pointermove (can fire at 100+ Hz).
      // The rect is viewport-relative, so invalidate it on scroll and resize.
      let rect = null;
      const invalidateRect = () => { rect = null; };
      window.addEventListener('scroll', invalidateRect, { passive: true });
      window.addEventListener('resize', invalidateRect);
      hero.addEventListener('pointermove', (e) => {
        if (!rect) rect = canvas.getBoundingClientRect();
        S.tmx = e.clientX - rect.left;
        S.tmy = e.clientY - rect.top;
      });
      hero.addEventListener('pointerleave', () => {
        S.tmx = -9999; S.tmy = -9999;
        S.mx = -9999; S.my = -9999;
      });

      if ('IntersectionObserver' in window) {
        S.io = new IntersectionObserver((entries) => {
          S.heroVisible = entries[0].isIntersecting;
          updateRunning();
        }, { threshold: 0 });
        S.io.observe(hero);
      }
    }

    S.onVisibilityChange = () => {
      S.tabVisible = document.visibilityState === 'visible';
      updateRunning();
    };
    document.addEventListener('visibilitychange', S.onVisibilityChange);

    // Respect reduced motion: skip the animation loop entirely and render
    // a single static frame instead of recomputing it every frame for nothing.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      S.reducedMotion = true;
      computeField(0);
      drawTopographic();
      return;
    }

    updateRunning();
  }

  window.HeroBg = {
    setTheme(isDark) { S.isDark = !!isDark; },
    destroy() {
      S.running = false;
      cancelAnimationFrame(S.raf);
      window.removeEventListener('resize', resize);
      if (S.io) S.io.disconnect();
      if (S.onVisibilityChange) document.removeEventListener('visibilitychange', S.onVisibilityChange);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
