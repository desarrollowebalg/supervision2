# Páginas - Documentación

Este directorio contiene las páginas de la SPA y sus entrypoints activos.

## Entrypoints

- `src/pages/login/main.js`: inicializa login.
- `src/pages/inicio/main.js`: inicializa shell post-login y registro de rutas hash.

## Rutas activas registradas en inicio

- `#/inicio` -> `src/pages/Inicio.js`
- `#/formularios` -> `src/pages/formularios/formularios.js`
- `#/formularios/:indicator` -> `src/pages/formularios/form-evidencia.js`
- `#/puntos-interes` -> `src/pages/puntosInteres/PuntosInteres.js`
- `#/tareas` -> `src/pages/tareas/Tareas.js`
- `#/timeline` -> `src/pages/evidencias/Timeline.js`

## Detalle de formularios (schema dinámico)

- La vista `#/formularios/:indicator` resuelve el formulario por:
  1. Query param `clv` en hash (ej: `#/formularios/QST164127?clv=11770`).
  2. Fallback por catálogo local usando `indicator` (`ITEM_NUMBER`) para recuperar `CLV`.
- El detalle consume `GET /apis_me/form-engine/index.php?idformulario=<CLV>`.
- El cuerpo del formulario se renderiza por componentes desde:
  - `src/pages/formularios/schema-renderer/schema-form.renderer.js`
  - `src/pages/formularios/schema-renderer/components/`
- Tipos no soportados (`unsupported`) no bloquean la vista: se omiten en UI y se registran en consola.

## Layout compartido

- `src/pages/inicio-layout.js` centraliza el shell (`header`, `sidebar`, `main`) y eventos comunes de navegación/logout.
- Las páginas de `/inicio` reutilizan `renderInicioLayout(...)` para mantener consistencia visual y funcional.

## Patrón base para páginas de listado

- Para páginas con estructura `título + subtítulo + buscador + barra de columnas + lista`, reutilizar `src/pages/shared/catalog-list-page.base.js`.
- Esta base ya resuelve:
  - integración con `renderInicioLayout(...)`
  - buscador responsive con toggle en mobile
  - barra de cabecera para columnas
  - badge de conteo
  - estilos compatibles con `light/dark`
  - hover de filas conectado a tokens globales de tema
- Referencia activa:
  - `src/pages/puntosInteres/PuntosInteres.js`
  - `src/pages/formularios/formularios.js`
- Diagrama y flujo de creación:
  - `src/pages/shared/CATALOG_LIST_PAGE_FLOW.md`

### Cómo crear una nueva página basada en este patrón

1. Crear una clase Singleton en `src/pages/<modulo>/<Pagina>.js`.
2. Extender `CatalogListPageBase`.
3. Llamar `renderCatalogListPage(...)` dentro de `render(...)`.
4. Conectar `bindCatalogMobileSearchToggle(container)` si hay buscador.
5. Renderizar items con `renderCatalogList(...)`.
6. Mantener cualquier ajuste visual extra como complemento, no como reemplazo del patrón.

Ejemplo base:

```js
import { CatalogListPageBase } from '../shared/catalog-list-page.base.js';

export default class MiListado extends CatalogListPageBase {
  static instancia = null;

  constructor() {
    if (MiListado.instancia) {
      return MiListado.instancia;
    }

    super();
    this.items = [];
    MiListado.instancia = this;
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }
    return this;
  }

  render(container) {
    this.renderCatalogListPage(container, {
      title: 'Mi listado',
      description: 'Consulta elementos disponibles.',
      searchPlaceholder: 'Buscar por nombre',
      searchInputId: 'miListadoSearchInput',
      stateContainerId: 'miListadoStateContainer'
    });

    this.bindCatalogMobileSearchToggle(container);
    this.renderItems(container.querySelector('#miListadoStateContainer'));
  }

  renderItems(stateContainer) {
    this.renderCatalogList(stateContainer, {
      items: this.items,
      emptyMessage: 'No hay elementos para mostrar.',
      mobileCounterLabel: 'Total de resultados',
      desktopHeaderLabel: 'Nombre / Clave',
      renderMobileItem: (item) => `
        <li class="catalog-list__item">
          <article class="catalog-row catalog-row--mobile uk-card uk-card-default uk-card-body uk-border-rounded uk-padding-small">
            <h3 class="uk-margin-remove-bottom uk-text-bold catalog-row__title">${this.escapeHtml(item.nombre)}</h3>
            <p class="uk-margin-small-top uk-margin-remove-bottom catalog-row__meta">Clave: ${this.escapeHtml(item.clave)}</p>
          </article>
        </li>
      `,
      renderDesktopItem: (item) => `
        <li class="catalog-list__item uk-padding-small uk-padding-remove-top uk-padding-remove-bottom">
          <article class="catalog-row catalog-row--desktop uk-border-rounded uk-padding-small">
            <h3 class="uk-margin-remove-bottom catalog-row__title">${this.escapeHtml(item.nombre)}</h3>
            <p class="uk-margin-small-top uk-margin-remove-bottom catalog-row__meta">Clave: ${this.escapeHtml(item.clave)}</p>
          </article>
        </li>
      `
    });
  }
}
```

## Convención de clases de página (Singleton)

Las clases nuevas o modificadas en `src/pages/**` deben seguir estructura Singleton como base:

```js
export default class MiPagina {
  static instancia = null;

  constructor(context = {}) {
    if (MiPagina.instancia) {
      return MiPagina.instancia;
    }

    this.context = context;
    MiPagina.instancia = this;
  }

  async inicializar(container, params = {}) {
    if (container) {
      this.render(container, params);
    }

    return this;
  }

  render(container, params = {}) {
    container.innerHTML = '<div>Contenido</div>';
  }

  destroy() {
    // opcional
  }
}
```

## Flujo de autenticación

1. Login en `/login/default`.
2. Si autentica, redirección a `/inicio/default`.
3. La SPA continúa en rutas hash (`#/...`).

## Persistencia local en formulario activo (autosave)

- La vista `#/formularios/:indicator` registra referencia activa por formulario usando `indicator + CLV`.
- Se guarda un snapshot del `schema` y respuestas en `localStorage` por formulario activo.
- El autosave se dispara al perder foco (`focusout`) y en cambios (`change`) para cubrir inputs visuales.
- Debajo del título del formulario se muestra estado pequeño de guardado automático con hora.

## Submit actual

- Al enviar, se consume `POST /apis_me/evidences/save-text` para respuestas no visuales.
- Los campos visuales `photo`, `gallery` y `signature` se suben al momento de captura via `POST /apis_me/evidences/save-photos`.
- El valor persistido en `input[type=file]` + `input[type=hidden]` para esos campos es la referencia devuelta por backend (`s3Name`), no base64.

## Componentes HTML visuales

- `photo` y `gallery` mantienen `input[type=file]` + `input[type=hidden]` y boton para seleccionar de nuevo.
- `signature` mantiene canvas, boton `Limpiar` y reintento manual de envio.
- Cada campo visual muestra estado discreto no bloqueante: `idle`, `uploading`, `uploaded`, `error`.
- En error de subida se habilita reintento manual por campo.
