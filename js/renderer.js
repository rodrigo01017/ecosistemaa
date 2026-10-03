/* ================= Renderizado (sin lógica de simulación) ================= */
class Renderer {
  constructor(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.opt = { radius: false, cone: false, debug: false }; this.theme = 'parque';
    this.cityImg = new Image(); this.cityImg.onload = () => { if (this.theme === 'ciudad') this.refreshBg(); }; this.cityImg.src = CITY_IMG;
  }
  refreshBg() { const r = this.cv.getBoundingClientRect(); this.bg = this.makeBg(r.width, r.height, window.devicePixelRatio || 1); }
  resize(world) {
    const r = this.cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    this.cv.width = r.width * d; this.cv.height = r.height * d;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    world.w = r.width; world.h = r.height;
    this.bg = this.makeBg(r.width, r.height, d);
  }
  draw(world) {
    const c = this.ctx; c.drawImage(this.bg, 0, 0, world.w, world.h);
    if (this.theme === 'pecera') this.bubbles(world);
    for (const p of world.plants) this.plant(p);
    for (const it of world.items) this.item(it, world.time);
    for (const h of world.herbs) this.animal(h);
    for (const k of world.carns) this.animal(k);
    if (world.giant) this.animal(world.giant);
    this.particles(world);
    if (world.banner) this.banner(world);
  }
  plant(p) { // arbusto con hojas y bayas
    const c = this.ctx, P = this.pal.plant, q = p.hp / p.maxHp, sway = 1 + 0.04 * Math.sin(p.age * 2 + p.seed);
    const r = p.radius * (1 - p.eaten) * Math.min(1, p.age / 0.4) * sway;
    if (r < 0.5) return;
    this.shadow(p.x, p.y + r * 0.7, r * 1.1, r * 0.4);
    c.fillStyle = P.leaf; c.strokeStyle = P.edge; c.lineWidth = Math.max(1.5, r * 0.12);
    for (let i = 0; i < 5; i++) { const a = p.seed + i * TAU / 5; c.beginPath(); c.ellipse(p.x + Math.cos(a) * r * 0.8, p.y + Math.sin(a) * r * 0.8, r * 0.55, r * 0.3, a, 0, TAU); c.fill(); c.stroke(); }
    const g = c.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.1, p.x, p.y, r);
    g.addColorStop(0, P.g0); g.addColorStop(1, P.g1);
    c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, r * 0.85, 0, TAU); c.fill(); c.stroke();
    if (q > 0.55) for (let i = 0; i < 3; i++) {
      const a = p.seed * 3 + i * 2.1, bx = p.x + Math.cos(a) * r * 0.4, by = p.y + Math.sin(a) * r * 0.4;
      c.fillStyle = P.fruit; c.beginPath(); c.arc(bx, by, r * 0.2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(bx - r * 0.06, by - r * 0.06, r * 0.07, 0, TAU); c.fill();
    }
    c.lineWidth = 1;
    if (this.opt.debug) { c.strokeStyle = '#fff6'; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.stroke(); this.label(p.x, p.y - r - 4, Math.round(p.hp)); }
  }
  animal(a) {
    const c = this.ctx, dead = a.stateName === 'DEAD';
    let r = a.radius * Math.min(1, 0.3 + a.age / 0.7), x = a.x, y = a.y, alpha = 1; // las crías crecen al nacer
    if (dead) { const t = a.deathTimer / CONFIG.death.time; alpha = 1 - t; r *= 1 - 0.5 * t; }
    if (a.stateName === 'EATING') r *= 1 + 0.08 * Math.sin(a.stateTime * 14);          // pulsación al comer
    if (a.stateName === 'ATTACKING') { const l = Math.sin(Math.min(1, a.stateTime / a.cfg.attackTime) * Math.PI) * 8; x += Math.cos(a.heading) * l; y += Math.sin(a.heading) * l; }
    // conos / radios (debajo del cuerpo)
    if (!dead && this.opt.radius && a.kind === 'herb') this.ring(a.x, a.y, a.cfg.detect);
    if (!dead && this.opt.cone && a.kind === 'carn') this.cone(a);
    c.globalAlpha = alpha;
    this.body(a, x, y, r);
    c.globalAlpha = 1;
    if (this.opt.debug && !dead) this.debug(a, r);
  }
  body(a, x, y, r) {
    const c = this.ctx, s = a.stateName, k = a.kind, ga = c.globalAlpha;
    let open = 0; // apertura de la boca
    if (s === 'EATING') open = 0.2 + 0.3 * Math.abs(Math.sin(a.stateTime * 14)); // masticar
    else if (s === 'ATTACKING') open = 0.8;
    else if (s === 'CHASING') open = 0.3;
    else if (k === 'giant') open = a.chew > 0 ? 0.9 : 0.12;
    if (k === 'giant' && a.age < 1.2) { // onda de aparición
      c.strokeStyle = '#ff5a4a'; c.lineWidth = 4; c.globalAlpha = 1 - a.age / 1.2;
      c.beginPath(); c.arc(x, y, r * (1 + a.age * 4), 0, TAU); c.stroke(); c.lineWidth = 1; c.globalAlpha = ga;
    }
    this.shadow(x, y + r * 0.75, r * 0.95, r * 0.38);
    const hi = a.high, hue = hi && hi.type === 'seta' ? (a.age * 200) % 360 : 0;
    if (hi) { // aura del efecto
      const auraCol = { rosa: '#ff5fa2', azul: '#3d8fff', verde: '#3ddc84', seta: `hsl(${hue},90%,60%)` }[hi.type];
      c.strokeStyle = auraCol; c.lineWidth = 3; c.globalAlpha = ga * 0.8; c.beginPath(); c.arc(x, y, r * (1.25 + 0.08 * Math.sin(a.age * 8)), 0, TAU); c.stroke(); c.lineWidth = 1; c.globalAlpha = ga;
    }
    if (hue) c.filter = `hue-rotate(${hue}deg)`; // colores que cambian (seta)
    if (hi && hi.type === 'rosa') { x += rand(-1.2, 1.2); y += rand(-1.2, 1.2); } // temblor
    c.save(); c.translate(x, y); c.rotate(a.heading);
    if (s === 'WANDER' || s === 'MOVING_TO_PLANT' || s === 'CHASING' || s === 'SEARCHING' || s === 'PLAYER') { // balanceo al caminar
      const w = Math.sin(a.age * (k === 'giant' ? 8 : 14)) * 0.06; c.scale(1 + w, 1 - w);
    }
    if (k === 'herb') this.herb(r, open, a.heading); else this.beast(r, open, k === 'giant', a.heading, a.aging || 0);
    c.restore(); c.filter = 'none';
    if (s === 'EATING' && k === 'herb' && a.target) this.crumbs(a);
    if (hi && s !== 'DEAD') { c.font = '18px sans-serif'; c.textAlign = 'center'; c.fillText({ rosa: '⚡', seta: '🌀', azul: '💤', verde: '💚' }[hi.type], x, y - r - 8 + Math.sin(a.age * 6) * 2); }
    if (k === 'carn' && s !== 'DEAD' && a.aging > 0.5) { c.font = '16px sans-serif'; c.textAlign = 'center'; c.fillText('💤', x + r * 0.8, y - r * 0.9); } // cansado
    if (k === 'giant') this.label(x, y - r - 12, 'TÚ · ' + a.kills, true);
    else if (s !== 'DEAD' && a.hp / a.maxHp < 0.4) this.bar(x, y - r - 10, r * 2, a.hp / a.maxHp);
  }
  herb(r, open, hd) {
    const c = this.ctx, p = this.pal.herb; c.lineWidth = Math.max(1.5, r * 0.12); c.strokeStyle = p.edge;
    c.fillStyle = p.belly; c.beginPath(); c.arc(-r * 1.0, 0, r * 0.28, 0, TAU); c.fill(); c.stroke(); // cola
    for (const s of [-1, 1]) { // orejas
      c.fillStyle = p.ear; c.beginPath(); c.ellipse(r * 0.05, s * r * 0.95, r * 0.3, r * 0.5, s * 0.35, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#ffb3c7'; c.beginPath(); c.ellipse(r * 0.05, s * r * 0.95, r * 0.14, r * 0.3, s * 0.35, 0, TAU); c.fill();
    }
    const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, p.top); g.addColorStop(1, p.bot);
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = p.belly; c.beginPath(); c.ellipse(r * 0.45, 0, r * 0.45, r * 0.38, 0, 0, TAU); c.fill(); // hocico
    this.shine(r, hd);
    c.fillStyle = 'rgba(255,120,160,.65)'; // mejillas
    for (const s of [-1, 1]) { c.beginPath(); c.arc(r * 0.2, s * r * 0.72, r * 0.15, 0, TAU); c.fill(); }
    c.fillStyle = '#ff6f91'; c.beginPath(); c.arc(r * 0.72, 0, r * 0.1, 0, TAU); c.fill(); // nariz
    c.fillStyle = '#5a1f2e'; c.beginPath(); c.ellipse(r * 0.93, 0, r * 0.08 + open * 0.1 * r, r * (0.04 + open * 0.3), 0, 0, TAU); c.fill(); // boca
    this.eyes(r * 0.28, r * 0.42, r * 0.27, false);
    c.lineWidth = 1;
  }
  beast(r, open, big, hd, old = 0) {
    const c = this.ctx, P = this.pal.carn, g0 = (col) => mixColor(col, '#aeb4ba', old * 0.85), dark = g0(big ? '#4a0d18' : P.dark), base = g0(big ? '#c4243a' : P.base); // el pelo se vuelve gris con la edad
    c.lineWidth = Math.max(1.5, r * 0.1); c.strokeStyle = '#2a0508';
    c.fillStyle = base; c.beginPath(); c.ellipse(-r * 1.15, 0, r * 0.5, r * 0.28, 0, 0, TAU); c.fill(); c.stroke(); // cola
    c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * 1.55, 0, r * 0.2, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = dark; const hl = big ? 1.8 : 1.4; // orejas/cuernos y púas
    for (const [ang, len] of [[0.95, hl], [-0.95, hl], [2.5, 1.3], [Math.PI, 1.4], [-2.5, 1.3]]) {
      const w = 0.28; c.beginPath();
      c.moveTo(Math.cos(ang - w) * r, Math.sin(ang - w) * r); c.lineTo(Math.cos(ang) * r * len, Math.sin(ang) * r * len);
      c.lineTo(Math.cos(ang + w) * r, Math.sin(ang + w) * r); c.closePath(); c.fill(); c.stroke();
    }
    if (big) { c.shadowColor = '#ff2a2a'; c.shadowBlur = 28; }
    const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, g0(big ? '#e04058' : P.top)); g.addColorStop(1, base);
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.shadowBlur = 0; c.stroke();
    this.shine(r, hd);
    c.strokeStyle = dark; // rayas
    for (const x of [-0.15, -0.45]) { c.beginPath(); c.moveTo(r * x, -r * 0.6); c.lineTo(r * x, r * 0.6); c.stroke(); }
    c.fillStyle = mixColor(P.belly, '#ffffff', old); c.beginPath(); c.ellipse(r * 0.5, 0, r * 0.4, r * 0.34, 0, 0, TAU); c.fill(); // hocico
    const h = r * (0.08 + open * 0.4);
    c.fillStyle = '#2a0508'; c.beginPath(); c.ellipse(r * 0.8, 0, r * 0.22, h, 0, 0, TAU); c.fill(); // boca
    c.fillStyle = '#fff';
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(r * 0.68, s * h); c.lineTo(r * 0.92, s * h); c.lineTo(r * 0.8, s * h * 0.3); c.fill(); } // colmillos
    this.eyes(r * 0.35, r * 0.38, r * 0.24, true);
    c.strokeStyle = mixColor('#1a0306', '#ffffff', old); c.lineWidth = Math.max(1.5, r * (0.09 + 0.05 * old)); // cejas furiosas (blancas y pobladas de viejo)
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(r * 0.1, s * r * 0.66); c.lineTo(r * 0.6, s * r * 0.2); c.stroke(); }
    c.lineWidth = 1;
  }
  eyes(x, yo, rad, slit) {
    const c = this.ctx;
    for (const s of [-1, 1]) {
      c.fillStyle = slit ? '#ffe45c' : '#fff'; c.strokeStyle = '#10151a'; c.lineWidth = Math.max(1, rad * 0.25);
      c.beginPath(); c.arc(x, s * yo, rad, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#10151a'; c.beginPath();
      if (slit) c.ellipse(x + rad * 0.2, s * yo, rad * 0.22, rad * 0.8, 0, 0, TAU); else c.arc(x + rad * 0.3, s * yo, rad * 0.55, 0, TAU);
      c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + rad * 0.1, s * yo - rad * 0.25, rad * 0.2, 0, TAU); c.fill(); // brillo
    }
  }
  crumbs(a) { // trocitos de planta saltando mientras come
    const c = this.ctx, t = a.target; c.fillStyle = this.pal.plant.leaf;
    for (let i = 0; i < 6; i++) {
      const p = (a.stateTime * 2.5 + i / 6) % 1, ang = i * 1.9 + 0.5;
      c.globalAlpha = 1 - p; c.beginPath(); c.arc(t.x + Math.cos(ang) * p * 14, t.y + Math.sin(ang) * p * 14 - p * 6, 2, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  }
  ring(x, y, r) { const c = this.ctx; c.strokeStyle = '#4aa3ff55'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
  cone(a) {
    const c = this.ctx, h = a.fov / 2;
    c.fillStyle = '#e0453a22'; c.strokeStyle = '#e0453a88';
    c.beginPath(); c.moveTo(a.x, a.y); c.arc(a.x, a.y, a.cfg.range, a.heading - h, a.heading + h); c.closePath(); c.fill(); c.stroke();
  }
  debug(a, r) {
    const c = this.ctx; c.strokeStyle = CONFIG.colors.debug;
    c.beginPath(); c.arc(a.x, a.y, r, 0, TAU); c.stroke();                                   // hitbox
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(a.x + Math.cos(a.heading) * (r + 14), a.y + Math.sin(a.heading) * (r + 14)); c.stroke(); // rumbo
    if (a.target) { c.setLineDash([4, 4]); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(a.target.x, a.target.y); c.stroke(); c.setLineDash([]); } // objetivo
    this.label(a.x, a.y - r - 6, `${a.stateName} ${Math.round(a.hp)}/${a.maxHp}`);
  }
  label(x, y, t, big) {
    const c = this.ctx; c.font = big ? '700 17px Fredoka, system-ui' : '10px monospace'; c.textAlign = 'center';
    c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText(t, x, y); c.fillStyle = '#fff'; c.fillText(t, x, y); c.lineWidth = 1;
  }
  shadow(x, y, rx, ry) { const c = this.ctx; c.fillStyle = 'rgba(0,40,10,.25)'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }
  bar(x, y, w, q) { // barra de vida (solo con poca salud)
    const c = this.ctx; c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.roundRect(x - w / 2, y, w, 5, 3); c.fill();
    c.fillStyle = q > 0.2 ? '#ffd54a' : '#ff5a4a'; c.beginPath(); c.roundRect(x - w / 2, y, w * q, 5, 3); c.fill();
  }
  shine(r, hd) { // brillo fijo arriba-izquierda, independiente de la rotación
    const c = this.ctx; c.save(); c.rotate(-hd); c.fillStyle = 'rgba(255,255,255,.45)';
    c.beginPath(); c.ellipse(-r * 0.35, -r * 0.45, r * 0.3, r * 0.16, -0.6, 0, TAU); c.fill(); c.restore();
  }
  makeBg(w, h, d) { // elige el fondo según el tema (se pinta una sola vez)
    return this.theme === 'ciudad' ? this.bgCity(w, h, d) : this.theme === 'pecera' ? this.bgTank(w, h, d) : this.theme === 'casa' ? this.bgHouse(w, h, d) : this.bgPark(w, h, d);
  }
  get pal() { return CONFIG.themes[this.theme]; } // paleta del tema actual
  vignette(c, w, h, col) {
    const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, col); c.fillStyle = v; c.fillRect(0, 0, w, h);
  }
  bgCity(w, h, d) { // ciudad: la imagen ajustada a pantalla completa
    const cv = document.createElement('canvas'); cv.width = w * d; cv.height = h * d;
    const c = cv.getContext('2d'); c.scale(d, d); c.fillStyle = '#8c8f94'; c.fillRect(0, 0, w, h);
    const im = this.cityImg;
    if (im && im.complete && im.naturalWidth) {
      const k = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * k, ih = im.naturalHeight * k;
      c.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih);
    }
    this.vignette(c, w, h, 'rgba(10,10,30,.45)');
    return cv;
  }
  item(it, t) { // pastilla o seta flotando
    const c = this.ctx, D = CONFIG.drugs, bob = Math.sin(t * 4 + it.x) * 2;
    const col = { rosa: '#ff5fa2', azul: '#3d8fff', verde: '#3ddc84', seta: '#ff4d4d' }[it.type];
    c.save(); c.globalAlpha = Math.max(0, Math.min(1, (D.life - it.age) / 2, it.age / 0.4)); c.translate(it.x, it.y + bob);
    this.shadow(0, 13 - bob, 9, 3.5);
    c.shadowColor = col; c.shadowBlur = 14;
    if (it.type === 'seta') {
      c.fillStyle = '#fff3d6'; c.beginPath(); c.roundRect(-4, -2, 8, 12, 3); c.fill();
      c.fillStyle = col; c.beginPath(); c.arc(0, -2, 11, Math.PI, 0); c.closePath(); c.fill();
      c.shadowBlur = 0; c.fillStyle = '#fff';
      for (const [x, y, r] of [[-5, -6, 2], [3, -8, 2.2], [6, -4, 1.6]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    } else {
      c.rotate(0.6); c.fillStyle = col; c.beginPath(); c.roundRect(-11, -5, 11, 10, [5, 0, 0, 5]); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect(0, -5, 11, 10, [0, 5, 5, 0]); c.fill();
      c.shadowBlur = 0; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(-11, -5, 22, 10, 5); c.stroke();
    }
    c.restore();
  }
  bgTank(w, h, d) { // pecera: agua, rayos de luz, arena, algas y corales
    const cv = document.createElement('canvas'); cv.width = w * d; cv.height = h * d;
    const c = cv.getContext('2d'); c.scale(d, d);
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#66d9f5'); g.addColorStop(0.6, '#1f94d6'); g.addColorStop(1, '#0c4f96');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.07)';
    for (let i = 0; i < 6; i++) { const x = rnd() * w, wd = 30 + rnd() * 60; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + wd, 0); c.lineTo(x + wd - 120, h); c.lineTo(x - 120, h); c.fill(); }
    const sy = h * 0.88, sg = c.createLinearGradient(0, sy, 0, h); sg.addColorStop(0, '#f6dea5'); sg.addColorStop(1, '#d9b873');
    c.fillStyle = sg; c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) c.lineTo(x, sy + Math.sin(x * 0.02) * 8);
    c.lineTo(w, h); c.fill();
    for (let i = 0; i < w / 14; i++) { c.fillStyle = ['#c9a45c', '#fff1cc', '#9fb6c9'][i % 3]; c.beginPath(); c.ellipse(rnd() * w, sy + 14 + rnd() * Math.max(1, h - sy - 18), 3 + rnd() * 5, 2 + rnd() * 3, 0, 0, TAU); c.fill(); }
    c.lineCap = 'round'; c.lineWidth = 7;
    for (let i = 0; i < w / 70; i++) { // algas
      const x = rnd() * w, hh = 60 + rnd() * 110; c.strokeStyle = i % 2 ? '#2fb36d' : '#1e9a5a';
      c.beginPath(); c.moveTo(x, sy + 10); c.bezierCurveTo(x - 25, sy - hh * 0.4, x + 25, sy - hh * 0.7, x, sy - hh); c.stroke();
    }
    for (let i = 0; i < w / 160; i++) { // corales
      const x = rnd() * w, y = sy + 8 + rnd() * 20; c.fillStyle = ['#ff7a9c', '#ffb347', '#b57bff'][i % 3];
      for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + k * 9 - 14, y - (k % 2) * 8, 9, 0, TAU); c.fill(); }
    }
    this.vignette(c, w, h, 'rgba(0,30,80,.5)');
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10); // cristal
    return cv;
  }
  bgHouse(w, h, d) { // casa: suelo de madera, alfombra, luz de ventana, maceta y camita
    const cv = document.createElement('canvas'); cv.width = w * d; cv.height = h * d;
    const c = cv.getContext('2d'); c.scale(d, d);
    let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let y = 0, row = 0; y < h; y += 48, row++) for (let x = -(row % 2) * 120; x < w; x += 240) {
      c.fillStyle = `hsl(${28 + rnd() * 6},${48 + rnd() * 10}%,${50 + rnd() * 8}%)`; c.fillRect(x, y, 240, 48);
      c.strokeStyle = 'rgba(70,35,10,.35)'; c.lineWidth = 2; c.strokeRect(x, y, 240, 48);
    }
    const rw = w * 0.62, rh = h * 0.5, rx = (w - rw) / 2, ry = (h - rh) / 2;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.roundRect(rx + 6, ry + 10, rw, rh, 30); c.fill();
    c.fillStyle = '#d6455d'; c.beginPath(); c.roundRect(rx, ry, rw, rh, 30); c.fill();
    c.fillStyle = '#f7b6c0'; c.beginPath(); c.roundRect(rx + 16, ry + 16, rw - 32, rh - 32, 22); c.fill();
    c.fillStyle = 'rgba(214,69,93,.35)';
    for (let x = rx + 44; x < rx + rw - 30; x += 40) for (let y = ry + 44; y < ry + rh - 30; y += 40) { c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); }
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round'; c.setLineDash([2, 10]);
    c.beginPath(); c.roundRect(rx + 8, ry + 8, rw - 16, rh - 16, 26); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(255,248,200,.14)'; c.beginPath(); c.moveTo(w * 0.1, 0); c.lineTo(w * 0.4, 0); c.lineTo(w * 0.7, h); c.lineTo(w * 0.4, h); c.fill(); // luz de la ventana
    const px = 70, py = h * 0.3; // maceta
    c.fillStyle = '#2fb36d'; for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(px + Math.cos(k) * 22, py + Math.sin(k) * 22, 16, 9, k, 0, TAU); c.fill(); }
    c.fillStyle = '#a65f3a'; c.strokeStyle = '#6d3a1e'; c.lineWidth = 3; c.beginPath(); c.arc(px, py, 18, 0, TAU); c.fill(); c.stroke();
    const bx = w - 85, by = h - 140; // camita
    c.fillStyle = '#5f8fd8'; c.beginPath(); c.arc(bx, by, 44, 0, TAU); c.fill();
    c.fillStyle = '#b8d3ff'; c.beginPath(); c.arc(bx, by, 32, 0, TAU); c.fill();
    c.strokeStyle = '#f4ead2'; c.lineWidth = 18; c.strokeRect(9, 9, w - 18, h - 18); // zócalo
    c.strokeStyle = '#b79c6d'; c.lineWidth = 2; c.strokeRect(18, 18, w - 36, h - 36);
    this.vignette(c, w, h, 'rgba(40,20,0,.35)');
    return cv;
  }
  bubbles(w) { // burbujas animadas de la pecera
    const c = this.ctx; c.strokeStyle = 'rgba(255,255,255,.55)'; c.fillStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1.5;
    for (let i = 0; i < 18; i++) {
      const sp = 18 + (i % 5) * 7, y = w.h + 20 - ((w.time * sp + i * 71) % (w.h + 40)), x = (i * 137) % w.w + Math.sin(w.time + i) * 10;
      c.beginPath(); c.arc(x, y, 3 + (i % 4) * 2, 0, TAU); c.fill(); c.stroke();
    }
  }
  bgPark(w, h, d) { // parque: hierba, camino, estanque y flores
    const cv = document.createElement('canvas'); cv.width = w * d; cv.height = h * d;
    const c = cv.getContext('2d'); c.scale(d, d);
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#93e36f'); g.addColorStop(1, '#4fbf62');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 30000; i++) {
      c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,80,30,.07)';
      c.beginPath(); c.ellipse(rnd() * w, rnd() * h, 40 + rnd() * 90, 25 + rnd() * 60, rnd() * 3, 0, TAU); c.fill();
    }
    c.lineCap = 'round'; c.lineWidth = 2; c.strokeStyle = 'rgba(30,120,50,.55)';
    for (let i = 0; i < w * h / 1800; i++) {
      const x = rnd() * w, y = rnd() * h;
      c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x - 6, y - 7); c.moveTo(x, y); c.lineTo(x, y - 9); c.moveTo(x + 4, y); c.lineTo(x + 6, y - 7); c.stroke();
    }
    const cols = ['#fff', '#ffe066', '#ff9bd0'];
    for (let i = 0; i < w * h / 16000; i++) {
      const x = rnd() * w, y = rnd() * h; c.fillStyle = cols[i % 3];
      for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x + Math.cos(k * 1.256) * 3, y + Math.sin(k * 1.256) * 3, 2, 0, TAU); c.fill(); }
      c.fillStyle = '#f5a623'; c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill();
    }
    c.lineCap = 'round'; c.strokeStyle = '#ecd8a8'; c.lineWidth = Math.min(w, h) * 0.09; // camino de tierra
    c.beginPath(); c.moveTo(-20, h * 0.75); c.bezierCurveTo(w * 0.3, h * 0.5, w * 0.6, h * 1.0, w + 20, h * 0.35); c.stroke();
    c.fillStyle = '#4aa8e8'; c.strokeStyle = '#bfa77a'; c.lineWidth = 6; // estanque
    c.beginPath(); c.ellipse(w * 0.2, h * 0.28, w * 0.1, h * 0.08, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(w * 0.18, h * 0.26, w * 0.04, h * 0.02, -0.3, 0, TAU); c.fill();
    const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,50,20,.45)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
    return cv;
  }
  particles(w) {
    const c = this.ctx; c.textAlign = 'center';
    for (const f of w.fx) { c.globalAlpha = 1 - f.t / f.life; c.font = f.size + 'px sans-serif'; c.fillText(f.txt, f.x, f.y); }
    c.globalAlpha = 1;
  }
  banner(w) {
    const c = this.ctx, b = w.banner, tw = Math.min(w.w - 24, 340), x = w.w / 2 - tw / 2, y = 84;
    c.globalAlpha = Math.min(1, b.t); c.fillStyle = '#ff5a4a'; c.strokeStyle = '#fff'; c.lineWidth = 4;
    c.beginPath(); c.roundRect(x, y, tw, 62, 20); c.fill(); c.stroke(); c.lineWidth = 1;
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '700 20px Fredoka, system-ui'; c.fillText(b.text, w.w / 2, y + 27);
    c.font = '500 13px Fredoka, system-ui'; c.fillText(b.sub, w.w / 2, y + 48); c.globalAlpha = 1;
  }
}
