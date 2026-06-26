# AGENTS.md

## ES - Prop?sito
Este documento define una estructura m?nima de trabajo con agentes para este proyecto.
Incluye qu? hace cada agente, qu? s? puede hacer, qu? no puede hacer sin aprobaci?n, y el flujo operativo base.

## EN - Purpose
This document defines a minimal agent workflow structure for this project.
It includes what each agent does, what each one can do, what cannot be done without approval, and the base operating flow.

## ES - Agentes Activos
- `frontend-agent`
- `backend-agent`
- `documentation-agent`
- `frontend-structure-agent`
- `api-action-agent`

## EN - Active Agents
- `frontend-agent`
- `backend-agent`
- `documentation-agent`
- `frontend-structure-agent`
- `api-action-agent`

## ES - Agente de Soporte
- `security-review-agent`
  - Uso: auditorias, revisiones de seguridad y backlog de endurecimiento.
  - Estado: disponible en `agents/`, pero no forma parte de la asignacion por defecto salvo que la tarea sea de seguridad.

## EN - Support Agent
- `security-review-agent`
  - Use: audits, security reviews, and hardening backlog.
  - Status: available in `agents/`, but not part of the default assignment path unless the task is security-focused.

## ES - Modelo Operativo de Agentes
- Los archivos dentro de `agents/` funcionan como contratos operativos y guias de ejecucion para trabajo humano y asistido por IA.
- No existe actualmente un cargador automatico del proyecto que descubra o ejecute `agents/*.md`.
- Para que un agente "funcione" operativamente, su archivo debe mantenerse alineado con:
  - la estructura real del repositorio,
  - este `AGENTS.md`,
  - y `notas/BUILD.md` como referencia de validacion.
- El indice operativo de agentes vive en `agents/README.md`.

## EN - Agent Operating Model
- Files inside `agents/` act as operational contracts and execution guides for human and AI-assisted work.
- There is currently no project-side automatic loader that discovers or executes `agents/*.md`.
- For an agent to "function" operationally, its file must stay aligned with:
  - the real repository structure,
  - this root `AGENTS.md`,
  - and `notas/BUILD.md` as the validation baseline.
- The operational agent index lives in `agents/README.md`.

## ES - Librer?a UI Principal
- La librer?a principal de interfaz del proyecto es **UIkit CSS**, tomando como referencia base su documentaci?n oficial de introducci?n:
  - https://getuikit.com/docs/introduction
- Los componentes, vistas y layouts nuevos o modificados deben construirse usando la estructura, clases utilitarias y comportamiento esperados por UIkit.
- Se permite escribir **CSS personalizado** cuando se requieran ajustes espec?ficos de presentaci?n, espaciado, adaptaci?n visual o correcciones puntuales.
- El CSS personalizado debe complementar a UIkit y no sustituir la base estructural del componente salvo que exista una raz?n t?cnica clara.
- Mientras Tailwind CSS no forme parte oficial del est?ndar del proyecto, los componentes y layouts no deben usar reglas, utilidades, clases ni patrones de otros frameworks CSS.
- La futura integraci?n con Tailwind CSS no autoriza adelantar mezcla de convenciones en el c?digo actual.

Politica estricta global (obligatoria):
- Todo estilo nuevo debe partir de clases `uk-*` y utilidades oficiales de UIkit.
- No introducir reglas visuales custom si existe equivalente UIkit para el mismo objetivo.
- No mezclar convenciones de otros frameworks CSS.
- Cualquier CSS custom debe incluir justificacion tecnica breve cuando UIkit no cubra el caso.
- Priorizar tipografia y componentes de UIkit (`uk-text-*`, `uk-heading-*`, `uk-card`, `uk-button`, `uk-input`, etc.) sobre estilos manuales.
- Evitar `style=""` inline para presentacion (colores, bordes, espaciado, tipografia) cuando pueda resolverse con UIkit.
- Evitar `!important` en UI salvo compatibilidad puntual heredada y documentada.

## EN - Primary UI Library
- The project's primary UI library is **UIkit CSS**, using its official introduction documentation as the base reference:
  - https://getuikit.com/docs/introduction
- New or modified components, views, and layouts must be built using the structure, utility classes, and expected behavior defined by UIkit.
- **Custom CSS** is allowed when more specific presentation, spacing, visual adaptation, or targeted fixes are needed.
- Custom CSS must complement UIkit and should not replace the component's structural base unless there is a clear technical reason.
- Until Tailwind CSS becomes an official part of the project standard, components and layouts must not use rules, utilities, classes, or patterns from other CSS frameworks.
- The future Tailwind CSS integration does not authorize mixing framework conventions in the current codebase ahead of time.

