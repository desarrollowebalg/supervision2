<?php
return array(
  "module" => "forms",
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
    "list" => array(
      "label" => "Listar formularios por usuario",
      "params" => array(),
      "execution" => array(
        "type" => "query",
        "result_mode" => "list",
        "sql" => "SELECT
            QST.ID_CUESTIONARIO AS CLV,
            QST.ITEM_NUMBER,
            QST.DESCRIPCION,
            QST.ID_TIPO,
            QST.TEMA,
            QST.TAGS
          FROM CRM2_CUESTIONARIOS QST
          INNER JOIN CRM2_VENDEDOR_CUESTIONARIO RESP ON QST.ID_CUESTIONARIO = RESP.ID_CUESTIONARIO
          INNER JOIN ADM_USUARIOS USU ON RESP.COD_USER = USU.ID_USUARIO
          WHERE QST.COD_CLIENT = ?
          AND RESP.COD_USER = ?
          AND QST.ACTIVO = 'S'
          AND QST.PERTENECE_A = 'E'",
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
  ),
);
