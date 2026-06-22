# AGENTS.md - tareas

## Proposito
Documentar el contrato tecnico del modulo `apis_me/tareas` para listado, transiciones de estatus y cierre de tarea con evidencia.

## session_context del modulo

- `ID_CLIENTE` -> `idCliente`
- `ID_USUARIO` -> `idUsuario`

Regla:
- `ID_USUARIO` se resuelve desde sesion y no debe viajar como parametro en la ruta `close`.

## Endpoints del modulo

### 1) Listado de tareas

- Ruta: `GET /apis_me/tareas/listar/<maxdays>/`
- Parametros:
  - `maxdays` (int, route index 2)
- Resultado:
  - Lista de tareas asignadas al usuario de sesion.
  - Excluye estatus cerrados/cancelados definidos en query.

### 2) Cambio de estatus operativo

- Ruta: `GET /apis_me/tareas/updateStatus/<CLV_CAPTURA>/<ESTATUS>/`
- Parametros:
  - `CLV_CAPTURA` (route name: `cid`, int, route index 2)
  - `ESTATUS` (route name: `estatus`, int, route index 3)
- Efecto:
  - Actualiza `DSP2_CAPTURA.ID_STATUS`.

### 3) Cierre de tarea con evidencia

- Ruta: `GET /apis_me/tareas/close/<ID_TAREA>/<CLV_CAPTURA>/<ESTATUS>/<ID_RC>/`
- Orden obligatorio de parametros:
1. `ID_TAREA` (int, route index 2)
2. `CLV_CAPTURA` (int, route index 3)
3. `ESTATUS` (int, route index 4)
4. `ID_RC` (int, route index 5)
- Efecto:
  - `ID_STATUS = <ESTATUS>`
  - `ID_EVIDENCIA = <ID_RC>`
  - `FECHA_FIN = NOW()`
  - Registro objetivo: `ID_CAPTURA = <CLV_CAPTURA>`

## Integracion esperada con evidences

1. Frontend envia formulario (`save-text`) y obtiene `ID_RC`.
2. Frontend invoca `close` con el `ID_RC` recibido.
3. `close` vincula captura con evidencia (`ID_EVIDENCIA`) y finaliza tarea.
