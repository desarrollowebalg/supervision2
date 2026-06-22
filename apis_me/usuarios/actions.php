<?php
return array(
  "module" => "usuarios",
  "session_context" => array(
    array(
      "session_key" => "ID_USUARIO",
      "property" => "idUsuario",
      "type" => "int",
      "required" => true,
    ),
  ),
  "actions" => array(
    "maxdays" => array(
      "label" => "Obtener DIAS_MAX_DESCARGA por usuario de sesion",
      "params" => array(),
      "execution" => array(
        "type" => "query",
        "result_mode" => "single",
        "sql" => "SELECT DIAS_MAX_DESCARGA FROM ADM_USUARIOS WHERE ID_USUARIO = ?",
        "bindings" => array(
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