Strict global policy (mandatory):
- Every new style must start from `uk-*` classes and official UIkit utilities.
- Do not introduce custom visual rules when UIkit already provides an equivalent.
- Do not mix conventions from other CSS frameworks.
- Any custom CSS must include a short technical justification when UIkit does not cover the case.
- Prioritize UIkit typography and components (`uk-text-*`, `uk-heading-*`, `uk-card`, `uk-button`, `uk-input`, etc.) over manual styling.
- Avoid presentation-focused inline `style=""` (colors, borders, spacing, typography) when UIkit can solve it.
- Avoid `!important` in UI except for documented inherited compatibility cases.

## ES - Checklist Global de Estilos UI (Obligatorio)
1. ?El layout base usa clases UIkit?
2. ?Tipografia y textos usan clases UIkit antes que `font-size` manual?
3. ?No hay `style=""` o `!important` innecesario?
4. ?El CSS custom restante est? justificado por limitaci?n real de UIkit?
5. ?Desktop y mobile mantienen consistencia con patrones UIkit?

## EN - Global UI Style Checklist (Mandatory)
1. Does the base layout use UIkit classes?
2. Do typography and text use UIkit classes before manual `font-size`?
3. Are there no unnecessary inline `style=""` or `!important` rules?
4. Is remaining custom CSS justified by a real UIkit limitation?
5. Do desktop and mobile stay consistent with UIkit patterns?

## ES - Patr?n Reutilizable para P?ginas de Listado
- Cuando una p?gina frontend comparta el patr?n:
  - t?tulo
  - subt?tulo
  - buscador
  - barra de columnas
  - contenido en lista
  debe reutilizarse la base `src/pages/shared/catalog-list-page.base.js`.
- Esta base existe para evitar duplicaci?n de estilos y mantener consistencia visual entre `light/dark`.
- El hover de items y los colores de superficie deben depender de tokens globales (`--app-*`) definidos por tema, no de colores fijos.
- `src/pages/puntosInteres/PuntosInteres.js` queda como referencia operativa del patr?n.
- Si una p?gina nueva necesita este mismo estilo, extender la base y limitar el CSS custom a necesidades del dominio que UIkit o la base compartida no cubran.

## EN - Reusable Pattern for List Pages
- When a frontend page shares this pattern:
  - title
  - subtitle
  - search box
  - column header bar
  - list content
  it must reuse the base `src/pages/shared/catalog-list-page.base.js`.
- This base exists to prevent style duplication and preserve visual consistency across `light/dark`.
- Item hover and surface colors must depend on global theme tokens (`--app-*`), not fixed colors.
- `src/pages/puntosInteres/PuntosInteres.js` is the current operational reference for this pattern.
- If a new page needs the same style, extend the base and keep custom CSS limited to domain-specific needs not covered by UIkit or the shared base.

## ES - Estructura de Clases JavaScript (Singleton)
- Las clases JavaScript nuevas o modificadas en frontend deben usar patrón **Singleton** como estructura base.
- Modelo de referencia:

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

## EN - JavaScript Class Structure (Singleton)
- New or modified frontend JavaScript classes must use a **Singleton** pattern as the base structure.
- Reference model:

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

## ES - Centralizaci?n de APIs del Navegador (Obligatoria)
- Todo acceso a APIs del navegador con potencial de reutilizaci?n debe centralizarse en `src/core/services/` como servicio reusable con patr?n Singleton.
- Ejemplos: conectividad (`navigator.onLine`, `online/offline`), `localStorage`/`sessionStorage`, Notification API, geolocalizaci?n, permisos, background sync y APIs equivalentes.
- Antes de agregar nuevas verificaciones en componentes o p?ginas, primero validar si ya existe servicio compartido; si no existe, crearlo y consumirlo desde la capa de vista.
- Evitar listeners o verificaciones duplicadas por archivo cuando el comportamiento sea transversal.

## EN - Browser API Centralization (Mandatory)
- Any browser API access with reuse potential must be centralized in `src/core/services/` as a reusable Singleton-based service.
- Examples: connectivity (`navigator.onLine`, `online/offline`), `localStorage`/`sessionStorage`, Notification API, geolocation, permissions, background sync, and similar APIs.
- Before adding new checks in components or pages, first verify whether a shared service already exists; if not, create it and consume it from the view layer.
- Avoid duplicated listeners or per-file checks for cross-cutting behavior.

