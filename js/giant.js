/* ================= Carnívoro gigante (controlado por el jugador) ================= */
const input = {
  keys: new Set(), pointer: null,
  vector(a) { // teclado (WASD/flechas) o puntero pulsado
    const k = this.keys, x = k.has('r') - k.has('l'), y = k.has('d') - k.has('u');
    if (x || y) return { x, y };
    if (this.pointer) { const dx = this.pointer.x - a.x, dy = this.pointer.y - a.y; if (Math.hypot(dx, dy) > 8) return { x: dx, y: dy }; }
    return null;
  }
};
class Giant extends Animal {
  constructor(x, y) {
    super(x, y, CONFIG.giant);
    this.kind = 'giant'; this.chew = 0; this.kills = 0;
    this.states = Giant.STATES; this.setState('PLAYER');
  }
}
Giant.STATES = {
  PLAYER: { update(a, dt, w) {
    const v = input.vector(a);
    if (v) { a.steer(Math.atan2(v.y, v.x), dt); a.advance(a.cfg.speed, dt, w); }
    a.chew = Math.max(0, a.chew - dt);
    for (const h of w.herbGrid.query(a.x, a.y, a.radius + 20)) {
      if (h.dead || h.stateName === 'DEAD') continue;
      if (dist(a, h) <= a.radius + h.radius) { h.die('gigante'); a.chew = 0.35; a.kills++; }
    }
  } }
};
function spawnGiant(w) {
  if (w.giant) return;
  w.giant = new Giant(w.w / 2, w.h / 2); w.giantDone = true;
  w.banner = { text: '¡APARECE EL GIGANTE!', sub: 'Muévelo con WASD, flechas o arrastrando', t: 5 };
}
