/* ================= Entidades ================= */
class Entity {
  constructor(x, y, cfg) {
    this.x = x; this.y = y; this.cfg = cfg;
    this.maxHp = cfg.maxHp; this.hp = cfg.startHp;
    this.age = 0; this.dead = false;
  }
  get radius() { return hpToRadius(this.hp, this.maxHp, this.cfg.minR, this.cfg.maxR) * (this.scaleFx || 1); }
  heal(n) { this.hp = clamp(this.hp + n, 0, this.maxHp); }
}

class Plant extends Entity {
  constructor(x, y) {
    super(x, y, CONFIG.plant);
    this.claimedBy = null; this.eaten = 0; this.seed = rand(0, TAU); // eaten: progreso 0..1 de ser comida
  }
  update(dt) {
    this.age += dt;
    if (!this.claimedBy) this.heal(this.cfg.growth * dt); // crece (más HP = más grande)
  }
}

class Animal extends Entity {
  constructor(x, y, cfg) {
    super(x, y, cfg);
    this.heading = rand(0, TAU); this.wanderHeading = this.heading; this.wanderTimer = 0;
    this.target = null; this.frozen = false; this.scanTimer = rand(0, cfg.scanEvery);
    this.stateName = ''; this.stateTime = 0; this.deathTimer = 0; this.cause = null;
    this.high = null; this.scaleFx = 1; // efecto de pastilla activo y escala por efecto
  }
  /* --- máquina de estados: cada estado = {enter, update, exit} --- */
  setState(name) {
    const s = this.states[this.stateName]; if (s && s.exit) s.exit(this);
    this.stateName = name; this.stateTime = 0;
    const n = this.states[name]; if (n && n.enter) n.enter(this);
  }
  update(dt, world) {
    this.age += dt; this.stateTime += dt;
    if (this.stateName === 'DEAD') { this.deathTimer += dt; return; }
    this.scaleFx += ((this.high && this.high.type === 'verde' ? 1.5 : 1) - this.scaleFx) * Math.min(1, 3 * dt);
    if (this.high) { // efectos de las pastillas
      const h = this.high; h.t += dt;
      if (h.t >= CONFIG.drugs.duration) this.high = null;
      else if (h.type === 'seta') { this.heading += Math.sin(this.age * 7) * 2.5 * dt; if (Math.random() < dt * 1.5) world.addFx('heart', this.x, this.y - this.radius); } // tambaleo y amor
      else if (h.type === 'rosa') this.heading += rand(-1, 1) * 6 * dt;                                                                                      // hiperactivo
      else if (h.type === 'azul' && h.t > 1.5) return;                                                                                                       // se duerme
    }
    if (this.frozen) return; // inmovilizado por un ataque
    this.scanTimer -= dt;
    this.states[this.stateName].update(this, dt, world);
  }
  die(cause) { if (this.stateName !== 'DEAD') { this.cause = cause; this.setState('DEAD'); } }
  steer(desired, dt) { // giro suave con velocidad angular limitada
    const d = angleDiff(desired, this.heading), m = this.cfg.turn * dt;
    this.heading += clamp(d, -m, m);
  }
  advance(speed, dt, world) { // moverse cuesta HP según distancia recorrida
    const step = speed * dt * (this.high && CONFIG.drugs.speed[this.high.type] || 1);
    this.x = clamp(this.x + Math.cos(this.heading) * step, 0, world.w);
    this.y = clamp(this.y + Math.sin(this.heading) * step, 0, world.h);
    this.hp = Math.max(0, this.hp - this.cfg.moveCost * step);
    if (this.hp <= 0) this.die('hambre');
  }
  /** Modo ciudad: va hacia la pastilla más cercana y la toma al llegar. */
  seekPill(dt, w) {
    if (this.high || this.kind === 'giant' || !w.items.length) return false;
    let best = null, bd = CONFIG.drugs.range;
    for (const it of w.items) { if (it.taken) continue; const d = dist(this, it); if (d < bd) { bd = d; best = it; } }
    if (!best) return false;
    if (bd <= this.radius + 6) { best.taken = true; this.high = { type: best.type, t: 0 }; w.addFx('spark', this.x, this.y); return false; }
    this.steer(this.toward(best), dt); this.advance(this.cfg.speed, dt, w); return true;
  }
  wander(dt, world) { // deambular: rumbo objetivo cambia cada 1-3 s, con evasión de bordes
    if (this.seekPill(dt, world)) return; // atraído por pastillas (modo ciudad)
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = rand(...this.cfg.wanderEvery);
      this.wanderHeading = this.heading + rand(-1, 1) * this.cfg.wanderJitter;
    }
    const m = CONFIG.world.margin;
    if (this.x < m || this.y < m || this.x > world.w - m || this.y > world.h - m) {
      this.wanderHeading = Math.atan2(world.h / 2 - this.y + rand(-40, 40), world.w / 2 - this.x + rand(-40, 40));
      this.wanderTimer = 1;
    }
    this.steer(this.wanderHeading, dt);
    this.advance(this.cfg.speed, dt, world);
  }
  toward(t) { return Math.atan2(t.y - this.y, t.x - this.x); }
}

