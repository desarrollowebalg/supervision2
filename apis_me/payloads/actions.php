<?php
return array(
  "module" => "payloads",
  "session_context" => array(
    array(
      "session_key" => "ID_USUARIO",
      "property" => "idUsuario",
      "type" => "int",
      "required" => true,
    ),
  ),
  "actions" => array(
    "list" => array(
      "label" => "Obtener payloads por usuario en sesion",
      "params" => array(),
      "execution" => array(
        "type" => "query",
        "result_mode" => "list",
        "sql" => "SELECT Q.ID_TIPO AS TIPO, G.ITEM_NUMBER AS COD_OBJECT_MAP,
    GP.ID_CUESTIONARIO,
    GP.ID_TAREA,
    GP.CADENA_PAYLOAD,GP.ID_PAYLOAD,
    GP.ID_OBJECT_MAP,G.DESCRIPCION 
FROM ADM_GEO_PAYLOAD GP
    INNER JOIN ADM_GEOREFERENCIAS G ON G.ID_OBJECT_MAP = GP.ID_OBJECT_MAP AND G.ID_CLIENTE = CTEXUS(?,1) 
    INNER JOIN CRM2_VENDEDOR_CUESTIONARIO VC ON VC.ID_CUESTIONARIO = GP.ID_CUESTIONARIO 
    INNER JOIN CRM2_CUESTIONARIOS Q ON Q.ID_CUESTIONARIO = VC.ID_CUESTIONARIO
    INNER JOIN ADM_RH_USUARIO RU ON RU.ID_RH = GP.ID_OBJECT_MAP AND RU.ID_USUARIO = VC.COD_USER
 WHERE  VC.COD_USER= ?
    AND Q.ACTIVO = 'S'",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "idUsuario",
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
    "tasks" => array(
      "label" => "Obtener payloads por tareas y rango de dias",
      "params" => array(
        array(
          "name" => "maxDays",
          "type" => "int",
          "required" => true,
          "route_index" => 2,
          "target_property" => "maxDays",
          "error_label" => "maxDays",
        ),
      ),
      "execution" => array(
        "type" => "query",
        "result_mode" => "list",
        "sql" => "SELECT Q.ID_TIPO AS TIPO, G.ITEM_NUMBER AS COD_OBJECT_MAP,
    GP.ID_CUESTIONARIO,
    GP.ID_TAREA,
    GP.CADENA_PAYLOAD,GP.ID_PAYLOAD,
    GP.ID_OBJECT_MAP,G.DESCRIPCION 
FROM ADM_GEO_PAYLOAD GP
    INNER JOIN ADM_GEOREFERENCIAS G ON G.ID_OBJECT_MAP = GP.ID_OBJECT_MAP AND G.ID_CLIENTE = CTEXUS(?,1) 
    INNER JOIN CRM2_VENDEDOR_CUESTIONARIO VC ON VC.ID_CUESTIONARIO = GP.ID_CUESTIONARIO 
    INNER JOIN CRM2_CUESTIONARIOS Q ON Q.ID_CUESTIONARIO = VC.ID_CUESTIONARIO
    INNER JOIN ADM_RH_USUARIO RU ON RU.ID_RH = GP.ID_OBJECT_MAP AND RU.ID_USUARIO = VC.COD_USER
    INNER JOIN DSP2_TAREAS T FORCE INDEX FOR ORDER BY (ITEM_CTE_PDI) ON T.ITEM_NUMBER_PDI = G.ITEM_NUMBER AND T.ID_CLIENTE = CTEXUS(?,1) AND T.FECHA_PROGRAMADA BETWEEN CONCAT(SUBDATE(CURDATE(),?),' 00:00') and CONCAT(ADDDATE(CURDATE(),?), ' 23:59')
 WHERE  VC.COD_USER=?
    AND Q.ACTIVO = 'S'",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "idUsuario",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "idUsuario",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "maxDays",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "maxDays",
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
    "echo" => array(
      "label" => "Echo de payload recibido en ruta",
      "params" => array(
        array(
          "name" => "payload",
          "type" => "string",
          "required" => true,
          "route_index" => 2,
          "target_property" => "payload",
          "error_label" => "payload",
        ),
      ),
      "execution" => array(
        "type" => "query",
        "result_mode" => "single",
        "sql" => "SELECT ? AS payload, ? AS id_usuario, ? AS id_cliente",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "payload",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "idUsuario",
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
  ),
);
