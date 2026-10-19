// Pixel art generator (no dependencies). Run: node src/gen.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'out');

// ---------- palette ----------
const P = {
  line: '#1B2A49',
  cream: '#F6EBD0', creamHi: '#FFFAEB', creamSh: '#D8C49A',
  orange: '#E8643C', orangeHi: '#F58A5E', orangeSh: '#B8452A',
  flame: '#F0803C', yellow: '#FFD04A', white: '#FFF6D0',
  win: '#5EA8E0', winHi: '#BFE3FA', winSh: '#3C78B8',
  steel: '#4A5478', steelHi: '#8A93B5', steelSh: '#262E4A', noz: '#3A4466',
};

// ---------- canvas ----------
const cache = new Map();
const rgba = (c) => {
  if (typeof c !== 'string') return c;
  let v = cache.get(c);
  if (!v) {
    const h = c.slice(1);
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255];
    cache.set(c, v);
  }
  return v;
};

class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h * 4); }
  set(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const k = rgba(c), i = (y * this.w + x) * 4;
    this.d[i] = k[0]; this.d[i + 1] = k[1]; this.d[i + 2] = k[2]; this.d[i + 3] = k[3];
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  }
  has(x, y) { const p = this.get(x, y); return !!p && p[3] > 0; }
  fill(c) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.set(x, y, c); }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  disc(cx, cy, r, c) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.set(x, y, c);
  }
  blit(src, dx, dy) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const p = src.get(x, y);
        if (p[3] > 0) this.set(dx + x, dy + y, p);
      }
  }
  crop(x, y, w, h) { const c = new Canvas(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const p = this.get(x + i, y + j); if (p) c.set(i, j, p); } return c; }
  scale(n) {
    const c = new Canvas(this.w * n, this.h * n);
    for (let y = 0; y < c.h; y++)
      for (let x = 0; x < c.w; x++) c.set(x, y, this.get(Math.floor(x / n), Math.floor(y / n)));
    return c;
  }
}