## ES - Form Engine Frontend (Schema Renderer)
- El detalle de formularios en `#/formularios/:indicator` debe resolver `CLV` para consultar `apis_me/form-engine`.
- Prioridad de resolucion de `CLV`:
  1. Query param `clv` en la ruta hash.
  2. Fallback por catalogo local de formularios (`ITEM_NUMBER -> CLV`).
- Configuracion visual de temas para listado de formularios:
  - Archivo externo editable: `/config/form-themes.json` (fuera de `src/`).
  - Relacion: `TEMA` del formulario contra `ID_TEMA`.
  - Colores aplicados por item: `BARRA` (fondo) y `LETRA` (texto).
- El render del schema debe mantenerse modular por tipo de campo (un componente por tipo) bajo `src/pages/formularios/schema-renderer/components/`.
- El orquestador/factory de render debe permanecer en `src/pages/formularios/schema-renderer/schema-form.renderer.js`.
- Los tipos no soportados no deben romper la vista: se omiten visualmente y se registran para diagnostico.

## EN - Form Engine Frontend (Schema Renderer)
- Form detail at `#/formularios/:indicator` must resolve `CLV` to query `apis_me/form-engine`.
- `CLV` resolution priority:
  1. `clv` query param in hash route.
  2. Fallback from local forms catalog (`ITEM_NUMBER -> CLV`).
- Visual theme configuration for forms list:
  - Editable external file: `/config/form-themes.json` (outside `src/`).
  - Mapping: form `TEMA` to theme `ID_TEMA`.
  - Item colors: `BARRA` (background) and `LETRA` (text).
- Schema rendering must stay modular by field type (one component per type) under `src/pages/formularios/schema-renderer/components/`.
- The render orchestrator/factory should remain in `src/pages/formularios/schema-renderer/schema-form.renderer.js`.
- Unsupported types must not break the page: hide in UI and log for diagnostics.

## ES - Tipo de Almacenamiento para Catalogos (Frontend)
- El almacenamiento local oficial para catalogos en frontend es **IndexedDB** con **Dexie.js**.
- Implementacion base obligatoria: `src/core/services/catalog-indexeddb.service.js`.
- Integracion actual de referencia: `src/core/services/apis-me/forms.service.js`.
- La consulta debe usar estrategia cache-first y la actualizacion debe usar sincronizacion forzada (`forceRefresh`) cuando aplique.
- Regla de identidad para sincronizacion remota: si no existe `user.id`, solo se permite lectura local de cache; no se debe llamar red.
- Cuando exista `user.id`, se permite sincronizacion remota y se debe limpiar cache anonima heredada (`user_anon:*`) en catalogos sincronizables.
- Documentacion tecnica y contrato de uso:
  - Ver [src/core/services/CATALOG_STORAGE_INDEXEDDB.md](src/core/services/CATALOG_STORAGE_INDEXEDDB.md)

## EN - Catalog Storage Type (Frontend)
- Official local storage for frontend catalogs is **IndexedDB** with **Dexie.js**.
- Mandatory base implementation: `src/core/services/catalog-indexeddb.service.js`.
- Current reference integration: `src/core/services/apis-me/forms.service.js`.
- Read operations must use cache-first strategy and updates must use forced sync (`forceRefresh`) when applicable.
- Identity rule for remote sync: if `user.id` is missing, only local cache reads are allowed; network sync must be skipped.
- Once `user.id` is available, remote sync is allowed and inherited anonymous cache (`user_anon:*`) must be cleaned for syncable catalogs.
- Technical documentation and usage contract:
  - See [src/core/services/CATALOG_STORAGE_INDEXEDDB.md](src/core/services/CATALOG_STORAGE_INDEXEDDB.md)

## ES - Flujo de Trabajo (M?nimo)
1. Plan
2. Ejecuci?n
3. Validaci?n

Regla de validaci?n:
- Si los cambios son en `src/`, ejecutar al menos `npm run build`.
- Si los cambios son fuera de `src/`, la validaci?n se ejecutar? en la URL/entorno que indique el responsable del proyecto (actualmente en contenedor Docker).

Referencia:
- Ver [notas/BUILD.md](notas/BUILD.md).

## EN - Workflow (Minimum)
1. Plan
2. Execution
3. Validation

Validation rule:
- If changes are in `src/`, run at least `npm run build`.
- If changes are outside `src/`, validation will run on the URL/environment provided by the project owner (currently Docker container based).

Reference:
- See [notas/BUILD.md](notas/BUILD.md).

## ES - Aprobaciones Obligatorias
Todos los cambios de c?digo y configuraci?n requieren aprobaci?n humana antes de confirmar/integrar cambios.

