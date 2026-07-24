# endpoints relacionados

## listado de endpoints


### listar incidencias por usuario y nivel en resúmen

- Fecha de consulta

http://localhost:8070/apis_me/incidencias/listar/2026-07-16/


### listar usuarios que pertenecen al cliente

http://localhost:8070/apis_me/usuarios/listar/


### listar cuadrantes

http://localhost:8070/apis_me/cuadrantes/listar/


### Máximo de descargas por días

http://localhost:8070/apis_me/usuarios/maxdays/


### Listar incidencias con sus detalles 

- Fecha inicio
- Fecha fin
- Usuario seleccionado

http://localhost:8070/apis_me/incidencias/detalle/2026-07-20/2026-07-26/954/

### Leer incidencia

- 72507676 Evidencia
- OFICINA_ALG => itemNumber pdi

http://localhost:8070/apis_me/supervision/leer/72507676/OFICINA_ALG/

### Consultar configuracion rondineros

- Se ocupa el parámetro del ID_CLIENTE

http://localhost:8070/apis_me/usuarios/conf/


### Evidencias semanales

- fechai => 2026-07-20
- fechaf => 2026-07-26
- idf => 11113

/apis_me/reports/evidencesWeek/<fechai>/<fechaf>/<idf>/