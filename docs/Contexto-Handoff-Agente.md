# Contexto de Handoff para Otro Agente (Broom)

Ultima actualizacion: 27 febrero 2026

## 1) Objetivo del proyecto

- Juego web FPS en navegador llamado **Broom** (estilo retro/Quake).
- Stack: **TypeScript + Three.js + Vite**.
- Arquitectura: **ECS ligero** + sistemas por archivo.
- Configuracion del gameplay **100% data-driven via JSON**.
- HUD en DOM/HTML, textos en espanol.
- Deploy objetivo: Vercel.

## 2) Estado actual (importante)

- El proyecto **compila y pasa tests**:
  - `npm run build` OK
  - `npm run test` OK
- `Game.ts` ya no es monolitico: ahora orquesta pipeline de sistemas ECS.
- Se reemplazaron placeholders por **texturas reales** de itch.io (pack CC0).

## 3) Estructura clave

- Core:
  - `src/core/ecs.ts`
  - `src/core/input.ts`
  - `src/core/render.ts`
- Game:
  - `src/game/Game.ts` (orquestador)
  - `src/game/GameContext.ts`
  - `src/game/worldActions.ts`
  - `src/game/systems/*.ts`
- Data:
  - `src/data/LevelConfig.json`
  - `src/data/EnemyTypes.json`
  - `src/data/Abilities.json`
  - `src/game/DataLoader.ts` (carga runtime)
- UI:
  - `src/ui/hud.ts`
  - `src/ui/styles.css`
- Tests:
  - `tests/data.spec.ts`

## 4) Sistemas ECS implementados

- `cooldownSystem.ts`
- `movementSystem.ts`
- `combatSystem.ts`
- `enemyAISystem.ts`
- `projectileSystem.ts`
- `keyInteractionSystem.ts`
- `progressionSystem.ts`
- `healthSystem.ts`
- `visualSyncSystem.ts`
- Utilidades:
  - `mapSystem.ts`
  - `waveSystem.ts`
  - `systemTypes.ts`

## 5) Texturas reales integradas

Fuente:
- itch.io: Voxel Core Lab - Hand-Painted Seamless Terrain Textures
- Licencia: **CC0 1.0**
- Licencia copiada en:
  - `src/assets/textures/terrain/LICENSE.txt`

Archivos activos:
- `src/assets/textures/terrain/ground_grass.png`
- `src/assets/textures/terrain/wall_stone.png`
- `src/assets/textures/terrain/enemy_dirt.png`
- `src/assets/textures/terrain/key_water.png`
- `src/assets/textures/terrain/projectile_water.png`

Integracion en codigo:
- `src/core/render.ts`: suelo, muros, enemigos, llave
- `src/game/systems/combatSystem.ts`: proyectil

## 6) Comandos de trabajo

Instalacion:
```bash
npm install
```

Desarrollo:
```bash
npm run dev
```

Validacion:
```bash
npm run build
npm run test
```

## 7) Pendientes sugeridos

1. Optimizar peso de texturas (hoy son PNG de ~1.5MB-2.1MB cada una) con versiones comprimidas/WebP si se busca mejorar carga inicial.
2. Revisar y ajustar balance de enemigos por nivel/ola (HP, dano, cooldowns, spawn rates).
3. Separar mas `worldActions.ts` en sistemas/eventos si se quiere arquitectura ECS mas pura.
4. Agregar limpieza automatica de recursos si se implementa reinicio/salida de partida.

## 8) Archivos temporales a limpiar

En la raiz quedaron artefactos de descarga de itch.io:
- `_itch_checkout.min.js`
- `_itch_download_page.html`
- `_itch_download_resp.json`
- `_itch_extern.min.js`
- `_itch_file_resp.json`
- `_itch_purchase.html`
- `_watercolor_textures.zip`
- `_watercolor_textures_real.zip`

Se pueden borrar sin afectar el juego.

## 9) Deploy Vercel

Configuracion recomendada:
- Framework preset: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Variables de entorno: no requeridas actualmente

---

Si el siguiente agente necesita contexto funcional rapido: empezar por `src/game/Game.ts`, `src/game/GameContext.ts`, `src/game/worldActions.ts` y luego sistemas en `src/game/systems/`.
