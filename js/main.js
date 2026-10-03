/* ================= UI y bucle principal ================= */
const $ = (id) => document.getElementById(id);
const world = new World(), renderer = new Renderer($('cv'));
let paused = false, speed = 1, last = performance.now(), fps = 60, uiTimer = 0;

$('bSpeed').onclick = () => { const sp = CONFIG.sim.speeds; speed = sp[(sp.indexOf(speed) + 1) % sp.length]; $('bSpeed').textContent = speed + 'x'; };
$('bMenu').onclick = () => $('panel').classList.toggle('open');
$('sTheme').onchange = e => {
  renderer.theme = world.theme = e.target.value; world.items = []; renderer.refreshBg(); e.target.blur();
  if (world.theme === 'ciudad') world.banner = { text: '¡MODO CIUDAD!', sub: 'Pastillas y setas: quien las toma se vuelve loco', t: 5 };
};
$('bPause').onclick = () => { paused = !paused; $('bPause').textContent = paused ? '▶' : '⏸'; };
$('bReset').onclick = () => world.reset();
$('cRadius').onchange = e => renderer.opt.radius = e.target.checked;
$('cCone').onchange = e => renderer.opt.cone = e.target.checked;
$('cDebug').onchange = e => renderer.opt.debug = e.target.checked;
[['rPlant', CONFIG.plant], ['rHerb', CONFIG.herb], ['rCarn', CONFIG.carn]].forEach(([id, cfg]) => { // límites de población
  const el = $(id), out = $('v' + id.slice(1));
  el.value = cfg.max; out.textContent = cfg.max;
  el.oninput = () => { cfg.max = +el.value; out.textContent = el.value; };
});
const rnd = () => ({ x: rand(30, world.w - 30), y: rand(30, world.h - 30) });
$('bHerb').onclick = () => { const p = rnd(); world.herbs.push(new Herbivore(p.x, p.y)); };
$('bCarn').onclick = () => { const p = rnd(); world.carns.push(new Carnivore(p.x, p.y)); };
$('bGiant').onclick = () => spawnGiant(world);
const MOVE = { w: 'u', arrowup: 'u', s: 'd', arrowdown: 'd', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r' };
window.addEventListener('keydown', e => { const m = MOVE[e.key.toLowerCase()]; if (m && world.giant) { input.keys.add(m); e.preventDefault(); } });
window.addEventListener('keyup', e => { const m = MOVE[e.key.toLowerCase()]; if (m) input.keys.delete(m); });
const cvEl = $('cv'), pt = e => { const r = cvEl.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
cvEl.addEventListener('pointerdown', e => input.pointer = pt(e));
cvEl.addEventListener('pointermove', e => { if (input.pointer) input.pointer = pt(e); });
window.addEventListener('pointerup', () => input.pointer = null);
window.addEventListener('resize', () => renderer.resize(world));
renderer.resize(world);

function updateStats() {
  const p = world.plants.length, h = world.herbs.length, k = world.carns.length, t = Math.floor(world.time);
  $('sP').textContent = p; $('sH').textContent = h; $('sC').textContent = k;
  $('sT').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  $('stats').textContent = `Población total: ${p + h + k} · FPS: ${fps.toFixed(0)}`;
}

function frame(now) {
  const raw = Math.min((now - last) / 1000, 0.1); last = now;
  fps += (1 / Math.max(raw, 0.001) - fps) * 0.05;
  if (!paused) { // subpasos fijos: la velocidad no depende de los FPS
    let dt = raw * speed; const n = Math.max(1, Math.ceil(dt / CONFIG.sim.maxStep));
    for (let i = 0; i < n; i++) world.step(dt / n);
  }
  renderer.draw(world);
  if ((uiTimer -= raw) <= 0) { uiTimer = 0.25; updateStats(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
