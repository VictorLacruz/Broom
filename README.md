# Broom

Prototipo base de un juego FPS web estilo retro, data-driven, con ECS ligero y render 3D con Three.js.

## Stack

- TypeScript
- Three.js
- Vite
- ECS ligero propio
- HUD en DOM/HTML

## Requisitos

- Node.js 20+
- npm 10+

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Datos JSON

Los datos del juego se cargan desde:

- `src/data/LevelConfig.json`
- `src/data/EnemyTypes.json`
- `src/data/Abilities.json`

## Controles

- Click izquierdo: ataque
- Click derecho: escudo
- `E`: proyectil de mangual
- `Shift`: dash
- `F`: interactuar (llave)
- `WASD`: movimiento
- Raton: mirar

## Vercel

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Variables minimas: no requeridas.
