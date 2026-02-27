# Contexto de Handoff para Otro Agente (Broom)

Ultima actualizacion: 27 febrero 2026

## 1) Objetivo

- Juego 3D en navegador (TypeScript + Three.js + Vite) con arquitectura ECS.
- Flujo de nivel actual:
  - matar olas de enemigos
  - aparece llave
  - recoger llave
  - interactuar con puerta para pasar de nivel

## 2) Estado actual verificado

- Al iniciar esta actualizacion, el arbol estaba limpio; ahora este handoff queda modificado para dejar contexto al siguiente agente.
- Build/test no re-ejecutados en este turno, pero el estado funcional reciente del proyecto incluye:
  - control con `WASD` (adelante en `W`, atras en `S`)
  - ataque principal en click izquierdo
  - enemigos como sprites 2D con animaciones por estado (`idle/run/attack/hit`)
  - colisiones jugador-enemigo y enemigo-enemigo
  - colision con entorno usando `clampToWalkable`
  - minimapa eliminado
  - layout de 3 salas + 2 pasillos + techo

## 3) Implementado en codigo (archivos clave)

- Entrada y controles:
  - `src/core/input.ts`
    - `forward` usa `KeyW`/`KeyS`
    - ataque en `mousedown` boton izquierdo (`button === 0`)
    - escudo en click derecho
    - `F` para interactuar

- Combate jugador:
  - `src/game/systems/combatSystem.ts`
    - ataque melee por proximidad a enemigos cercanos
    - aplica dano a multiples enemigos dentro de rango
    - dispara efecto visual `hit` en impacto

- IA/colisiones:
  - `src/game/systems/enemyAISystem.ts`
    - perseguir/atacar segun distancia
    - animaciones por estado segun timers
    - separacion entre enemigos
  - `src/game/systems/movementSystem.ts`
    - separacion jugador-enemigos
  - `src/game/systems/collisionUtils.ts`
    - zonas caminables definidas por rectangulos (3 salas + 2 pasillos)

- Flujo llave/puerta/progresion:
  - `src/game/systems/progressionSystem.ts`
    - al terminar olas, si no hay llave, llama `spawnKey(...)`
    - ya no cambia de nivel automaticamente
  - `src/game/systems/keyInteractionSystem.ts`
    - `F` cerca de llave: recoger
    - `F` cerca de puerta y con llave: cargar siguiente nivel
  - `src/game/worldActions.ts`
    - `loadLevel(...)` limpia enemigos/proyectiles/llave/puerta y crea nivel
    - `spawnDoor(...)` en `(95.2, 0.18, 0)`
    - `spawnKey(...)` usa `keyRoomId` del nivel o fallback a sala media

- Render/arte:
  - `src/core/render.ts`
    - suelo `stone_floor_layout01.png`
    - paredes `dungeon_tile_set_wall.png` (DungeonTileSet)
    - sprites enemigos (wizard/skeleton/knight/goblin)
    - sprite de puerta y animacion de llave
    - efecto `hit` con sprites `hit01..hit05`

## 4) Pendientes exactos del usuario (NO cerrar sin esto)

1. Puerta pegada a la pared del fondo:
   - ahora mismo la puerta esta en `x=95.2` y no esta totalmente pegada al muro este de la ultima sala.
   - ajustar posicion exacta y, si hace falta, `sprite.center` para que visualmente toque pared y suelo.

2. Llave en la sala del medio:
   - el spawn actual prioriza `keyRoomId` de `LevelConfig.json`.
   - para cumplir pedido, forzar sala central del layout jugable (especialmente nivel 1).

## 5) Riesgos/observaciones tecnicas

- `LevelConfig.json` describe rooms que no siempre coinciden con la geometria fija creada en `render.ts`.
- La navegacion real depende de `WALKABLE_RECTS` en `collisionUtils.ts`; si se cambia mapa visual, actualizar esos rects.
- El spawn de enemigos actualmente es radial alrededor del centro global (no por sala especifica).

## 6) Punto de entrada recomendado para continuar

1. `src/game/worldActions.ts` (spawn de puerta y llave).
2. `src/core/render.ts` (alineacion visual puerta/pared/suelo).
3. `src/data/LevelConfig.json` + `src/game/systems/collisionUtils.ts` (consistencia sala central y navegacion).