Incluye, entre otros:
- C?digo: `PHP`, `JS`, `CSS`, `HTML`.
- Configuraci?n: archivos como `vite.config.js`, `package.json` y equivalentes.

Regla operativa:
- Se puede preparar y dejar listo el cambio.
- Se debe esperar confirmaci?n expl?cita antes de cierre/integraci?n.

## EN - Mandatory Approvals
All code and configuration changes require human approval before confirming/integrating changes.

Includes, among others:
- Code: `PHP`, `JS`, `CSS`, `HTML`.
- Configuration: files such as `vite.config.js`, `package.json`, and equivalents.

Operating rule:
- Changes can be prepared and left ready.
- Explicit confirmation is required before closing/integrating.

## ES - Acciones Permitidas Sin Preguntar (Alcance Actual)
Se permite crear:
- Vistas
- Rutas
- Controladores

Alcance:
- Dentro de `src/`.
- Tambi?n fuera de `src/` (temporalmente habilitado; se ajustar? despu?s).

Nota:
- Aunque estas acciones est?n habilitadas, siguen sujetas a la regla de aprobaci?n antes de integraci?n.

## EN - Allowed Actions Without Asking (Current Scope)
The following can be created:
- Views
- Routes
- Controllers

Scope:
- Inside `src/`.
- Also outside `src/` (temporarily enabled; to be refined later).

Note:
- Even when enabled, these actions are still subject to approval before integration.

## ES - Estrategia de Ramas
- Crear una rama por problema.
- Convenci?n de nombre recomendada: `codex/<tipo>-<id-o-resumen-corto>`.
- Ejemplo: `codex/fix-login-timeout`.
- La rama `test` ser? la rama de integraci?n cuando exista.

## EN - Branching Strategy
- Create one branch per issue/problem.
- Recommended naming convention: `codex/<type>-<id-or-short-summary>`.
- Example: `codex/fix-login-timeout`.
- `test` will be the integration branch once it exists.

## ES - Pruebas
- Ejecutar `build` como prueba m?nima cuando aplique.
- Ejecutar pruebas de funcionamiento en funciones consideradas necesarias.
- Preferencia: pruebas automatizadas cuando existan; validaci?n manual cuando no existan.

## EN - Testing
- Run `build` as the minimum test when applicable.
- Run functional checks on functions considered necessary.
- Preference: automated tests when available; manual validation when not available.

## ES - Incidentes y Rollback (M?nimo)
Si una integraci?n causa incidencia:
1. Revertir el merge de la rama del problema.
2. Ejecutar validaci?n de build correspondiente.
3. Confirmar recuperaci?n del flujo base.

## EN - Incidents and Rollback (Minimum)
If an integration causes an incident:
1. Revert the merge of the issue branch.
2. Run the corresponding build validation.
3. Confirm base flow recovery.

## ES - Pendiente de Definici?n
- Roles y responsabilidades detalladas por agente.
- Qu? s? y qu? no espec?fico por rol.
- Est?ndares de calidad.
- Formato de commits.
- Reglas de PR/revisi?n.
- Formato de reportes de avance.

## EN - Pending Definition
- Detailed roles and responsibilities per agent.
- Specific do/don't rules per role.
- Quality standards.
- Commit format.
- PR/review rules.
- Progress reporting format.

## ES - Regla de Asignaci?n de Agente (Obligatoria)
- Toda tarea debe iniciar indicando el agente responsable.
- Si no se indica agente:
  - Usar `frontend-agent` por defecto para cambios en `src/`.
  - Usar `backend-agent` por defecto para cambios en `PHP`, rutas o controladores fuera de `src/`.
- Si la tarea es crear o actualizar acciones modulares dentro de `apis_me/<modulo>/`:
  - Usar `api-action-agent`.
- Si la tarea combina estructura frontend y desarrollo visual:
  - Primero `frontend-structure-agent`.
  - Despu?s `frontend-agent`.
- Si la tarea es documental:
  - Usar `documentation-agent`.

## EN - Agent Assignment Rule (Mandatory)
- Every task must start by indicating the responsible agent.
- If no agent is specified:
  - Use `frontend-agent` by default for changes in `src/`.
  - Use `backend-agent` by default for `PHP`, routes, or controllers outside `src/`.
- If the task is to create or update modular actions inside `apis_me/<module>/`:
  - Use `api-action-agent`.
- If the task combines frontend structure and visual implementation:
  - First `frontend-structure-agent`.
  - Then `frontend-agent`.
- If the task is documentation-focused:
  - Use `documentation-agent`.
- If the task is a security review, audit, or hardening analysis:
  - Use `security-review-agent`.


