# Flujo de creación de páginas con `CatalogListPageBase`

Esta guía documenta cómo crear una nueva página usando el patrón compartido de listados basado en:

- `src/pages/shared/catalog-list-page.base.js`
- `src/pages/inicio-layout.js`
- tokens de tema definidos en `src/styles/themes.css`

Aplica para páginas con esta estructura:

- título
- subtítulo opcional
- buscador
- barra de columnas
- contenido en lista

---

## Diagrama general

```mermaid
flowchart TD
    A["Nueva página requerida"] --> B{"¿La vista es tipo listado?"}
    B -- "No" --> C["Usar otra base o componente específico"]
    B -- "Sí" --> D["Extender CatalogListPageBase"]
    D --> E["Definir clase Singleton en src/pages/<modulo>/<Pagina>.js"]
    E --> F["Renderizar layout con renderInicioLayout(...) o renderCatalogListPage(...)"]
    F --> G{"¿Los datos ya existen?"}
    G -- "Sí, catálogo existente" --> H["Reutilizar servicio actual de src/core/services/apis-me/"]
    G -- "No, página nueva" --> I["Crear servicio nuevo o fuente local según necesidad"]
    H --> J["Cargar datos y bind del buscador"]
    I --> J
    J --> K["Renderizar items con clases catalog-*"]
    K --> L["Registrar ruta en src/pages/inicio/main.js"]
    L --> M{"¿Debe aparecer en navegación?"}
    M -- "Sí" --> N["Agregar enlace en sidebar, Inicio o componente origen"]
    M -- "No" --> O["Mantener acceso interno/manual"]
    N --> P["Validar con npm run build"]
    O --> P
```

---

## Escenario 1: página con catálogo existente

```mermaid
flowchart LR
    A["Página nueva"] --> B["Identificar catálogo existente"]
    B --> C["Ubicar servicio actual"]
    C --> D["Ejemplos: forms.service.js, pdis.service.js, tareas.service.js"]
    D --> E["Extender CatalogListPageBase"]
    E --> F["Consumir servicio en load<Feature>()"]
    F --> G["bindSearch(...)"]
    G --> H["renderCatalogList(...)"]
    H --> I["Agregar ruta y enlace si aplica"]
```

### Cuándo usar este camino

- Ya existe un servicio en `src/core/services/apis-me/`.
- El catálogo ya se sincroniza o se consulta actualmente.
- Sólo necesitas una nueva vista para leer, filtrar o navegar ese contenido.

### Ejemplo real

- `src/pages/puntosInteres/PuntosInteres.js`
- `src/core/services/apis-me/pdis.service.js`

---

## Escenario 2: página nueva con datos nuevos

```mermaid
flowchart LR
    A["Página nueva"] --> B["Definir origen de datos"]
    B --> C{"¿Es catálogo sincronizable?"}
    C -- "Sí" --> D["Crear servicio en src/core/services/apis-me/"]
    D --> E["Si aplica, integrar cache con IndexedDB / Dexie"]
    E --> F["Exponer función getAssigned<Feature>() o similar"]
    C -- "No" --> G["Usar fuente local, payload puntual o servicio simple"]
    F --> H["Extender CatalogListPageBase"]
    G --> H
    H --> I["Implementar load<Feature>(), bindSearch(), render<Feature>List()"]
    I --> J["Registrar ruta y navegación"]
    J --> K["Validar build y flujo visual"]
```

### Cuándo usar este camino

- No existe todavía el servicio.
- La fuente de datos es nueva.
- La nueva pantalla necesita incorporarse al flujo del proyecto.

### Consideraciones que suelen faltar

- Si el dato es reutilizable, crear servicio en `src/core/services/` o `src/core/services/apis-me/`.
- Si usa APIs del navegador con potencial de reuso, centralizarlas en `src/core/services/` con patrón Singleton.
- Si será un catálogo oficial del frontend, revisar si debe integrarse con IndexedDB según `src/core/services/CATALOG_STORAGE_INDEXEDDB.md`.
- Si la página requiere acceso autenticado, registrar la ruta con `meta.requiresAuth: true`.

---

## Diagrama de archivos a tocar

