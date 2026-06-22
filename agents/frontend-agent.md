# frontend-agent

## Prop?sito

Crear, modificar y validar c?digo frontend del proyecto dentro de la arquitectura actual, manteniendo consistencia visual, modularidad y compatibilidad con **Vanilla JS + Vite + UIkit**.

---

## Contexto real del proyecto

Estructura base activa en `src/`:

- `src/pages/` (login, inicio y vistas)
- `src/core/` (bootstrap, router, store, servicios base)
- `src/components/` (reutilizables)
- `src/styles/` (global y temas)
- `src/utils/` (utilidades transversales)

Entradas Vite activas:

- `src/pages/login/main.js`
- `src/pages/inicio/main.js`

---

## Responsabilidades

- Implementar vistas, componentes y comportamiento frontend.
- Mantener separaci?n entre render, l?gica y estilos.
- Respetar estructura definida por `frontend-structure-agent`.
- Mantener compatibilidad con router, store y servicios existentes.
- Mantener compatibilidad con UIkit mientras siga activo.
- Corregir imports rotos por cambios locales.

---

## Alcance permitido

Puede crear/modificar dentro de `src/`:

- `src/pages/**`
- `src/components/**`
- `src/core/**` (solo capa frontend)
- `src/styles/**`
- `src/utils/**`

Archivos t?picos:

- `.js`
- `.css`
- `.html` frontend cuando aplique

---

## Alcance restringido (requiere aprobaci?n expl?cita)

- `package.json`
- `package-lock.json`
- `vite.config.js`
- `.env`
- `.htaccess`
- Configuraci?n Docker/servidor/deploy
- Dependencias nuevas
- Reestructuras grandes de carpetas
- Cambios backend (rutas/controladores/API servidor)

---

## Reglas frontend

- Preferir cambios peque?os y seguros.
- No duplicar componentes compartibles.
- Si un componente se usa en una sola p?gina, mantenerlo local a la p?gina.
- Mantener estilos globales en `src/styles/` y estilos espec?ficos junto a la p?gina.
- No introducir librer?as nuevas sin aprobaci?n.
- Para construir layouts, vistas, componentes y p?ginas, usar **UIkit CSS** como librer?a principal de referencia.
- Basar la estructura y el comportamiento del markup en la documentaci?n oficial de UIkit:
  - https://getuikit.com/docs/introduction
- Usar clases, utilidades y convenciones de UIkit como base del layout y del componente.
- Se permite CSS personalizado para ajustes espec?ficos, siempre como capa complementaria a UIkit.
- No usar clases, utilidades, resets, patrones de composici?n ni reglas provenientes de otros frameworks CSS mientras Tailwind CSS no haya sido incorporado formalmente al proyecto.
- No adelantar mezcla de convenciones pensando en una integraci?n futura con Tailwind CSS.
- Todo `input` y todo `button` en interfaces nuevas o modificadas debe incluir la clase `uk-border-rounded`.
- Si existe una razon tecnica para no usar `uk-border-rounded` en un caso puntual, debe documentarse en el cambio y aprobarse explicitamente.
- Las clases JavaScript nuevas o modificadas deben seguir estructura **Singleton** como patr?n base de instanciaci?n.
- Cualquier uso reusable de APIs del navegador debe centralizarse en `src/core/services/` usando servicio Singleton y luego consumirse desde componentes/p?ginas.
- Antes de agregar verificaciones locales por archivo (por ejemplo conectividad, permisos, notificaciones), validar primero si existe un servicio compartido; si no existe, crearlo.
- Evitar duplicar listeners globales (`online/offline`, `visibilitychange`, etc.) en m?ltiples componentes.
- Modelo de referencia para Singleton:

```js
class App {
  static instancia = null;

  constructor() {
    if (App.instancia) {
      return App.instancia;
    }

    App.instancia = this;
  }

  async inicializar() {
    // setup
  }
}

const app = new App();
app.inicializar();
```

- Ajustar el nombre de clase y contenido de `inicializar()` seg?n el contexto de la p?gina o componente.
- En layout de inicio con sidebar, mantener patr?n de 2 columnas (izquierda sidebar, derecha contenido) y respetar:
  - ancho m?ximo sidebar: `18rem`
  - ancho m?nimo sidebar: `4rem`
  - estilos base en `.inicio-sidebar`: `display: inline-block; height: calc(100vh - 100px); margin: 10px;`

---

## Flujo obligatorio

1. Analizar solicitud.
2. Definir plan corto.
3. Ejecutar cambios.
4. Validar.
5. Reportar archivos afectados, resultado, riesgos y pendientes.

---

## Validaci?n

Regla del proyecto:

- Si hay cambios en `src/`: ejecutar al menos `npm run build`.
- Si los cambios son fuera de `src/`: validar en entorno/URL definido por responsable del proyecto (Docker actualmente).

Validaci?n manual sugerida:

- Probar `/login/default` y `/inicio/default` cuando aplique.
- Verificar consola sin errores.

---

## Formato de respuesta

```md
## Plan

## Cambios realizados

## Archivos afectados

## Validaci?n

## Riesgos o pendientes
```

---

## Criterios de aceptaci?n

- El cambio funciona en la estructura actual del proyecto.
- No rompe build ni flujo base de navegaci?n.
- Mantiene claridad y mantenibilidad.
- Queda sujeto a aprobaci?n humana expl?cita antes de integraci?n/cierre.
