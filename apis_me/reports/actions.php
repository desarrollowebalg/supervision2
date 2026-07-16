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
        "header_sql" => "SELECT ID_RES_CUESTIONARIO,ID_CUESTIONARIO,FECHA,LATITUD,LONGITUD,BATERIA,FECHA_INICIO_CAPTURA,FECHA_RECEPCION,COD_USER,USU.USUARIO,USU.NOMBRE_COMPLETO,USU.URL_FOTO_PERFIL        
        FROM CRM2_RESPUESTAS RESP
        INNER JOIN ADM_USUARIOS USU ON RESP.COD_USER = USU.ID_USUARIO
        WHERE ID_RES_CUESTIONARIO = ?",
        "detail_sql_template" => "SELECT
            ID_PREGUNTA,
            ID_RES_CUESTIONARIO,
            RESPUESTA
          FROM %s
          WHERE ID_RES_CUESTIONARIO = ?",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "idResCuestionario",
            "type" => "i",
          ),
        ),
      ),
    ),
  ),
);
