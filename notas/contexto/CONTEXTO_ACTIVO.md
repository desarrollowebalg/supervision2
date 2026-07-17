# Contexto Activo

## Fecha de ultima actualizacion

2026-07-17

## Responsable sugerido

documentation-agent

## Objetivo actual

Formalizar un mecanismo documental de continuidad entre interacciones para que el proyecto mantenga un contexto operativo unico, facil de consultar y facil de actualizar sin depender de memoria conversacional.

## Estado actual

El repositorio ya tiene una base documental util y alineada con el trabajo asistido por IA:

- `AGENTS.md` define reglas operativas globales, agentes y validaciones.
- `agents/README.md` aclara que los agentes son contratos operativos y que no existe un cargador automatico de `agents/*.md`.
- `notas/BUILD.md` mantiene la validacion minima y el flujo de build/deploy.
- existen notas operativas por tema, en especial para `supervision`, formularios, tareas y arquitectura frontend.

Hoy no existe una convencion formal unica para continuidad de contexto entre sesiones. Hay documentacion suficiente para reconstruir estado, pero esta distribuida en varios `.md` y no hay un archivo activo unico que resuma objetivo, decisiones, pendientes y siguiente paso.

## Alcance confirmado

- Crear una base documental para continuidad usando archivos Markdown.
- Mantener la solucion dentro de `notas/` y alineada con `AGENTS.md`.
- No asumir automatizacion inexistente dentro del proyecto.
- Usar este contexto como apoyo operativo y no como sustituto de documentacion tecnica especializada.

## Decisiones vigentes

- El archivo fuente de verdad para continuidad sera `notas/contexto/CONTEXTO_ACTIVO.md`.
- La estructura vivira dentro de `notas/contexto/` para respetar la regla del proyecto de concentrar notas operativas en `notas/`.
- Se separa contexto activo de historial para evitar mezclar estado vigente con registro historico.
- La continuidad se implementa primero como convencion documental formal, no como loader automatico, porque hoy el repo no tiene mecanismo nativo para inyectar un `.md` en cada interaccion.
- La regla de uso debe quedar documentada tambien en `AGENTS.md` para que forme parte del flujo operativo oficial.

## Archivos clave

- `AGENTS.md`
- `agents/README.md`
- `agents/documentation-agent.md`
- `notas/BUILD.md`
- `notas/contexto/README.md`
- `notas/contexto/PLANTILLA_CONTEXTO.md`
- `src/pages/README.md`
- `src/core/services/README.md`
- `src/pages/supervision/SUPERVISION_SIDEBAR_CONFIG.md`
- `notas/supervision/DEEP_LINK_RETORNO_LOGIN_2026-07-15.md`

## Estado operativo del proyecto que conviene recordar

- Frontend principal: Vanilla JS + Vite + UIkit.
- Entrypoints activos: `src/pages/login/main.js` y `src/pages/inicio/main.js`.
- Flujo base: `/login/default` -> `/inicio/default`.
- La SPA usa hash routing y valida rutas privadas contra PHP con `getUser()`.
- Los servicios reutilizables viven en `src/core/services/`.
- El almacenamiento oficial de catalogos en frontend es IndexedDB con Dexie.
- Formularios, tareas y evidencias ya tienen reglas operativas especificas documentadas.
- El sidebar de `supervision` ya esta desacoplado y configurado por cliente mediante `doctosSupervision/<clienteId>/supervision-sidebar.json`.

## Pendientes inmediatos

1. Confirmar que la estructura `notas/contexto/` cubra bien la necesidad real de continuidad entre sesiones.
2. Ajustar `AGENTS.md` para formalizar la lectura y actualizacion de `CONTEXTO_ACTIVO.md`.
3. Empezar a usar este archivo como punto de arranque en las siguientes tareas documentales o tecnicas.
4. Si la practica funciona, definir despues si hace falta una automatizacion externa o un bootstrap mas fuerte.

## Riesgos o bloqueos

- El proyecto no cuenta hoy con un cargador automatico que lea este contexto al iniciar cada interaccion.
- Si el archivo no se mantiene actualizado, pierde valor rapidamente y se vuelve otra nota obsoleta.
- Puede duplicar informacion si no se conserva como resumen operativo y se intenta mover aqui todo el detalle tecnico.
- El contenido debe seguir alineado con el codigo real para no contradecir `AGENTS.md`, `BUILD.md` o la implementacion vigente.

## Validacion pendiente

- Verificar que la estructura y nombres de archivo queden alineados con la politica de notas del proyecto.
- Confirmar que `AGENTS.md` refleje la nueva regla de continuidad.
- En cambios futuros dentro de `src/`, seguir ejecutando `npm run build` como minimo, segun `notas/BUILD.md`.

## Siguiente paso recomendado

Usar `notas/contexto/CONTEXTO_ACTIVO.md` como referencia inicial en la siguiente tarea real del proyecto y actualizarlo al cierre para validar que la convencion sea practica.

## Historial relacionado

- `notas/supervision/DEEP_LINK_RETORNO_LOGIN_2026-07-15.md`
- `src/pages/supervision/SUPERVISION_SIDEBAR_CONFIG.md`
- `notas/RESUMEN_CAMBIOS.md`