class Herbivore extends Animal {
  constructor(x, y) {
    super(x, y, CONFIG.herb);
    this.kind = 'herb'; this.reproTimer = rand(0, CONFIG.herb.reproCooldown);
    this.states = Herbivore.STATES; this.setState('WANDER');
  }
  update(dt, w) { this.reproTimer -= dt; super.update(dt, w); }
  /** Factor de crecimiento por edad: de cría (babyScale) a adulto (adultScale). */
  get growth() { const c = this.cfg; return c.babyScale + (c.adultScale - c.babyScale) * clamp(this.age / c.growTime, 0, 1); }
  get radius() { return super.radius * this.growth; }
  /** Se reproduce si tiene suficiente HP, pasó el cooldown y no se supera el máximo. */
  tryReproduce(w) {
    const c = this.cfg;
    if (this.reproTimer > 0 || this.hp < c.reproHp || this.age < c.growTime || w.herbs.length >= c.max) return; // solo los adultos se reproducen
    this.hp -= c.reproCost; this.reproTimer = c.reproCooldown;
    const baby = new Herbivore(clamp(this.x + rand(-20, 20), 10, w.w - 10), clamp(this.y + rand(-20, 20), 10, w.h - 10));
    baby.hp = c.childHp; w.herbs.push(baby); w.addFx('heart', this.x, this.y - this.radius);
  }
  release() { if (this.target && !this.target.dead) { this.target.claimedBy = null; this.target.eaten = 0; } this.target = null; }
}
Herbivore.STATES = {
  IDLE: { update(a, dt, w) { if (a.stateTime >= a.cfg.idleTime) { a.tryReproduce(w); a.setState('WANDER'); } } },
  WANDER: { update(a, dt, w) {
    if (a.frozen) return;
    a.wander(dt, w);
    if (a.scanTimer <= 0) { // SEEKING: detección circular por distancia real
      a.scanTimer = a.cfg.scanEvery;
      let best = null, bd = a.cfg.detect;
      for (const p of w.plantGrid.query(a.x, a.y, a.cfg.detect)) {
        if (p.dead || p.claimedBy || p.hp < a.cfg.minEdibleHp) continue;
        const d = dist(a, p); if (d < bd) { bd = d; best = p; }
      }
      if (best) { best.claimedBy = a; a.target = best; a.setState('MOVING_TO_PLANT'); }
    }
  } },
  MOVING_TO_PLANT: { update(a, dt, w) {
    const t = a.target;
    if (!t || t.dead) { a.target = null; return a.setState('WANDER'); }
    a.steer(a.toward(t), dt); a.advance(a.cfg.seekSpeed, dt, w);
    if (dist(a, t) <= a.radius + t.radius + a.cfg.eatReach) a.setState('EATING');
  } },
  EATING: { update(a, dt) { // quieto; la planta se encoge mientras la comen
    const t = a.target; t.eaten = a.stateTime / a.cfg.eatTime;
    a.heading += angleDiff(a.toward(t), a.heading) * Math.min(1, 8 * dt); // mira a la planta mientras come
    if (a.stateTime >= a.cfg.eatTime) {
      a.heal(t.hp * a.cfg.eatGain); t.dead = true; a.target = null; a.setState('IDLE');
    }
  }, exit(a) { a.release(); } },
  DEAD: { enter(a) { a.release(); } }
};

