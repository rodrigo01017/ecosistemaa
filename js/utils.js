/* ================= Utilidades matemáticas ================= */
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleDiff = (to, from) => { let d = (to - from) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
/** Convierte puntos de vida en radio visual (reutilizable por todos los seres vivos). */
const hpToRadius = (hp, maxHp, minR, maxR) => minR + (maxR - minR) * Math.sqrt(clamp(hp / maxHp, 0, 1));
/** Mezcla dos colores hex de 6 dígitos (t = 0..1). */
const mixColor = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };

/* ================= Rejilla espacial (sustituible por quadtree) ================= */
class SpatialGrid {
  constructor(cell = 80) { this.cell = cell; this.map = new Map(); }
  clear() { this.map.clear(); }
  _key(cx, cy) { return cx * 73856093 ^ cy * 19349663; }
  insert(e) {
    const k = this._key(Math.floor(e.x / this.cell), Math.floor(e.y / this.cell));
    (this.map.get(k) || this.map.set(k, []).get(k)).push(e);
  }
  query(x, y, r) {
    const out = [], c = this.cell;
    for (let cx = Math.floor((x - r) / c); cx <= Math.floor((x + r) / c); cx++)
      for (let cy = Math.floor((y - r) / c); cy <= Math.floor((y + r) / c); cy++) {
        const l = this.map.get(this._key(cx, cy));
        if (l) for (const e of l) out.push(e);
      }
    return out;
  }
}
