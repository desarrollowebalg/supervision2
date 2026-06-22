# Agentes Especializados - Frontend (src/)

Guía conceptual de roles para trabajar esta arquitectura Vanilla JS + Vite + UIKit.

## Regla UI Principal

- El trabajo de interfaces de usuario en `src/` debe usar **UIkit** como base de componentes, layout y utilidades.
- Referencia oficial obligatoria:
  - https://getuikit.com/docs/introduction

Politica estricta (obligatoria):
- Todo estilo nuevo debe partir de clases `uk-*` y utilidades oficiales de UIkit.
- No introducir reglas visuales custom si existe equivalente UIkit para el mismo objetivo.
- No mezclar convenciones de otros frameworks CSS.
- Cualquier CSS custom debe documentar brevemente por que UIkit no cubre el caso.

## Frontend Architect

Especialista en organización de `src/`, router, store, servicios y build.

Contexto actual:
- Arquitectura por páginas (no modular en `src/modules`).
- Entrypoints activos:
  - `src/pages/login/main.js`
  - `src/pages/inicio/main.js`
- Flujo: `/login/default` -> `/inicio/default`.

## Component Builder

Crea páginas/componentes con clases ES6:

```js
export default class MiPagina {
  render(container) {
    container.innerHTML = '<div>...</div>';
  }
}
```

Buenas prácticas:
- `bindEvents()` para listeners.
- `destroy()` para cleanup cuando aplique.
- usar UIKit en layout/base visual.

## Router Engineer

Responsable de `src/core/router.js` y registro de rutas en `src/pages/inicio/main.js`.

Capacidades:
- hash routing
- params de ruta
- query strings
- guards
- lazy loading

Regla obligatoria de sesion por ruta:
- Toda ruta con `meta.requiresAuth` debe validarse en `beforeEach` contra backend PHP (`getUser`).
- No usar solo `store.isAuthenticated` como verificacion unica.
- Si sesion expira en runtime:
  - usar handler centralizado de sesion expirada,
  - limpiar estado sensible local,
  - redirigir a `/login/default`,
  - evitar loops con flag de control.

## Service Designer

Define/ajusta servicios en `src/core/services` y servicios de dominio futuros.

Actuales:
- `api.js`
- `authService.js`
- `storage.service.js`

Sesion expirada (obligatorio):
- `api.js` debe detectar:
  - HTTP `401/403`,
  - respuestas no JSON/redireccion a login,
  - payload JSON con `code: SESSION_EXPIRED`.
- Ante deteccion, activar servicio central de expiracion (`session-expiration.service.js`).

## State Architect

Mantiene `src/core/store.js` y su evolución.

Estado actual:
- store ligero para usuario autenticado.

## Style Organizer

Gestiona estilos en:
- `src/styles/global.css`
- `src/styles/themes.css`
- CSS específico junto a la página/feature (ej. `src/pages/login/login.css`).

Estandar tipografico/UI:
- Mantener tipografia base de UIkit (sin forzar `font-family`/`font-size` globales).
- Preferir clases `uk-text-*` y estilos UIkit sobre `font-size` inline/custom.
- Bloques `<style>` embebidos deben justificarse solo para comportamiento local no cubierto por utilidades UIkit.

Reglas de higiene CSS (obligatorias):
- Evitar `style=""` inline para presentacion (colores, tipografia, espaciado, bordes) cuando pueda resolverse con UIkit.
- Evitar `!important` en estilos de UI; usarlo solo para compatibilidad puntual heredada y con comentario.
- No crear tamaños tipograficos ad-hoc si `uk-text-*`, `uk-heading-*`, `uk-card-title` o variantes UIkit cubren el caso.
- En componentes/paginas nuevas:
  - primero markup con clases UIkit,
  - despues CSS custom minimo y localizado.
- Si se agrega CSS custom, debe:
  - vivir junto a la feature o en archivo global justificado,
  - usar variables/tokens compatibles con UIkit cuando aplique,
  - no romper semantica visual de `uk-card`, `uk-button`, `uk-input`, `uk-alert`, `uk-label`.

Checklist de aprobacion visual para frontend-agent:
1. ¿El layout base usa clases UIkit?
2. ¿Tipografia y texto usan `uk-text-*`/`uk-heading-*` antes que `font-size` manual?
3. ¿No hay `style=""` o `!important` innecesario?
4. ¿El CSS custom restante esta justificado por una limitacion real de UIkit?
5. ¿Desktop y mobile mantienen consistencia con patrones UIkit?

## Build Engineer

Mantiene `vite.config.js`.

Puntos clave:
- Entradas `login` e `inicio`.
- Integración PWA con `vite-plugin-pwa`.
- Salida en `dist/` con `manifest.json`.

## Doc Writer

Mantiene docs alineadas a la arquitectura por páginas y flujo real de login/inicio.

Checklist rápido:
- no referenciar `src/modules`
- documentar `/inicio/default` como destino post-login
- reflejar PWA vanilla runtime (`navigator.serviceWorker`)

## Regla de servicios para evidencias visuales

- La subida inmediata de `photo`, `gallery` y `signature` debe centralizarse en un servicio reusable en `src/core/services/`.
- El renderer/componentes no deben duplicar logica HTTP ni parseo de respuesta S3 por tipo.
- La respuesta consumible para formulario debe quedar normalizada como referencia S3 para reutilizarla en `save-text`.

## Captura de Formularios (ajustes vigentes)

- En secciones de registros (`index-marker`):
  - bloquear duplicados por payload usando clave + descripcion,
  - si hay duplicado, mostrar error y no agregar item,
  - el error debe indicar la clave duplicada detectada.
- Botones de accion de item (editar/eliminar):
  - el click debe funcionar en toda el area del boton (incluyendo icono interno).
- Salida de formulario activo:
  - confirmar antes de abandonar solo cuando existen respuestas capturadas,
  - al confirmar, limpiar registro local del formulario activo.
