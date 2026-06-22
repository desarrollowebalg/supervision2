<?php
return array(
  "module" => "tareas",
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
    "listar" => array(
      "label" => "Listar tareas por usuario de sesion",
      "params" => array(
        array(
          "name" => "maxdays",
          "type" => "int",
          "required" => true,
          "route_index" => 2,
          "target_property" => "maxdays",
          "error_label" => "MAXDAYS",
        ),
      ),
      "execution" => array(
        "type" => "query",
        "result_mode" => "list",
        "sql" => "SELECT DISTINCT DT.ID_TAREA, B.ID_SERVICE, DT.TIPO_TAREA, GEO.RUTA_IMG_GEO AS IMG, DT.ID_CLIENTE, DT.NOMBRE_TAREA,
            DT.DESCRIPCION,
            CASE
            WHEN GEO.DIRECCION_CALCULADA IS NULL
                THEN DT.DIRECCION_CALCULADA_PDI
                ELSE GEO.DIRECCION_CALCULADA
            END as DIRECCION,
            DT.ID_PRIORIDAD, DT.ID_FORMULARIO,
            DT.ORDEN, DT.ITEM_NUMBER_PDI, GEO.LATITUDE, GEO.LONGITUDE,
            US.NOMBRE_COMPLETO AS CREADOR, DC.ID_STATUS AS S,
            DT.ID_RESPONSABLE_TAREA,
            DATE_FORMAT(DT.FECHA_PROGRAMADA, '%Y-%m-%d %T') AS FECHA_PROGRAMADA,
            DC.ID_STATUS,
            E.DESCRIPCION AS ESTATUS,
            DT.ITEM_NUMBER AS 'ITEM_NUMBER',
            DC.ID_CAPTURA AS 'CLV_CAPTURA' 
            FROM DSP2_TAREAS DT
            INNER JOIN DSP2_CAPTURA DC ON  DC.ID_TAREA = DT.ID_TAREA
            INNER JOIN DSP_ESTATUS E ON E.ID_ESTATUS = DC.ID_STATUS
            LEFT JOIN ADM_USUARIOS US ON US.ID_USUARIO = DT.ID_USUARIO_CREO
            LEFT JOIN B2C_MASTER_TASK B ON B.ID_TAREA = DT.ID_TAREA
            LEFT JOIN ADM_GEOREFERENCIAS GEO ON GEO.ITEM_NUMBER = DT.ITEM_NUMBER_PDI
            WHERE DC.ID_USUARIO = ? AND DC.ID_STATUS NOT IN (3, -1, 5, 9, 11)
            AND DT.FECHA_PROGRAMADA > DATE_SUB(NOW(), INTERVAL ? DAY)
            AND DT.FECHA_PROGRAMADA < DATE_ADD(NOW(), INTERVAL ? DAY)
            AND DT.ID_CLIENTE =  ?
            AND (GEO.ID_CLIENTE IS NULL OR GEO.ID_CLIENTE = ?
            OR (DT.ITEM_NUMBER_PDI = '' OR DT.ITEM_NUMBER_PDI IS NULL) )
            GROUP BY DT.ID_TAREA ORDER BY DT.ORDEN",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "idUsuario",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "maxdays",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "maxdays",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "idCliente",
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
    "updateStatus" => array(
      "label" => "Actualizar estatus de captura",
      "params" => array(
        array(
          "name" => "cid",
          "type" => "int",
          "required" => true,
          "route_index" => 2,
          "target_property" => "capId",
          "error_label" => "CID",
        ),
        array(
          "name" => "estatus",
          "type" => "int",
          "required" => true,
          "route_index" => 3,
          "target_property" => "status",
          "error_label" => "ESTATUS",
        ),
        array(
          "name" => "latitud",
          "type" => "string",
          "required" => true,
          "route_index" => 4,
          "target_property" => "latitud",
          "error_label" => "LATITUD",
        ),
        array(
          "name" => "longitud",
          "type" => "string",
          "required" => true,
          "route_index" => 5,
          "target_property" => "longitud",
          "error_label" => "LONGITUD",
        ),
      ),
      "execution" => array(
        "type" => "query",
        "result_mode" => "single",
        "empty_result_status" => 200,
        "empty_result_data" => array(),
        "sql" => "UPDATE DSP2_CAPTURA
          SET ID_STATUS = ?,
              FECHA_SALIDA_TAREA = CASE WHEN ? = 16 THEN DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') ELSE FECHA_SALIDA_TAREA END,
              LATLON_SALIDA_TAREA = CASE WHEN ? = 16 THEN CONCAT(?, ',', ?) ELSE LATLON_SALIDA_TAREA END,
              FECHA_ARRIBO = CASE WHEN ? = 13 THEN DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') ELSE FECHA_ARRIBO END,
              LATLON_ARRIBO = CASE WHEN ? = 13 THEN CONCAT(?, ',', ?) ELSE LATLON_ARRIBO END,
              FECHA_INICIO = CASE WHEN ? = 17 THEN DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') ELSE FECHA_INICIO END,
              LATLON_INICIO = CASE WHEN ? = 17 THEN CONCAT(?, ',', ?) ELSE LATLON_INICIO END,
              FECHA_TIEMPO_OPERACION = CASE WHEN ? = 17 THEN DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') ELSE FECHA_TIEMPO_OPERACION END,
              LATLON_TIEMPO_OPERACION = CASE WHEN ? = 17 THEN CONCAT(?, ',', ?) ELSE LATLON_TIEMPO_OPERACION END
          WHERE ID_CAPTURA = ?
            AND ID_STATUS NOT IN (3, -1, 5, 9, 11)",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "latitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "longitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "latitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "longitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "latitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "longitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "latitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "longitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "capId",
            "type" => "i",
          ),
        ),
      ),
    ),
    "close" => array(
      "label" => "Cerrar tarea con evidencia",
      
      "params" => array(
        array(
          "name" => "ID_TAREA",
          "type" => "int",
          "required" => true,
          "route_index" => 2,
          "target_property" => "taskId",
          "error_label" => "ID_TAREA",
        ),
        array(
          "name" => "CLV_CAPTURA",
          "type" => "int",
          "required" => true,
          "route_index" => 3,
          "target_property" => "capId",
          "error_label" => "CLV_CAPTURA",
        ),
        array(
          "name" => "estatus",
          "type" => "int",
          "required" => true,
          "route_index" => 4,
          "target_property" => "status",
          "error_label" => "ESTATUS",
        ),
        array(
          "name" => "ID_RC",
          "type" => "int",
          "required" => true,
          "route_index" => 5,
          "target_property" => "idrc",
          "error_label" => "ID_RC",
        ),
        array(
          "name" => "latitud",
          "type" => "string",
          "required" => true,
          "route_index" => 6,
          "target_property" => "latitud",
          "error_label" => "LATITUD",
        ),
        array(
          "name" => "longitud",
          "type" => "string",
          "required" => true,
          "route_index" => 7,
          "target_property" => "longitud",
          "error_label" => "LONGITUD",
        ),
      ),
      "execution" => array(
        "type" => "query",
        "result_mode" => "single",
        "empty_result_status" => 200,
        "empty_result_data" => array(
          "closed" => true,
        ),
        "sql" => "UPDATE DSP2_CAPTURA
          SET ID_STATUS = ?,
              ID_EVIDENCIA = ?,
              FECHA_FIN = DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'),
              LATLON_FIN = CONCAT(?, ',', ?)
          WHERE ID_CAPTURA = ?",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "status",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "idrc",
            "type" => "i",
          ),
          array(
            "source" => "property",
            "name" => "latitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "longitud",
            "type" => "s",
          ),
          array(
            "source" => "property",
            "name" => "capId",
            "type" => "i",
          ),
        ),
      ),
    ),
  ),
);
