<?php
return array(
  "module" => "reports",
  "session_context" => array(
    array(
      "session_key" => "ID_CLIENTE",
      "property" => "idCliente",
      "type" => "int",
      "required" => true,
    ),
    array(
      "session_key" => "ID_USUARIO",
      "property" => "idUsuario",
      "type" => "int",
      "required" => true,
    ),
  ),
  "actions" => array(
    "ping" => array(
      "label" => "Validar disponibilidad del modulo reports",
      "params" => array(),
      "execution" => array(
        "type" => "query",
        "result_mode" => "single",
        "sql" => "SELECT
            ? AS ID_CLIENTE,
            ? AS ID_USUARIO,
            'reports' AS MODULE",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "idCliente",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "idUsuario",
            "type" => "i",
          ),
        ),
      ),
    ),
    "evidence" => array(
      "label" => "Obtener cabecera y detalle de evidencia por respuesta",
      "params" => array(
        array(
          "name" => "ide",
          "route_index" => 2,
          "type" => "int",
          "target_property" => "idResCuestionario",
          "error_label" => "ID EVIDENCIA",
        ),
      ),
      "execution" => array(
        "type" => "composed_query",
        "result_mode" => "list",
        "header_sql" => "SELECT RESP.ID_RES_CUESTIONARIO AS ID_RES_CUESTIONARIO,ID_CUESTIONARIO,FECHA,LATITUD,LONGITUD,BATERIA,FECHA_INICIO_CAPTURA,FECHA_RECEPCION,COD_USER,USU.USUARIO,USU.NOMBRE_COMPLETO,USU.URL_FOTO_PERFIL,GEORESP.ID_OBJECT_MAP AS CLV_GEO,DESCRIPCION,ITEM_NUMBER     
        FROM CRM2_RESPUESTAS RESP
        INNER JOIN ADM_USUARIOS USU ON RESP.COD_USER = USU.ID_USUARIO
        INNER JOIN ADM_GEOREFERENCIA_RESPUESTAS GEORESP ON RESP.ID_RES_CUESTIONARIO = GEORESP.ID_RES_CUESTIONARIO
        INNER JOIN ADM_GEOREFERENCIAS GEOREF ON GEORESP.ID_OBJECT_MAP = GEOREF.ID_OBJECT_MAP AND GEOREF.ID_CLIENTE = ?
        WHERE RESP.ID_RES_CUESTIONARIO = ?",
        "detail_sql_template" => "SELECT ID_RES_CUESTIONARIO,PREGRES.ID_PREGUNTA AS ID_PREGUNTA,PREGS.ITEM_NUMBER,PREGS.DESCRIPCION,RESPUESTA
          FROM %s PREGRES
          INNER JOIN CRM2_PREGUNTAS PREGS ON PREGRES.ID_PREGUNTA = PREGS.ID_PREGUNTA
          WHERE ID_RES_CUESTIONARIO = ?",
        "header_bindings" => array(
          array(
            "source" => "property",
            "name" => "idCliente",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "idResCuestionario",
            "type" => "i",
          ),
        ),
        "detail_bindings" => array(
          array(
            "source" => "property",
            "name" => "idResCuestionario",
            "type" => "i",
          ),
        ),
      ),
    ),
    "incidence" => array(
      "label" => "Obtener incidencia por identificador",
      "params" => array(
        array(
          "name" => "inc",
          "route_index" => 2,
          "type" => "int",
          "target_property" => "idIncidencia",
          "error_label" => "ID INCIDENCIA",
        ),
      ),
      "execution" => array(
        "type" => "query",
        "result_mode" => "list",
        "sql" => "SELECT ID,ID_USUARIO_CREO AS CREADA_POR,ID_ESTATUS,ID_TIPO_INC,ID_OBJECT_MAP,ID_EVIDENCIA,NIVEL
          FROM ADM_INCIDENCIAS
          WHERE ID = ?
          AND ID_CLIENTE = ?",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "idIncidencia",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "idCliente",
            "type" => "i",
          ),
        ),
      ),
    ),
    "history" => array(
      "label" => "Obtener historial de incidencia desde API externa",
      "params" => array(
        array(
          "name" => "inc",
          "route_index" => 2,
          "type" => "int",
          "target_property" => "idIncidencia",
          "error_label" => "ID INCIDENCIA",
        ),
      ),
      "execution" => array(
        "type" => "api",
        "method" => "GET",
        "url" => "https://ktw6p76syh.execute-api.us-east-1.amazonaws.com/DEV/Supervision/Incidencias/Historicos",
        "result_mode" => "list",
        "response_data_key" => "body",
        "body" => array(
          "USU" => array(
            "source" => "property",
            "name" => "idUsuario",
            "type" => "i",
            "cast" => "int",
          ),
          "IDI" => array(
            "source" => "property",
            "name" => "idIncidencia",
            "type" => "i",
            "cast" => "int",
          ),
        ),
      ),
    ),
    "evidencesWeek" => array(
      "label" => "Obtener evidencias semanales por rango y formulario desde API externa",
      "params" => array(
        array(
          "name" => "fechai",
          "route_index" => 2,
          "type" => "date",
          "target_property" => "fechaInicial",
          "error_label" => "FECHA INICIAL",
        ),
        array(
          "name" => "fechaf",
          "route_index" => 3,
          "type" => "date",
          "target_property" => "fechaFinal",
          "error_label" => "FECHA FINAL",
        ),
        array(
          "name" => "idf",
          "route_index" => 4,
          "type" => "int",
          "target_property" => "idFormulario",
          "error_label" => "ID FORMULARIO",
        ),
      ),
      "execution" => array(
        "type" => "api",
        "method" => "GET",
        "url" => "https://ktw6p76syh.execute-api.us-east-1.amazonaws.com/DEV/Reportes/RepEvForm",
        "result_mode" => "list",
        "response_data_key" => "body",
        "body" => array(
          "USU" => array(
            "source" => "property",
            "name" => "idUsuario",
            "type" => "i",
            "cast" => "int",
          ),
          "FECHA_I" => array(
            "source" => "property",
            "name" => "fechaInicialCompleta",
            "type" => "s",
            "cast" => "string",
          ),
          "FECHA_F" => array(
            "source" => "property",
            "name" => "fechaFinalCompleta",
            "type" => "s",
            "cast" => "string",
          ),
          "ID_F" => array(
            "source" => "property",
            "name" => "idFormulario",
            "type" => "i",
            "cast" => "int",
          ),
        ),
      ),
    ),
  ),
);
