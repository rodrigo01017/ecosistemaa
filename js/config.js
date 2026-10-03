const CITY_IMG = 'assets/ciudad.jpg'; // fondo del modo ciudad

/* ================= CONFIG: todos los valores ajustables ================= */
const CONFIG = {
  sim: { speeds: [0.5, 1, 2, 5], maxStep: 0.03 },
  world: { margin: 50, minSeparation: 14, spawnTries: 12 },
  plant: { max: 120, interval: 0.3, chance: 0.8, delay: 0, startHp: 4, maxHp: 30, growth: 2.2, minR: 4, maxR: 14 },
  herb: {
    max: 40, interval: 2.5, chance: 0.8, delay: 2,
    startHp: 45, maxHp: 100, minR: 7, maxR: 16,
    speed: 45, seekSpeed: 55, turn: 3, detect: 95, moveCost: 0.02,
    eatTime: 1.6, eatReach: 3, idleTime: 0.6, eatGain: 0.9,
    reproHp: 70, reproCost: 30, childHp: 25, reproCooldown: 12, // reproducción
    babyScale: 0.5, adultScale: 1.1, growTime: 45, // crecimiento: tamaño de cría, de adulto y segundos hasta ser adulto
    scanEvery: 0.2, wanderEvery: [1, 3], wanderJitter: 1.3, minEdibleHp: 6
  },
  carn: {
    max: 6, interval: 6, chance: 0.7, delay: 25,
    startHp: 90, maxHp: 150, minR: 9, maxR: 19,
    speed: 55, chaseSpeed: 90, turn: 2.5, range: 160, fov: 45, moveCost: 0.015,
    attackTime: 0.7, attackReach: 4, eatTime: 1.5, gain: 0.7,
    scanEvery: 0.15, wanderEvery: [1.5, 3.5], wanderJitter: 1.0, searchTime: 1.2, loseFactor: 1.4,
    lifespan: 120, lifespanVar: 0.2, oldFrom: 0.65, oldSpeed: 0.5 // vejez: vida en s, variación, inicio del envejecimiento, velocidad final
  },
  death: { time: 0.6 },
  // Modo ciudad: pastillas y setas mágicas que los animales toman (efectos temporales)
  drugs: { max: 8, interval: 3, chance: 0.8, life: 40, duration: 9, range: 110, types: ['rosa', 'seta', 'azul', 'verde'], speed: { rosa: 1.8, azul: 0.4 } },
  // Carnívoro gigante controlado por el jugador (aparece en appearAt segundos)
  giant: { appearAt: 60, startHp: 1000, maxHp: 1000, minR: 70, maxR: 70, speed: 150, turn: 7, moveCost: 0, scanEvery: 1 },
  colors: { plant: '#4caf50', herb: '#4aa3ff', carn: '#e0453a', debug: '#ffd54a' },
  // Paletas de plantas y animales según el fondo elegido
  themes: {
    parque: {
      plant: { leaf: '#2f9e44', edge: '#1f7a34', g0: '#b6f58a', g1: '#3dbb4f', fruit: '#ff4d5e' },
      herb: { ear: '#3d8fe0', edge: '#1d4f8f', top: '#7cc4ff', bot: '#3d8fe0', belly: '#e8f4ff' },
      carn: { base: '#ee5a45', top: '#ff8a6b', dark: '#7a1d17', belly: '#ffd9c9' }
    },
    pecera: { // algas-coral rosas con perlas, peces naranjas y depredadores morados
      plant: { leaf: '#ff7aa8', edge: '#b83b6b', g0: '#ffc2d9', g1: '#ff6f9f', fruit: '#ffffff' },
      herb: { ear: '#ff9a3c', edge: '#a8531a', top: '#ffd27a', bot: '#ff9a3c', belly: '#fff3d6' },
      carn: { base: '#7a5cf0', top: '#a98bff', dark: '#3b2a8c', belly: '#e3dcff' }
    },
    casa: { // plantas de interior con flores amarillas, herbívoros rosas y gatos marrones
      plant: { leaf: '#3fae6a', edge: '#23704a', g0: '#d4f7a8', g1: '#4cc27a', fruit: '#ffd23f' },
      herb: { ear: '#e86aa6', edge: '#8f2a62', top: '#ffb3d6', bot: '#e86aa6', belly: '#fff0f6' },
      carn: { base: '#a8642f', top: '#d99358', dark: '#5a3015', belly: '#f6e1c4' }
    },
    ciudad: { // plantas con flores rosas, herbívoros amarillos y carnívoros oscuros
      plant: { leaf: '#3f9d5a', edge: '#235e36', g0: '#c6f0a0', g1: '#3fae62', fruit: '#ff5aa8' },
      herb: { ear: '#e07b2a', edge: '#8a4b12', top: '#ffe08a', bot: '#f2a93b', belly: '#fff4d6' },
      carn: { base: '#2f3442', top: '#555d75', dark: '#12141a', belly: '#c9cfdc' }
    }
  }
};