class Carnivore extends Animal {
  constructor(x, y) {
    super(x, y, CONFIG.carn);
    this.kind = 'carn'; this.fov = CONFIG.carn.fov * Math.PI / 180;
    this.lifespan = CONFIG.carn.lifespan * rand(1 - CONFIG.carn.lifespanVar, 1 + CONFIG.carn.lifespanVar);
    this.states = Carnivore.STATES; this.setState('WANDER');
  }
  /** Envejecimiento: 0 = joven, 1 = final de su vida. */
  get aging() { const c = this.cfg; return clamp((this.age / this.lifespan - c.oldFrom) / (1 - c.oldFrom), 0, 1); }
  update(dt, w) {
    super.update(dt, w);
    if (this.stateName !== 'DEAD' && this.age >= this.lifespan) this.die('vejez'); // muerte natural
  }
  advance(speed, dt, w) { super.advance(speed * (1 - this.aging * (1 - this.cfg.oldSpeed)), dt, w); } // los viejos van más lentos
  /** Cono: distancia + ángulo entre rumbo y dirección hacia la presa (±fov/2). */
  canSee(p) {
    if (p.dead || p.frozen) return false;
    const d = dist(this, p); if (d > this.cfg.range) return false;
    return Math.abs(angleDiff(this.toward(p), this.heading)) <= this.fov / 2;
  }
  scan(w) {
    if (this.high && this.high.type === 'seta') return null; // en paz y amor: no caza
    let best = null, bd = Infinity;
    for (const h of w.herbGrid.query(this.x, this.y, this.cfg.range)) {
      if (!this.canSee(h)) continue;
      const d = dist(this, h); if (d < bd) { bd = d; best = h; }
    }
    return best;
  }
}
Carnivore.STATES = {
  IDLE: { update(a) { a.setState('WANDER'); } },
  WANDER: { update(a, dt, w) {
    a.wander(dt, w);
    if (a.scanTimer <= 0) { a.scanTimer = a.cfg.scanEvery; const t = a.scan(w); if (t) { a.target = t; a.setState('CHASING'); } }
  } },
  SEARCHING: { update(a, dt, w) { // gira lentamente buscando tras perder a la presa
    a.heading += a.cfg.turn * 0.6 * dt; a.advance(a.cfg.speed * 0.4, dt, w);
    if (a.scanTimer <= 0) { a.scanTimer = a.cfg.scanEvery; const t = a.scan(w); if (t) { a.target = t; return a.setState('CHASING'); } }
    if (a.stateTime >= a.cfg.searchTime) a.setState('WANDER');
  } },
  CHASING: { update(a, dt, w) {
    const t = a.target;
    if (!t || t.dead) { a.target = null; return a.setState('WANDER'); }
    if (dist(a, t) > a.cfg.range * a.cfg.loseFactor) { a.target = null; return a.setState('SEARCHING'); }
    a.steer(a.toward(t), dt); a.advance(a.cfg.chaseSpeed, dt, w);
    if (dist(a, t) <= a.radius + t.radius + a.cfg.attackReach) a.setState('ATTACKING');
  } },
  ATTACKING: { // no cambia de objetivo; la presa queda inmovilizada
    enter(a) { a.target.frozen = true; },
    update(a, dt) {
      a.heading += angleDiff(a.toward(a.target), a.heading) * Math.min(1, 10 * dt);
      if (a.stateTime >= a.cfg.attackTime) {
        const t = a.target; t.frozen = false; t.die('depredación');
        a.heal(t.hp * a.cfg.gain); a.target = null; a.setState('EATING');
      }
    },
    exit(a) { if (a.target) a.target.frozen = false; }
  },
  EATING: { update(a) { if (a.stateTime >= a.cfg.eatTime) a.setState('WANDER'); } },
  DEAD: { enter(a) { if (a.target) a.target.frozen = false; a.target = null; } }
};