```mermaid
flowchart TD
    A["Nueva vista tipo listado"] --> B["src/pages/<modulo>/<Pagina>.js"]
    A --> C["src/pages/inicio/main.js"]
    A --> D{"¿Necesita datos nuevos?"}
    D -- "Sí" --> E["src/core/services/apis-me/<feature>.service.js"]
    D -- "Sí, sincronizable" --> F["src/core/services/catalog-indexeddb.service.js o integración relacionada"]
    A --> G{"¿Debe verse en navegación?"}
    G -- "Sí" --> H["src/components/sidebar-menu-component.js"]
    G -- "Sí o acceso destacado" --> I["src/pages/Inicio.js u otro componente con data-route"]
    A --> J["Documentación opcional: src/pages/README.md o README del módulo"]
```

---

## Estructura base recomendada

```js
import { CatalogListPageBase } from '../shared/catalog-list-page.base.js';
import { getAssignedFeature } from '../../core/services/apis-me/feature.service.js';

export default class MiPagina extends CatalogListPageBase {
  static instancia = null;

  constructor() {
    if (MiPagina.instancia) {
      return MiPagina.instancia;
    }

    super();
    this.allItems = [];
    MiPagina.instancia = this;
  }

  async inicializar(container) {
    if (container) {
      this.render(container);
    }

    return this;
  }

  render(container) {
    this.renderCatalogListPage(container, {
      title: 'Mi página',
      description: 'Descripción breve.',
      searchPlaceholder: 'Buscar por nombre',
      searchInputId: 'featureSearchInput',
      stateContainerId: 'featureStateContainer'
    });

    this.bindCatalogMobileSearchToggle(container);
    this.bindSearch(container);
    this.loadItems(container);
  }
}
```

---

## Alta manual de la ruta

Archivo:

- `src/pages/inicio/main.js`

Pasos:

1. Importar la nueva página al inicio del archivo.
2. Registrar la ruta con `registerRoute(...)`.
3. Definir `meta.title`.
4. Marcar `meta.requiresAuth: true` si la vista es privada.

Ejemplo:

```js
import MiPagina from '../miModulo/MiPagina.js';

registerRoute('/mi-pagina', MiPagina, {
  meta: { title: 'Mi página', requiresAuth: true }
});
```

### Reglas prácticas de ruta

- Usar rutas hash tipo `#/mi-pagina`.
- Mantener slug corto, estable y en minúsculas.
- Si habrá detalle, usar patrón `/:id` o `/:indicator` sólo cuando realmente exista una entidad identificable.

---

## Cómo hacer navegable la página

Registrar la ruta no siempre la hace visible al usuario. Si debe aparecer en navegación:

### Sidebar

Archivo:

- `src/components/sidebar-menu-component.js`

Agregar item en `get items()` o en la sección correspondiente:

```js
{ path: '/mi-pagina', label: 'Mi página', icon: 'list' }
```

### Acceso desde Inicio u otra vista

Archivos comunes:

- `src/pages/Inicio.js`
- componentes con enlaces `data-route`

Ejemplo:

```html
<a href="#/mi-pagina" data-route="/mi-pagina">Ir a mi página</a>
```

---

## Checklist mínimo

```mermaid
flowchart TD
    A["Checklist final"] --> B["Clase Singleton creada"]
    B --> C["Extiende CatalogListPageBase"]
    C --> D["Usa clases catalog-*"]
    D --> E["Tema dark/light validado"]
    E --> F["Ruta registrada en inicio/main.js"]
    F --> G{"¿Visible para usuario?"}
    G -- "Sí" --> H["Link agregado en sidebar o vista origen"]
    G -- "No" --> I["Acceso interno/documentado"]
    H --> J["npm run build"]
    I --> J
```

---

## Referencias actuales

- Base compartida: `src/pages/shared/catalog-list-page.base.js`
- Referencia simple: `src/pages/puntosInteres/PuntosInteres.js`
- Referencia con tema por item: `src/pages/formularios/formularios.js`
- Registro de rutas: `src/pages/inicio/main.js`
- Router: `src/core/router.js`
- Documentación del router: `src/core/ROUTER.md`
