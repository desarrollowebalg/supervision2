<?php
return array(
  "module" => "pdi_v3",
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
      "label" => "Listar PDI v3 por usuario",
      "params" => array(),
      "execution" => array(
        "type" => "query",
        "result_mode" => "list",
        "sql" => "SELECT
            GEO.ID_OBJECT_MAP,
            GEO.DESCRIPCION,
            GEO.ITEM_NUMBER,
            GEO.LATITUDE,
            GEO.LONGITUDE,
            GEO.DIRECCION_CALCULADA
          FROM ADM_GEOREFERENCIAS GEO
          INNER JOIN ADM_RH_USUARIO RU ON GEO.ID_OBJECT_MAP = RU.ID_RH
          WHERE GEO.ID_CLIENTE = ?
          AND RU.ID_USUARIO = ?
          AND GEO.ACTIVO = 'S'",
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
