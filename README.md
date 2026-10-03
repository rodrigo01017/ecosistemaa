# 🌿 Mini Ecosistema

Simulador de ecosistema en tiempo real hecho con **HTML5, CSS3 y JavaScript** (Canvas 2D). Sin frameworks, sin librerías, sin backend: abre `index.html` y funciona.

Plantas, herbívoros y carnívoros viven, comen, crecen, se reproducen y mueren, con un diseño colorido estilo juego de móvil.

## ✨ Características

- 🌱 **Plantas** que crecen con el tiempo (más vida = más tamaño) y aparecen de forma progresiva.
- 🐰 **Herbívoros** que deambulan, detectan plantas, las comen, **crecen con la edad** y **se reproducen**.
- 🦊 **Carnívoros** con **cono de visión de 45°**, persecución, ataque y envejecimiento (pelo gris, más lentos, mueren de viejos).
- 👹 **Carnívoro gigante** controlable por el jugador (aparece a los 60 s o con el botón).
- 🎨 **Fondos a elegir**: Parque, Pecera, Casa y Ciudad. Plantas y animales cambian de colores según el fondo.
- 💊 **Modo Ciudad**: pastillas y setas mágicas con efectos temporales (hiperactivo, psicodélico, sueño, gigante).
- 🛠️ **Modo Debug**: hitboxes, radios de detección, conos, objetivos, estados y vida.
- 🎛️ Límites de población ajustables, velocidad 0.5x–5x, pausa y reinicio.

## ▶️ Cómo ejecutarlo

**Opción 1:** abre `index.html` con doble clic en tu navegador.

**Opción 2 (servidor local):**

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

## 🎮 Controles

| Acción | Cómo |
|---|---|
| Mover el gigante | `WASD` / flechas, o arrastrar con el dedo/ratón |
| Pausar / velocidad / añadir animales / gigante / reiniciar | Botones de la barra inferior |
| Límites de población, fondo, radios, cono, debug | Panel ⚙️ (arriba a la derecha) |

## 🗂️ Estructura

```
├── index.html          # Interfaz (HUD, botones, panel)
├── css/style.css       # Estilo tipo juego móvil
├── assets/ciudad.jpg   # Imagen del fondo Ciudad
└── js/
    ├── config.js       # CONFIG: todos los valores ajustables y paletas
    ├── utils.js        # Utilidades matemáticas y rejilla espacial
    ├── entities.js     # Entity, Plant, Animal, Herbivore, Carnivore (máquinas de estados)
    ├── giant.js        # Carnívoro gigante y entrada del jugador
    ├── world.js        # Spawner y mundo (bucle de simulación)
    ├── renderer.js     # Dibujo en Canvas (sin lógica de simulación)
    └── main.js         # UI y bucle principal
```

Los scripts son clásicos (no módulos) y se cargan en orden, así que funciona abriendo el archivo directamente.

## ⚙️ Personalizar

Casi todo se cambia en `js/config.js`: máximos de población, velocidades, tiempos de alimentación, reproducción, crecimiento, vejez, pastillas y paletas de color por fondo.

## 🌐 Publicar en GitHub Pages

1. Sube el proyecto a un repositorio.
2. En **Settings → Pages**, elige *Deploy from a branch*, rama `main` y carpeta `/ (root)`.
3. Tu simulación estará en `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`.

## 🔮 Ideas futuras

Genética y mutaciones, más especies, hambre y sed, estaciones y clima, estadísticas con gráficas, guardado y carga de partidas, quadtree para optimizar la detección.

## 📝 Notas

- La imagen `assets/ciudad.jpg` es una captura de un videojuego aportada por el autor. Si publicas el repositorio, comprueba que tienes derecho a usarla o sustitúyela por una propia.
- Añade la licencia que prefieras (por ejemplo MIT) con un archivo `LICENSE`.