function encodePng(cv) {
  const { w, h, d } = cv;
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) { raw[y * stride] = 0; Buffer.from(d.buffer, y * w * 4, w * 4).copy(raw, y * stride + 1); }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
    const td = Buffer.concat([Buffer.from(type), body]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const saved = [];
function save(name, cv, scales = [1, 4]) {
  for (const s of scales) {
    const dir = path.join(OUT, `${s}x`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${name}.png`), encodePng(s === 1 ? cv : cv.scale(s)));
  }
  saved.push(`${name} (${cv.w}x${cv.h})`);
}

const rng = (a) => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const fromRows = (rows, map) => {
  const cv = new Canvas(rows[0].length, rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (map[ch]) cv.set(x, y, map[ch]); }));
  return cv;
};

// ---------- dithered gradient ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const clamp01 = (v) => Math.max(0, Math.min(1, v));
function gradient(cv, stops) {
  for (let y = 0; y < cv.h; y++) {
    const t = (y + 0.5) / cv.h;
    let i = 0;
    while (i < stops.length - 1 && t >= stops[i + 1][0]) i++;
    const cur = stops[i], next = stops[Math.min(i + 1, stops.length - 1)];
    const f = next === cur ? 0 : clamp01((t - cur[0]) / (next[0] - cur[0]));
    const ff = clamp01((f - 0.25) / 0.5);
    for (let x = 0; x < cv.w; x++) {
      const thr = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      cv.set(x, y, ff > thr ? next[1] : cur[1]);
    }
  }
}

// ---------- rocket ----------
function makeRocket() {
  const W = 26, H = 48, ox = 1, oy = 2;
  const cv = new Canvas(W, H);
  const put = (x, y, c) => cv.set(x + ox, y + oy, c);
  const T = [1, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6];
  for (let y = 0; y <= 39; y++) {
    const hw = T[y] ?? 6;
    for (let x = 12 - hw; x <= 11 + hw; x++) {
      const left = x === 12 - hw, right = x >= 10 + hw;
      let c;
      if (y === 12) c = P.orange;
      else if (y === 13) c = P.orangeSh;
      else if (y < 12) c = left ? P.orangeHi : right ? P.orangeSh : P.orange;
      else c = left ? P.creamHi : right ? P.creamSh : P.cream;
      put(x, y, c);
    }
  }
  // fins
  const ext = { 28: 1, 29: 2, 30: 3, 31: 4, 38: 3, 39: 2, 40: 1 };
  for (let y = 28; y <= 40; y++) {
    const e = ext[y] ?? 4;
    for (let k = 1; k <= e; k++) {
      put(12 - 6 - k, y, k === e ? P.orangeHi : P.orange);
      put(11 + 6 + k, y, P.orangeSh);
    }
  }
  // nozzle
  const nz = [[40, 6], [41, 4], [42, 4], [43, 3]];
  for (const [y, hw] of nz) for (let x = 12 - hw; x <= 11 + hw; x++) put(x, y, x >= 10 + hw ? '#262E4A' : P.noz);
  // window
  cv.disc(12 + ox, 22 + oy, 4.3, P.line);
  cv.disc(12 + ox, 22 + oy, 3.3, P.win);
  for (let y = 18; y <= 26; y++) for (let x = 8; x <= 16; x++) {
    if ((x + 0.5 - 12) ** 2 + (y + 0.5 - 22) ** 2 <= 3.3 ** 2 && (x + 0.5 - 12) + (y + 0.5 - 22) > 2.2) put(x, y, P.winSh);
  }
  put(10, 21, P.winHi); put(10, 20, P.winHi); put(11, 19, P.winHi);
  // outline
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if (!cv.has(x, y) && (cv.has(x - 1, y) || cv.has(x + 1, y) || cv.has(x, y - 1) || cv.has(x, y + 1))) add.push([x, y]);
  add.forEach(([x, y]) => cv.set(x, y, P.line));
  return cv;
}

// ---------- flame (4 frames) ----------
function makeFlame(frame) {
  const len = [14, 18, 12, 16][frame], w = [3, 4, 3, 4][frame];
  const cv = new Canvas(14, 22);
  for (let y = 0; y < len; y++) {
    const tt = y / len;
    const hw = Math.max(y >= len - 1 ? 0 : 1, Math.round(w * Math.pow(1 - tt, 0.7)));
    for (let x = 7 - hw; x <= 6 + hw; x++) {
      const dx = Math.abs(x - 6.5);
      let c = P.flame;
      if (dx < hw * 0.65 && y < len * 0.8) c = P.yellow;
      if (dx < hw * 0.3 && y < len * 0.5) c = P.white;
      cv.set(x, y, c);
    }
  }
  return cv;
}

// ---------- launch pad ----------
function makePad() {
  const cv = new Canvas(64, 64);
  // tower
  for (let y = 4; y < 56; y++) {
    cv.set(0, y, P.steelHi); cv.set(1, y, P.steel);
    cv.set(10, y, P.steelHi); cv.set(11, y, P.steel);
  }
  for (let k = 0; k < 6; k++) {
    const y0 = 8 + k * 8;
    for (let d = 0; d < 8; d++) {
      const x = k % 2 === 0 ? 2 + d : 9 - d;
      cv.set(x, y0 + d, P.steel);
    }
    for (let x = 0; x < 12; x++) cv.set(x, y0, P.steelSh);
  }
  cv.rect(0, 2, 12, 2, P.steelSh);
  cv.disc(6, 1, 1.5, P.orange);
  // arm
  cv.rect(12, 24, 15, 2, P.steelHi);
  cv.rect(12, 26, 15, 2, P.steel);
  cv.rect(25, 22, 2, 8, P.steelSh);
  // platform
  cv.rect(0, 56, 64, 2, P.steelHi);
  cv.rect(0, 58, 64, 4, P.steel);
  cv.rect(0, 62, 64, 2, P.steelSh);
  for (let x = 0; x < 64; x += 8) cv.rect(x, 59, 4, 2, P.orange);
  for (let x = 4; x < 64; x += 8) cv.rect(x, 59, 4, 2, P.cream);
  return cv;
}

// ---------- clouds ----------
function drawCloud(cv, x, y, s, base, shade, hi) {
  const circles = [[0, 0, 5], [6, -2, 6], [13, 0, 5], [7, 2, 5], [-4, 2, 3], [18, 2, 3]];
  const mask = new Set();
  const key = (a, b) => `${a},${b}`;
  const limit = y + Math.round(4 * s);
  for (const [cx, cy, r] of circles) {
    const R = r * s, X = x + cx * s, Y = y + cy * s;
    for (let py = Math.floor(Y - R); py <= Math.ceil(Y + R); py++)
      for (let px = Math.floor(X - R); px <= Math.ceil(X + R); px++)
        if ((px + 0.5 - X) ** 2 + (py + 0.5 - Y) ** 2 <= R * R && py <= limit) mask.add(key(px, py));
  }
  for (const k of mask) {
    const [px, py] = k.split(',').map(Number);
    let c = base;
    if (!mask.has(key(px, py + 2))) c = shade;
    else if (!mask.has(key(px, py - 1)) || !mask.has(key(px - 1, py - 1))) c = hi;
    cv.set(px, py, c);
  }
}

// ---------- backgrounds ----------
function makeScroll(W = 90, H = 480) {
  const cv = new Canvas(W, H);
  gradient(cv, [
    [0.00, '#060A1F'], [0.10, '#0C1233'], [0.22, '#18235A'], [0.36, '#27458F'], [0.48, '#3F7CC8'],
    [0.60, '#6FB0EA'], [0.70, '#A9D8F5'], [0.78, '#F7D9A8'], [0.84, '#F7B55A'], [0.90, '#F0803C'],
    [0.96, '#C65A6E'], [1.00, '#5A3B7A'],
  ]);
  const r = rng(20261019);
  // stars
  for (let y = 0; y < 200; y++) for (let x = 0; x < W; x++) {
    if (r() < 0.04 * (1 - y / 200)) cv.set(x, y, r() < 0.2 ? '#BFE3FA' : r() < 0.3 ? P.yellow : P.white);
  }
  for (let i = 0; i < 7; i++) {
    const x = 4 + Math.floor(r() * (W - 8)), y = 4 + Math.floor(r() * 140);
    cv.set(x, y, P.white); cv.set(x - 1, y, '#BFE3FA'); cv.set(x + 1, y, '#BFE3FA'); cv.set(x, y - 1, '#BFE3FA'); cv.set(x, y + 1, '#BFE3FA');
  }
  // moon
  cv.disc(66, 40, 10, '#FFF1C8');
  for (let y = 28; y < 52; y++) for (let x = 54; x < 80; x++)
    if ((x + 0.5 - 66) ** 2 + (y + 0.5 - 40) ** 2 <= 100 && (x - 66) + (y - 40) > 6) cv.set(x, y, '#E8D5A0');
  cv.disc(62, 37, 2, '#E8D5A0'); cv.disc(69, 44, 1.5, '#E8D5A0'); cv.disc(70, 35, 1, '#E8D5A0');
  // ringed planet
  const ring = [];
  for (let y = 85; y <= 105; y++) for (let x = 2; x <= 40; x++) {
    const v = ((x + 0.5 - 21) / 14) ** 2 + ((y + 0.5 - 95) / 3) ** 2;
    if (v >= 0.7 && v <= 1.15) ring.push([x, y]);
  }
  ring.filter(([, y]) => y < 95).forEach(([x, y]) => cv.set(x, y, '#C65A6E'));
  cv.disc(21, 95, 6.5, P.flame);
  for (let y = 88; y < 102; y++) for (let x = 14; x < 28; x++)
    if ((x + 0.5 - 21) ** 2 + (y + 0.5 - 95) ** 2 <= 6.5 ** 2 && (x - 21) + (y - 95) > 3) cv.set(x, y, P.orangeSh);
  cv.set(18, 92, P.yellow); cv.set(19, 91, P.yellow);
  ring.filter(([, y]) => y >= 95).forEach(([x, y]) => cv.set(x, y, '#F7B8A0'));
  // clouds (sky)
  [[10, 200, 1], [55, 235, 1.2], [20, 285, 1.4], [60, 320, 1], [35, 350, 1.2]]
    .forEach(([x, y, s]) => drawCloud(cv, x, y, s, '#FFFFFF', '#BFD8F0', '#FFFFFF'));
  // sunset clouds
  [[15, 395, 1], [58, 410, 1.1]]
    .forEach(([x, y, s]) => drawCloud(cv, x, y, s, '#F7B8A0', '#D98890', '#FFD9C0'));
  // sun
  cv.disc(45, H - 40, 11, '#FFD680');
  cv.disc(45, H - 40, 9, '#FFF1C8');
  // far hills
  for (let x = 0; x < W; x++) {
    const top = H - 30 + Math.round(3 * Math.sin(x * 0.12) + 2 * Math.sin(x * 0.31));
    for (let y = top; y < H; y++) cv.set(x, y, '#4B3570');
  }
  // near ground + buildings
  cv.rect(0, H - 14, W, 14, P.line);
  let x = 0;
  while (x < W) {
    const w = 5 + Math.floor(r() * 5), h = 4 + Math.floor(r() * 11);
    cv.rect(x, H - 14 - h, w, h, P.line);
    for (let wy = H - 14 - h + 2; wy < H - 15; wy += 3)
      for (let wx = x + 1; wx < x + w - 1; wx += 2) if (r() < 0.4) cv.set(wx, wy, P.yellow);
    x += w + (r() < 0.4 ? 1 : 0);
  }
  return cv;
}

// ---------- UI parts ----------
function makeFuse(burnt) {
  const cv = new Canvas(8, 6);
  const [a, b] = burnt ? ['#3A2F2A', '#6A5A50'] : ['#C8A878', '#9A7B50'];
  for (let x = 0; x < 8; x++) { cv.set(x, 2, a); cv.set(x, 3, x % 4 < 2 ? b : a); }
  cv.set(3, 1, b); cv.set(7, 4, b);
  return cv;
}
const sparkMap = { o: P.flame, y: P.yellow, w: P.white };
const sparks = [
  fromRows(['...yy...', '...yy...', '.o.ww.o.', 'yyywwyyy', 'yyywwyyy', '.o.ww.o.', '...yy...', '...yy...'], sparkMap),
  fromRows(['........', '........', '...oo...', '..oyyo..', '..oyyo..', '...oo...', '........', '........'], sparkMap),
  fromRows(['o......o', '.y....y.', '..y..y..', '...ww...', '...ww...', '..y..y..', '.y....y.', 'o......o'], sparkMap),
];
function makeKnob() {
  const cv = new Canvas(16, 16);
  cv.disc(8, 8, 8, P.line);
  cv.disc(8, 8, 7, P.orange);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if ((x + 0.5 - 8) ** 2 + (y + 0.5 - 8) ** 2 > 6 ** 2) continue;
    const s = (x - 8) + (y - 8);
    if (s < -5) cv.set(x, y, P.orangeHi);
    else if (s > 5) cv.set(x, y, P.orangeSh);
  }
  const cols = { 6: [5, 10], 7: [6, 9], 8: [6, 9], 9: [7, 8], 10: [7, 8] };
  for (const [x, [y0, y1]] of Object.entries(cols)) for (let y = y0; y <= y1; y++) cv.set(Number(x), y, P.cream);
  return cv;
}

// ---------- build ----------
const rocket = makeRocket();
const flames = [0, 1, 2, 3].map(makeFlame);
const pad = makePad();
const scroll = makeScroll();
const H = scroll.h;
const bgGround = scroll.crop(0, H - 160, 90, 160);
const bgSky = scroll.crop(0, 150, 90, 160);
const bgSpace = scroll.crop(0, 0, 90, 160);

save('rocket', rocket);
flames.forEach((f, i) => save(`flame_${i}`, f));
save('launchpad', pad);
save('bg_scroll', scroll, [1, 2]);
save('bg_ground', bgGround);
save('bg_sky', bgSky);
save('bg_space', bgSpace);
sparks.forEach((s, i) => save(`spark_${i}`, s));
save('fuse', makeFuse(false));
save('fuse_burnt', makeFuse(true));
const knob = makeKnob();
save('knob', knob);

// app icon 64 -> 1024
const icon = new Canvas(64, 64);
gradient(icon, [[0, '#0C1233'], [0.35, '#27458F'], [0.7, '#F0803C'], [1, '#FFD04A']]);
const ir = rng(7);
for (let i = 0; i < 18; i++) icon.set(Math.floor(ir() * 64), Math.floor(ir() * 28), P.white);
icon.blit(rocket, 19, 0);
icon.blit(flames[2], 25, 46);
save('app_icon', icon, [1, 16]);

// preview sheet
const GAP = 6;
const sheet = new Canvas(3 * 90 + 4 * GAP, 160 + 3 * GAP + 66);
sheet.fill('#2B3050');
const cols = [GAP, 90 + 2 * GAP, 180 + 3 * GAP];
sheet.blit(bgGround, cols[0], GAP);
sheet.blit(bgSky, cols[1], GAP);
sheet.blit(bgSpace, cols[2], GAP);
sheet.blit(pad, cols[0] + 13, GAP + 82);
sheet.blit(rocket, cols[0] + 40, GAP + 91);
sheet.blit(rocket, cols[1] + 32, GAP + 50);
sheet.blit(flames[1], cols[1] + 38, GAP + 50 + 46);
sheet.blit(rocket, cols[2] + 32, GAP + 30);
sheet.blit(flames[3], cols[2] + 38, GAP + 30 + 46);
let sx = GAP;
const sy = 160 + 2 * GAP;
for (const f of flames) { sheet.blit(f, sx, sy); sx += 16; }
for (const s of sparks) { sheet.blit(s, sx, sy); sx += 10; }
sheet.blit(makeFuse(false), sx, sy); sx += 10;
sheet.blit(makeFuse(true), sx, sy); sx += 10;
sheet.blit(knob, sx, sy); sx += 18;
sheet.blit(icon, sx, sy);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'preview.png'), encodePng(sheet.scale(4)));

console.log(`wrote ${saved.length} assets + preview.png to ${OUT}`);
console.log(saved.join('\n'));
