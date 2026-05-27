// Hero background renderer — isolines, Voronoï parcels, topographic relief
// Vanilla canvas. Exposes window.HeroBg = { init, setMode, setMouse, setTheme, setOptions }
(function () {
  // ===== Perlin-ish value noise =====
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

  // FBM with 4 octaves
  function fbm(x, y, z) {
    return noise(x + z * 0.6, y - z * 0.4) * 0.55
         + noise(x * 2.07 + z * 0.4, y * 2.07 + 13.2) * 0.27
         + noise(x * 4.13 + 7.3, y * 4.13 + z * 0.2) * 0.13
         + noise(x * 8.31, y * 8.31 + 5.1) * 0.05;
  }

  // ===== State =====
  const S = {
    canvas: null, ctx: null,
    w: 0, h: 0, dpr: 1,
    cell: 7, gw: 0, gh: 0, field: null,
    mode: 'isolines',
    levels: 16,
    speed: 1,
    accentDark: '#5fc6a8', bgDark: '#0a2418',
    accentLight: '#1f6b50', bgLight: '#f1f5f1',
    isDark: true,
    mx: -9999, my: -9999,    // current mouse (canvas px)
    tmx: -9999, tmy: -9999,  // target mouse (smoothed)
    warpR: 240, warpA: 90,
    voronoiPts: null, voronoiCount: 110,
    raf: 0, lastT: 0,
    running: false,
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
    initVoronoi();
  }

  function initVoronoi() {
    const pts = [];
    const n = S.voronoiCount;
    // Poisson-ish jittered grid for nice parcel shapes
    const cols = Math.ceil(Math.sqrt(n * S.w / S.h));
    const rows = Math.ceil(n / cols);
    const cw = S.w / cols, ch = S.h / rows;
    let id = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jx = (Math.sin(id * 12.9898) * 43758.5453) % 1;
        const jy = (Math.sin(id * 78.233) * 12345.678) % 1;
        const x = (c + 0.5 + jx * 0.85) * cw;
        const y = (r + 0.5 + jy * 0.85) * ch;
        pts.push({
          x, y, x0: x, y0: y,
          phase: id * 0.37,
          ampX: 14 + 22 * Math.abs(Math.sin(id * 3.1)),
          ampY: 14 + 22 * Math.abs(Math.cos(id * 2.7)),
          freq: 0.18 + 0.08 * ((id * 7) % 3) / 2,
          // for shading
          tone: 0.4 + 0.6 * ((Math.sin(id * 1.7) + 1) / 2),
        });
        id++;
      }
    }
    S.voronoiPts = pts;
  }

  // ===== Mouse warp =====
  function warpPoint(wx, wy) {
    const dx = wx - S.mx, dy = wy - S.my;
    const d2 = dx * dx + dy * dy;
    const r2 = S.warpR * S.warpR;
    if (d2 >= r2 || d2 < 1) return [wx, wy];
    const d = Math.sqrt(d2);
    const f = 1 - d / S.warpR;
    const force = f * f * S.warpA;
    return [wx + dx / d * force, wy + dy / d * force];
  }

  // ===== Field computation =====
  function computeField(t) {
    const { gw, gh, cell, field } = S;
    const sx = 0.0024, sy = 0.0024;
    // breathe — slow scale modulation
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

  // ===== Marching squares =====
  function emitSegments(idx, tl, tr, br, bl, th, out, x, y, sw, sh) {
    // unit-cell edge crossings (0..1)
    let topT, rightT, botT, leftT;
    if (idx & 1) {
      if (!(idx & 2)) topT = (th - tl) / (tr - tl);
      if (!(idx & 8)) leftT = (th - tl) / (bl - tl);
    } else {
      if (idx & 2) topT = (th - tl) / (tr - tl);
      if (idx & 8) leftT = (th - tl) / (bl - tl);
    }
    if (idx & 2) {
      if (!(idx & 4)) rightT = (th - tr) / (br - tr);
    } else {
      if (idx & 4) rightT = (th - tr) / (br - tr);
    }
    if (idx & 4) {
      if (!(idx & 8)) botT = (th - bl) / (br - bl);
    } else {
      if (idx & 8) botT = (th - bl) / (br - bl);
    }
    const tx = x + (topT || 0) * sw, ty = y;
    const rx = x + sw, ry = y + (rightT || 0) * sh;
    const bx = x + (botT || 0) * sw, by = y + sh;
    const lx = x, ly = y + (leftT || 0) * sh;
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

  // ===== Color helpers =====
  function hexToRgb(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(rgb, a) { return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; }
  function mix(a, b, t) { return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }

  function palette() {
    const accent = hexToRgb(S.isDark ? S.accentDark : S.accentLight);
    const bg = hexToRgb(S.isDark ? S.bgDark : S.bgLight);
    return { accent, bg };
  }

  // ===== Modes =====
  function drawIsolines(opts = {}) {
    const { ctx, w, h } = S;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    const { accent } = palette();
    // soft radial vignette (very subtle)
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    grad.addColorStop(0, rgba(accent, 0.05));
    grad.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const levels = S.levels;
    const lo = -0.7, hi = 0.7;
    for (let i = 0; i < levels; i++) {
      const t = i / (levels - 1);
      const v = lo + t * (hi - lo);
      const segs = gatherIsoline(v);
      const major = (i % 5 === 0);
      // alpha: stronger near 0, softer at extremes; majors a touch brighter
      const cur = 1 - Math.abs(t - 0.5) * 1.4;
      const alpha = Math.max(0.05, cur * (major ? 0.55 : 0.32)) * (S.isDark ? 1 : 0.95);
      const width = major ? 1.1 : 0.55;
      strokeSegs(segs, rgba(accent, 1), width, alpha);
    }
    ctx.globalAlpha = 1;
  }

  function drawTopographic() {
    const { ctx, w, h, gw, gh, field } = S;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    const { accent, bg } = palette();

    // ---- Hill-shading: fill bands between levels with subtle tonal variation ----
    // Use an offscreen low-res canvas for the hillshade and stretch
    if (!S.shadeCanvas || S.shadeCanvas.width !== gw || S.shadeCanvas.height !== gh) {
      S.shadeCanvas = document.createElement('canvas');
      S.shadeCanvas.width = gw;
      S.shadeCanvas.height = gh;
      S.shadeCtx = S.shadeCanvas.getContext('2d');
      S.shadeImg = S.shadeCtx.createImageData(gw, gh);
    }
    const img = S.shadeImg;
    const data = img.data;
    // light direction (top-left)
    const lx = -0.6, ly = -0.6, lz = 0.55;
    const nlen = Math.sqrt(lx*lx + ly*ly + lz*lz);
    const lxn = lx / nlen, lyn = ly / nlen, lzn = lz / nlen;
    const k = S.isDark ? 1 : -1;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = y * gw + x;
        const v = field[i];
        // gradient via finite differences
        const vx = field[i + (x < gw - 1 ? 1 : 0)] - field[i - (x > 0 ? 1 : 0)];
        const vy = field[i + (y < gh - 1 ? gw : 0)] - field[i - (y > 0 ? gw : 0)];
        // normal = (-dx, -dy, 1), then dot with light
        const nlx = -vx * 5, nly = -vy * 5, nlz = 1;
        const nl = Math.sqrt(nlx*nlx + nly*nly + nlz*nlz);
        let shade = (nlx * lxn + nly * lyn + nlz * lzn) / nl;
        shade = Math.max(0, Math.min(1, shade * 0.5 + 0.5));
        // elevation tint
        const elev = (v + 0.7) / 1.4; // 0..1
        const t = elev * 0.55 + shade * 0.45;
        // blend bg -> accent by t, dampened
        const mixT = (t - 0.5) * 0.35 + 0.5; // squash
        const col = mix(bg, accent, mixT * (S.isDark ? 0.55 : 0.35));
        const idx = i * 4;
        data[idx] = col[0];
        data[idx + 1] = col[1];
        data[idx + 2] = col[2];
        data[idx + 3] = 255;
      }
    }
    S.shadeCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = S.isDark ? 0.75 : 0.55;
    ctx.drawImage(S.shadeCanvas, 0, 0, w, h);
    ctx.globalAlpha = 1;

    // ---- Isolines over the relief, thinner ----
    const levels = S.levels;
    const lo = -0.7, hi = 0.7;
    for (let i = 0; i < levels; i++) {
      const t = i / (levels - 1);
      const v = lo + t * (hi - lo);
      const segs = gatherIsoline(v);
      const major = (i % 5 === 0);
      const alpha = (major ? 0.6 : 0.3) * (S.isDark ? 1 : 0.85);
      const width = major ? 1.0 : 0.45;
      strokeSegs(segs, rgba(S.isDark ? [255,255,255] : [10, 40, 28], 1), width, alpha);
    }
    ctx.globalAlpha = 1;
  }

  function drawVoronoi(t) {
    const { ctx, w, h } = S;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    const { accent, bg } = palette();

    // Update point positions (breathing) + cursor warp
    const pts = S.voronoiPts;
    const flatPts = new Float64Array(pts.length * 2);
    const time = t * 0.00012;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      let x = p.x0 + Math.sin(time * p.freq + p.phase) * p.ampX;
      let y = p.y0 + Math.cos(time * p.freq * 1.1 + p.phase * 1.3) * p.ampY;
      // cursor warp — push away
      const dx = x - S.mx, dy = y - S.my;
      const d2 = dx*dx + dy*dy;
      const r = S.warpR * 1.1;
      if (d2 < r * r && d2 > 1) {
        const d = Math.sqrt(d2);
        const f = 1 - d / r;
        const force = f * f * 60;
        x += dx / d * force;
        y += dy / d * force;
      }
      p.x = x; p.y = y;
      flatPts[i * 2] = x;
      flatPts[i * 2 + 1] = y;
    }

    if (!window.d3 || !window.d3.Delaunay) return;
    const delaunay = window.d3.Delaunay.from(pts, p => p.x, p => p.y);
    const voronoi = delaunay.voronoi([0, 0, w, h]);

    // Fills — subtle tonal variation per cell (very faint)
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const tone = p.tone; // 0..1
      // distance-from-center bias to give a hint of focus
      const cx = w * 0.5, cy = h * 0.5;
      const dist = Math.hypot(p.x - cx, p.y - cy) / Math.hypot(cx, cy);
      const radial = 1 - Math.min(1, dist);
      const a = (S.isDark ? 0.045 : 0.06) * (0.4 + tone * 0.6) * (0.5 + radial * 0.5);
      ctx.fillStyle = rgba(accent, a);
      ctx.beginPath();
      voronoi.renderCell(i, ctx);
      ctx.fill();
    }

    // Edges
    ctx.strokeStyle = rgba(accent, S.isDark ? 0.5 : 0.45);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    voronoi.render(ctx);
    ctx.stroke();

    // Site dots — tiny
    ctx.fillStyle = rgba(accent, S.isDark ? 0.9 : 0.7);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // A few highlighted "data nodes" — small ringed dots
    ctx.strokeStyle = rgba(accent, 0.85);
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i += 11) {
      const p = pts[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 + Math.sin(time * 1.4 + i) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // ===== Loop =====
  function tick(now) {
    if (!S.running) return;
    // smooth mouse
    S.mx = S.mx === -9999 ? S.tmx : S.mx + (S.tmx - S.mx) * 0.18;
    S.my = S.my === -9999 ? S.tmy : S.my + (S.tmy - S.my) * 0.18;

    const t = now;
    if (S.mode === 'voronoi') {
      drawVoronoi(t * S.speed);
    } else {
      computeField(t * S.speed);
      if (S.mode === 'topographic') drawTopographic();
      else drawIsolines();
    }
    S.raf = requestAnimationFrame(tick);
  }

  // ===== Public API =====
  window.HeroBg = {
    init(canvas, opts = {}) {
      S.canvas = canvas;
      S.ctx = canvas.getContext('2d');
      Object.assign(S, opts);
      resize();
      window.addEventListener('resize', resize);
      S.running = true;
      S.raf = requestAnimationFrame(tick);
    },
    setMode(m) {
      S.mode = m;
      if (m === 'voronoi') initVoronoi();
    },
    setMouse(x, y) {
      S.tmx = x; S.tmy = y;
    },
    leaveMouse() {
      S.tmx = -9999; S.tmy = -9999;
      S.mx = -9999; S.my = -9999;
    },
    setTheme(isDark) { S.isDark = isDark; },
    setOptions(o) {
      if ('levels' in o) S.levels = o.levels;
      if ('warpR' in o) S.warpR = o.warpR;
      if ('warpA' in o) S.warpA = o.warpA;
      if ('speed' in o) S.speed = o.speed;
      if ('voronoiCount' in o && o.voronoiCount !== S.voronoiCount) {
        S.voronoiCount = o.voronoiCount;
        initVoronoi();
      }
      if ('accentDark' in o) S.accentDark = o.accentDark;
      if ('accentLight' in o) S.accentLight = o.accentLight;
      if ('bgDark' in o) S.bgDark = o.bgDark;
      if ('bgLight' in o) S.bgLight = o.bgLight;
    },
    destroy() {
      S.running = false;
      cancelAnimationFrame(S.raf);
      window.removeEventListener('resize', resize);
    }
  };
})();
