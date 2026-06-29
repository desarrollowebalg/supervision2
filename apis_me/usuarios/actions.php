<?php
return array(
  "module" => "usuarios",
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
      "label" => "Listar usuarios activos por cliente",
      "params" => array(),
      "execution" => array(
        "type" => "query",
        "result_mode" => "list",
        "sql" => "SELECT
            ID_USUARIO,
            USUARIO,
            NOMBRE_COMPLETO AS NOMBRE,
            URL_FOTO_PERFIL
          FROM ADM_USUARIOS
          WHERE ID_CLIENTE = ?
          AND ESTATUS = 'Activo'",
        "bindings" => array(
          array(
            "source" => "property",
            "name" => "idCliente",
            "type" => "i",
          ),
        ),
      ),
    ),
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
