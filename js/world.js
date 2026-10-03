/* ================= Spawn configurable ================= */
class Spawner {
  constructor() {
    this.rules = [
      { key: 'plants', cfg: CONFIG.plant, make: (x, y) => new Plant(x, y), t: CONFIG.plant.delay },
      { key: 'herbs', cfg: CONFIG.herb, make: (x, y) => new Herbivore(x, y), t: CONFIG.herb.delay },
      { key: 'carns', cfg: CONFIG.carn, make: (x, y) => new Carnivore(x, y), t: CONFIG.carn.delay }
    ];
  }
  position(w, list) { // posición aleatoria evitando solapamiento exacto
    const s = CONFIG.world.minSeparation;
    for (let i = 0; i < CONFIG.world.spawnTries; i++) {
      const p = { x: rand(20, w.w - 20), y: rand(20, w.h - 20) };
      if (!list.some(o => Math.abs(o.x - p.x) < s && Math.abs(o.y - p.y) < s)) return p;
    }
    return null;
  }
  update(dt, w) {
    for (const r of this.rules) {
      r.t -= dt;
      if (r.t > 0) continue;
      r.t = r.cfg.interval;
      if (w[r.key].length >= r.cfg.max || Math.random() > r.cfg.chance) continue;
      const p = this.position(w, w[r.key]);
      if (p) w[r.key].push(r.make(p.x, p.y));
    }
  }
}

/* ================= Motor / mundo ================= */
class World {
  constructor() { this.w = 800; this.h = 600; this.theme = 'parque'; this.reset(); }
  reset() {
    this.plants = []; this.herbs = []; this.carns = []; this.time = 0;
    this.giant = null; this.giantDone = false; this.banner = null; this.fx = []; this.items = []; this.itemTimer = 0;
    this.plantGrid = new SpatialGrid(); this.herbGrid = new SpatialGrid();
    this.spawner = new Spawner();
  }
  /** Pastillas del modo ciudad: aparecen, caducan y desaparecen al ser tomadas. */
  updateItems(dt) {
    const D = CONFIG.drugs;
    if (this.theme !== 'ciudad') { this.items = []; return; }
    this.itemTimer -= dt;
    if (this.itemTimer <= 0) {
      this.itemTimer = D.interval;
      if (this.items.length < D.max && Math.random() < D.chance)
        this.items.push({ x: rand(30, this.w - 30), y: rand(90, this.h - 90), type: D.types[Math.floor(Math.random() * D.types.length)], age: 0 });
    }
    for (const it of this.items) it.age += dt;
    this.items = this.items.filter(it => !it.taken && it.age < D.life);
  }
  /** Partículas decorativas (corazones, estrellas, destellos). */
  addFx(type, x, y) {
    const mk = (txt, n, sp, life, size) => { for (let i = 0; i < n; i++) { const a = rand(0, TAU), v = rand(0.3, 1) * sp; this.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.3, t: 0, life, txt, size }); } };
    if (type === 'heart') this.fx.push({ x, y, vx: 0, vy: -35, t: 0, life: 1.2, txt: '💖', size: 20 });
    else if (type === 'ghost') this.fx.push({ x, y, vx: 0, vy: -30, t: 0, life: 1.6, txt: '👻', size: 26 });
    else if (type === 'pop') mk('⭐', 6, 90, 0.7, 14);
    else mk('✨', 3, 40, 0.6, 12);
  }
  step(dt) {
    this.time += dt;
    this.spawner.update(dt, this);
    if (!this.giant && !this.giantDone && this.time >= CONFIG.giant.appearAt) spawnGiant(this);
    if (this.banner && (this.banner.t -= dt) <= 0) this.banner = null;
    this.updateItems(dt);
    this.plantGrid.clear(); this.herbGrid.clear();
    for (const p of this.plants) { p.update(dt); this.plantGrid.insert(p); }
    for (const h of this.herbs) if (h.stateName !== 'DEAD') this.herbGrid.insert(h);
    for (const h of this.herbs) h.update(dt, this);
    for (const c of this.carns) c.update(dt, this);
    if (this.giant) this.giant.update(dt, this);
    for (const e of [...this.herbs, ...this.carns]) if (e.stateName === 'DEAD' && !e.fxDone) { e.fxDone = true; this.addFx(e.cause === 'vejez' ? 'ghost' : 'pop', e.x, e.y); }
    for (const p of this.plants) if (p.dead) this.addFx('spark', p.x, p.y);
    for (const f of this.fx) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; }
    this.fx = this.fx.filter(f => f.t < f.life);
    const alive = (e) => !e.dead && !(e.stateName === 'DEAD' && e.deathTimer >= CONFIG.death.time);
    this.plants = this.plants.filter(e => !e.dead);
    this.herbs = this.herbs.filter(alive);
    this.carns = this.carns.filter(alive);
  }
}
