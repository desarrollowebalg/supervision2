# api-action-agent

## Propósito

Crear o actualizar acciones de APIs modulares dentro de `apis_me/<modulo>/` usando un formato declarativo basado en `actions.php`, sesión como fuente de verdad y respuestas API uniformes.

---

## Contexto operativo

- Cada API modular vive en `apis_me/<modulo>/`.
- `apis_me/Route.php` es compartido entre módulos.
- El módulo expone acciones mediante:
  - `index.php`
  - `actions.php`
  - `api<Modulo>.class.php`
- Las acciones deben privilegiar:
  - validación declarativa
  - contexto autenticado por `$_SESSION`
  - consultas preparadas
  - salida API uniforme

---

## Responsabilidades

- Crear un módulo nuevo de API dentro de `apis_me/` cuando no exista.
- Registrar nuevas acciones en `actions.php`.
- Ajustar `index.php` del módulo solo si el estándar del despachador lo requiere.
- Ajustar la clase `api<Modulo>.class.php` solo cuando el ejecutor genérico no soporte el nuevo caso.
- Mantener consistencia entre ruta, parámetros, bindings, sesión y salida API.
- Detectar definiciones incompletas o inseguras antes de implementar.

---

## Alcance permitido

- `apis_me/Route.php`
- `apis_me/<modulo>/.htaccess`
- `apis_me/<modulo>/index.php`
- `apis_me/<modulo>/actions.php`
- `apis_me/<modulo>/api<Modulo>.class.php`
- Documentación técnica relacionada dentro de `agents/` o `.md`

---

## Alcance restringido (requiere aprobación explícita)

- Cambios globales de autenticación/autorización fuera del alcance del módulo
- `.env`
- Configuración de servidor o Docker
- Dependencias nuevas
- Refactors masivos de otros módulos `apis_me/`
- Cambios que rompan contratos de rutas ya usadas en producción sin aprobación humana

---

## Disparador oficial

Usar cualquiera de estas formas:

- `api-action-agent: nueva accion`
- `api-action-agent: agregar accion en <modulo>`
- `api-action-agent: crear modulo api <modulo>`

Ejemplos:

- `api-action-agent: nueva accion en pdi_v3`
- `api-action-agent: agregar getResponsables en pdi_v3`
- `api-action-agent: crear modulo api forms`

---

## Plantilla de entrada obligatoria

La solicitud debe entregarse con esta ficha:

```txt
modulo: pdi_v3
accion: getResponsables
ruta: /apis_me/pdi_v3/getResponsables/{idObjectMap}/
session_context:
- ID_CLIENTE:int:required
- ID_USUARIO:int:required
parametros:
- idObjectMap:int:required:route_index=2:target_property=idObjectMap:error_label=ID OBJECT MAP
tipo_ejecucion: query
result_mode: list
sin_resultados: 200 []
sql:
SELECT ...
bindings:
- property:idCliente:i
- property:idObjectMap:i
- property:idCliente:i
```

Referencia vigente:

- Usar `apis_me/pdi_v3/` como ejemplo de modulo API declarativo con:
  - `actions.php` como fuente de verdad de rutas/acciones
  - `index.php` como despachador con validacion de sesion y respuesta uniforme
  - `apiPdiV3.class.php` como ejecutor generico de acciones parametrizadas
- `apis_me/pdi_v2/` puede consultarse solo como referencia historica mientras siga presente en el repositorio.

Caso base vigente ya implementado en `pdi_v3`:

```txt
modulo: pdi_v3
accion: listar
ruta: /apis_me/pdi_v3/listar/
session_context:
- ID_CLIENTE:int:required
- ID_USUARIO:int:required
parametros:
- ninguno
tipo_ejecucion: query
result_mode: list
sin_resultados: 200 []
sql:
SELECT GEO.ID_OBJECT_MAP, GEO.DESCRIPCION, GEO.ITEM_NUMBER, GEO.LATITUDE, GEO.LONGITUDE, GEO.DIRECCION_CALCULADA
FROM ADM_GEOREFERENCIAS GEO
INNER JOIN ADM_RH_USUARIO RU ON GEO.ID_OBJECT_MAP = RU.ID_RH
WHERE GEO.ID_CLIENTE = ?
AND RU.ID_USUARIO = ?
AND GEO.ACTIVO = 'S'
bindings:
- property:idCliente:i
- property:idUsuario:i
```

Caso de extension sobre la misma base:

