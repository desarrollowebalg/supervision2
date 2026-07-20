<?php
return array(
  "module" => "supervision",
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
      "label" => "Validar disponibilidad del modulo supervision",
      "params" => array(),
      "execution" => array(
        "type" => "query",
        "result_mode" => "single",
        "sql" => "SELECT
            ? AS ID_CLIENTE,
            ? AS ID_USUARIO,
            'supervision' AS MODULE",
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
    "leer" => array(
      "label" => "Crear y leer incidencia desde API externa de supervision",
      "params" => array(
        array(
          "name" => "ide",
          "route_index" => 2,
          "type" => "int",
          "target_property" => "idEvidencia",
          "error_label" => "ID EVIDENCIA",
        ),
        array(
          "name" => "item",
          "route_index" => 3,
          "type" => "string",
          "target_property" => "itemNumber",
          "error_label" => "ITEM",
        ),
      ),
      "execution" => array(
        "type" => "api",
        "method" => "POST",
        "url" => "https://ktw6p76syh.execute-api.us-east-1.amazonaws.com/DEV/Supervision/Incidencias",
        "result_mode" => "list",
        "response_data_key" => "body",
        "response_json_keys" => array("body"),
        "body" => array(
          "USU" => array(
            "source" => "property",
            "name" => "idUsuario",
            "type" => "i",
            "cast" => "int",
          ),
          "PDI" => array(
            "source" => "property",
            "name" => "itemNumber",
            "type" => "s",
            "cast" => "string",
          ),
          "EVD" => array(
            "source" => "property",
            "name" => "idEvidencia",
            "type" => "i",
            "cast" => "int",
          ),
        ),
      ),
    ),
  ),
);