## ES - Regla de Evidencias con Fotos/Firma (Frontend + Backend)
- Los campos `photo`, `gallery` y `signature` siguen siendo **preguntas del formulario**.
- Su captura se sube de forma inmediata al endpoint de fotos para obtener referencia S3.
- La respuesta final de cada una de esas preguntas debe ser la referencia/nombre S3.
- Al enviar `save-text`, se deben incluir **todas** las respuestas, incluyendo `photo`, `gallery` y `signature` como referencia S3.
- No enviar base64 en `save-text` para esos tipos; solo referencia persistida.

## EN - Evidence Rule for Photo/Signature Fields (Frontend + Backend)
- `photo`, `gallery`, and `signature` are still **form questions**.
- Capture is uploaded immediately to the photo endpoint to obtain an S3 reference.
- The final answer value for those questions must be the S3 object name/reference.
- When submitting `save-text`, include **all** answers, including `photo`, `gallery`, and `signature` with their S3 reference.
- Do not send base64 in `save-text` for those types; send only persisted references.

## ES - Regla de Cierre de Tareas desde Formularios (Obligatoria)
- Cuando un formulario se abre desde tareas (`source=task`), al completar `save-text` con `ID_RC` se debe ejecutar cierre de tarea.
- Endpoint oficial de cierre:
  - `/apis_me/tareas/close/<ID_TAREA>/<CLV_CAPTURA>/<ESTATUS>/<ID_RC>/`
- Orden obligatorio de parametros:
  1. `ID_TAREA`
  2. `CLV_CAPTURA`
  3. `ESTATUS`
  4. `ID_RC`
- `ID_USUARIO` no debe viajar en la ruta de `close`; se resuelve desde `session_context` del modulo `tareas`.
- Despues de cerrar tarea correctamente:
  - Actualizar catalogo local de `tareas`.
  - Registrar tarea en catalogo local de terminadas.
  - Sincronizar listado de tareas del usuario.
  - Redirigir flujo a `#/tareas` para reinicio operativo.

## EN - Task Close Rule from Forms (Mandatory)
- When a form is opened from tasks (`source=task`), after successful `save-text` with `ID_RC`, task close must be executed.
- Official close endpoint:
  - `/apis_me/tareas/close/<ID_TAREA>/<CLV_CAPTURA>/<ESTATUS>/<ID_RC>/`
- Required parameter order:
  1. `ID_TAREA`
  2. `CLV_CAPTURA`
  3. `ESTATUS`
  4. `ID_RC`
- `ID_USUARIO` must not be sent in the `close` route; it is resolved from the `tareas` module `session_context`.
- After successful close:
  - Update local `tareas` catalog.
  - Register task in local completed catalog.
  - Sync user task list.
  - Redirect to `#/tareas` to restart the operational flow.

## ES - Endurecimiento de Sesion por Ruta (Frontend + Backend)
- Toda ruta privada en hash del modulo app debe validar sesion activa contra PHP (fuente de verdad), no solo estado local.
- Las rutas privadas registradas con `meta.requiresAuth` deben estar protegidas por guard global en `beforeEach` y verificacion de `getUser`.
- Si una sesion expira durante navegacion:
  - Mostrar aviso/modal de sesion expirada.
  - Limpiar estado sensible local (usuario + formulario activo + caches de sesion en storage).
  - Redirigir a `/login/default`.
- Evitar loops de redireccion usando bandera de control de logout en progreso.

## EN - Route Session Hardening (Frontend + Backend)
- Every private hash route in the app module must validate active session against PHP (source of truth), not only local state.
- Private routes marked with `meta.requiresAuth` must be protected by global `beforeEach` guard and `getUser` verification.
- If session expires during navigation:
  - Show session-expired message/modal.
  - Clear sensitive local state (user + active form + session-related storage caches).
  - Redirect to `/login/default`.
- Prevent redirect loops with an in-progress logout/session-expired flag.

## ES - Contrato de Sesion Expirada en API
- El endpoint `apis_me/form-engine/index.php` debe responder JSON uniforme cuando no exista sesion valida:
  - `success: false`
  - `code: "SESSION_EXPIRED"`
  - HTTP `401`
- Endpoints legacy pendientes de endurecimiento (documentados): `vistaPreviaQST`, `pdi`, `analiticsALG`.

## EN - Session Expired API Contract
- `apis_me/form-engine/index.php` must return uniform JSON when session is invalid/missing:
  - `success: false`
  - `code: "SESSION_EXPIRED"`
  - HTTP `401`
- Legacy endpoints still pending hardening (documented): `vistaPreviaQST`, `pdi`, `analiticsALG`.
