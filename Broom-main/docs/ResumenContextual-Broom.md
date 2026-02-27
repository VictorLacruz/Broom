# Resumen Contextual - Broom

## Propósito

Desarrollar Broom: FPS web en navegador con 4 niveles, progresión de enemigos y habilidades del mangual/escudo, configurable por JSON y desplegable en Vercel.

## Decisiones ya fijadas

- Plataforma: navegador (frontend puro).
- Stack: TypeScript + Three.js + ECS ligero.
- UI: DOM/HTML en español.
- Datos: `LevelConfig.json`, `EnemyTypes.json`, `Abilities.json`.
- Estilo visual: retro minimalista, iluminación simple.

## Mecánicas por nivel

- Nivel 1: ataque de mangual con secuencia de arcos y empuje.
- Nivel 2: escudo frontal con durabilidad y regeneración.
- Nivel 3: proyectil de mangual.
- Nivel 4: quemadura + dash con cooldown.

## HUD y controles

- HUD con enemigos, minimapa, vida, durabilidad, cooldowns e icono de llave.
- Controles: mouse + WASD + click izq/der + E + Shift + F.

## Progresión y mapas

- 4 niveles.
- 3 olas por nivel.
- Escalado de dificultad por ola y nivel.
- Llave en sala central.
- Transición con pantalla de carga entre niveles.

## Entregables técnicos esperados

- Scaffold completo de proyecto.
- ECS y sistemas base.
- Carga runtime de JSON.
- HUD en español.
- Pruebas de fixtures/balance.
- Documentación de build/deploy en Vercel.
