# Prompt Codex - Broom

Construye un juego web FPS en navegador llamado **Broom** (estilo Quake retro) con **TypeScript + Three.js**, arquitectura **ECS ligera**, HUD en DOM/HTML y configuración **100% data-driven por JSON**.

## Objetivo

- 4 niveles/arenas en primera persona.
- Enemigos progresivos: campesino, caballero, goblin, mago.
- Sin sonido.
- Target 60 FPS en Chrome/Firefox.
- Estética retro minimalista: sin sombras complejas, luz estándar, partículas básicas.
- Todo texto de UI en español.
- Deploy en Vercel.

## Arquitectura

- Render: Three.js.
- Core: ECS ligero con entidades, componentes y sistemas.
- Datos: JSON cargado en runtime.
- UI: overlays DOM, lista para migrar a React luego.

## Estructura esperada

- `src/core/`
- `src/game/`
- `src/data/`
- `src/ui/`
- `public/`
- `src/assets/`
- `tests/`

## JSON requeridos

- `LevelConfig.json`: define salas, llave, olas, spawnRates, progresión.
- `EnemyTypes.json`: stats base y comportamiento IA.
- `Abilities.json`: habilidades por nivel.

## Reglas clave

- Nivel 1: swing de mangual en arco (`center`, `right45`, `center`, `left45`) con empuje.
- Nivel 2: escudo frontal con durabilidad, regeneración y bloqueo condicionado por umbral de 25%.
- Nivel 3: proyectil de mangual con daño al impacto.
- Nivel 4: quemadura de 5% HP/s por 2s y dash de 10m con cooldown 5s.
- 3 olas por nivel, base 10 enemigos + incremento por ola y nivel.
- Llave en sala central, no desaparece hasta recogerla.
- Transiciones de nivel con pantalla de carga.

## HUD y controles

HUD:
- Arriba izquierda: enemigos vivos / totales.
- Arriba derecha: minimapa estático.
- Abajo izquierda: vida actual/total + barra roja.
- Debajo: durabilidad del escudo.
- Abajo derecha: cooldown de 2 habilidades.
- Icono de llave al recogerla.

Controles:
- Click izquierdo: ataque.
- Click derecho: escudo.
- `E`: cabeza de mangual/proyectil.
- `Shift`: dash.
- `F`: interactuar.
- `WASD`: movimiento.
- Ratón: mirar.

## Entregables

1. Proyecto compilable con prototipo mínimo jugable.
2. JSON integrados en carga runtime.
3. ECS + módulos de juego (input/cámara, combate, IA, olas, mapa).
4. HUD DOM completo en español.
5. Pruebas básicas y fixtures.
6. README con guía Vercel.
