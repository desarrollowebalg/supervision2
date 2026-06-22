# Notas de Refactorización Frontend

## Fecha

2026-05-04

## Objetivo

Eliminar la estructura modular de `src` y estandarizar la app en una arquitectura vanilla JS basada en páginas, más simple de mantener y escalar.

## Resultado

### Estructura actual en `src`

```text
src/
├── core/
├── pages/
│   ├── login/
│   │   ├── main.js
│   │   ├── LoginPage.js
│   │   └── login.css
│   ├── inicio/
│   │   └── main.js
│   ├── Inicio.js
│   ├── Dashboard.js
│   ├── Users.js
│   ├── UserDetail.js
│   └── SearchResults.js
├── components/
├── styles/
└── utils/
```

## Cambios clave

1. Eliminación de `src/modules/login` y `src/modules/app`.
2. Migración de login a `src/pages/login`.
3. Migración del shell post-login a `src/pages/inicio/main.js`.
4. Redirección post-login a `/inicio/default`.
5. Creación de `modules/inicio/` en backend para sustituir `modules/app` en el flujo principal.
6. Entradas de Vite actualizadas.
7. Registro PWA con vanilla JS (`navigator.serviceWorker`).

## Integración backend

- `modules/login/default.php` -> `loadVite('src/pages/login/main.js')`
- `modules/inicio/default.php` -> `loadVite('src/pages/inicio/main.js')`
- `modules/login/login.php` devuelve URL base `inicio` en login exitoso.

## Estado

- Build funcional
- Flujo login -> inicio funcional
- Documentación de `src` actualizada
- Documentación raíz actualizada