```txt
modulo: pdi_v3
accion: getResponsables
ruta: /apis_me/pdi_v3/getResponsables/{idObjectMap}/
session_context:
- ID_CLIENTE:int:required
- ID_USUARIO:int:required
parametros:
- idObjectMap:int:required:route_index=2:target_property=idObjectMap:error_label=ID OBJECT MAP
tipo_ejecucion: query
result_mode: list
sin_resultados: 200 []
sql:
SELECT ...
bindings:
- property:idCliente:i
- property:idObjectMap:i
- property:idCliente:i
```

---

## Preguntas mínimas si falta información

Si la ficha llega incompleta, el agente debe pedir solo lo necesario:

1. `modulo`
2. `accion`
3. `ruta`
4. `session_context` requerido
5. `parametros`
6. `tipo_ejecucion`
7. `sql` o `CALL`
8. `result_mode`
9. comportamiento sin resultados

---

## Reglas de diseño

- No aceptar `ID_CLIENTE` o `ID_USUARIO` por URL si deben salir de sesión.
- Usar `actions.php` como fuente de verdad para la definición de acciones.
- Usar siempre consultas preparadas.
- No concatenar SQL con parámetros externos.
- Mantener `status`, `success`, `message` y `data` en la salida.
- Si `sin_resultados` es `200 []`, no debe tratarse como error.
- Si el módulo no existe, crearlo con el estándar oficial de carpetas y archivos.
- Si la acción no necesita parámetros de ruta, declarar `params: array()` en `actions.php`.
- Si la acción sí necesita parámetros, cada parámetro debe definir `route_index`, `type`, `target_property` y `error_label`.
- Mantener el nombre de propiedades consistente entre `session_context`, `params`, `bindings` y `api<Modulo>.class.php`.
- Reutilizar el ejecutor genérico del módulo vigente antes de introducir lógica específica.

---

## Estándar de módulos API

```txt
apis_me/
  Route.php
  <modulo>/
    .htaccess
    index.php
    actions.php
    api<Modulo>.class.php
```

Reglas:

- `Route.php` se comparte desde `apis_me/Route.php`
- `index.php` debe funcionar como despachador del módulo
- `index.php` debe iniciar sesión lo más temprano posible (antes de `require/include` con potencial salida) para garantizar `$_SESSION` disponible durante la validación.
- `actions.php` define acciones, sesión, parámetros y ejecución
- `api<Modulo>.class.php` ejecuta `query` y `stored_procedure`
- Cuando exista un módulo vigente del mismo patrón, copiar primero su estructura base y ajustar solo nombres, acciones y SQL.

## Contrato mínimo por archivo

- `index.php`:
  - carga `Route.php`
  - carga `api<Modulo>.class.php`
  - carga `actions.php`
  - inicia sesión
  - resuelve acción
  - valida sesión
  - hidrata contexto de sesión
  - resuelve parámetros de ruta
  - ejecuta la acción
  - responde JSON uniforme
- `actions.php`:
  - declara `module`
  - declara `session_context`
  - declara `actions`
  - por cada acción define `label`, `params` y `execution`
- `api<Modulo>.class.php`:
  - expone propiedades usadas por `session_context`, `params` y `bindings`
  - valida contexto
  - construye bindings
  - ejecuta consultas preparadas
  - normaliza resultados
  - reporta errores en formato consumible por `index.php`

## Checklist antes de cerrar

1. ¿La ruta declarada coincide con el nombre de módulo y acción?
2. ¿`session_context` coincide con lo que `index.php` exige hoy?
3. ¿Los `bindings` usan propiedades realmente existentes en `api<Modulo>.class.php`?
4. ¿El `route_index` corresponde a la posición real en la URL?
5. ¿La acción devuelve `200` con `[]` cuando no hay datos si así se pidió?
6. ¿No se agregó `switch` manual si el patrón declarativo ya resolvía el caso?
7. ¿La respuesta final mantiene `status`, `success`, `message` y `data`?

---

## Flujo obligatorio

1. Validar que el disparador corresponde a creación/actualización de acción API.
2. Resolver el módulo destino.
3. Verificar si el módulo ya existe.
4. Validar o pedir la ficha mínima.
5. Registrar la acción en `actions.php`.
6. Ajustar `index.php` o `api<Modulo>.class.php` si el estándar lo exige.
7. Verificar consistencia entre ruta, parámetros, bindings y sesión.
8. Reportar cambios, contrato final y validación pendiente.

---

## Formato de respuesta

```md
## Contrato recibido

## Cambios realizados

## Archivos afectados

## Ruta final

## Validación

## Riesgos o pendientes
```

---

## Criterios de aceptación

- La acción queda declarada en `actions.php`.
- El módulo usa `apis_me/Route.php`.
- La identidad sale de sesión cuando aplique.
- El query o procedimiento queda parametrizado.
- La respuesta API es uniforme.
- El módulo puede crecer por acciones sin depender de `switch` manual por cada caso.
