<?php
return array(
  "module" => "incidencias",
  "session_context" => array(
    array(
      "session_key" => "ID_USUARIO",
      "property" => "idUsuario",
      "type" => "int",
      "required" => true,
    ),
  ),
  "actions" => array(
    "listar" => array(
      "label" => "Listar incidencias por usuario desde API externa",
      "params" => array(
        array(
          "name" => "fechaInicial",
          "type" => "string",
          "required" => true,
          "route_index" => 2,
          "target_property" => "fechaInicial",
          "error_label" => "FECHA_INICIAL",
        ),
      ),
      "execution" => array(
        "type" => "api",
        "method" => "GET",
        "url" => "https://ktw6p76syh.execute-api.us-east-1.amazonaws.com/DEV/Supervision/ReporteSupervision",
        "result_mode" => "list",
        "empty_result_status" => 200,
        "empty_result_data" => array(),
        "headers" => array(
          "Content-Type: application/json",
        ),
        "body" => array(
          "IDU" => array(
            "source" => "property",
            "name" => "idUsuario",
            "cast" => "string",
          ),
          "FCI" => array(
            "source" => "property",
            "name" => "fechaInicial",
            "cast" => "string",
          ),
        ),
      ),
    ),
  ),
);
