<?php
return array(
  "module" => "entidad",
  "session_context" => array(
    array(
      "session_key" => "ID_USUARIO",
      "property" => "idUsuario",
      "type" => "int",
      "required" => true,
    ),
  ),
  "actions" => array(
    "entity" => array(
      "label" => "Consultar entidad por usuario de sesion",
      "params" => array(),
      "execution" => array(
        "type" => "query",
        "result_mode" => "single",
        "sql" => "SELECT
UN.COD_ENTITY AS \"COD_ENTITY\",
COALESCE(UN.DESCRIPTION,'') AS \"UNIDAD\",
COALESCE(E.PHONE,' ') AS \"TELEFONO\",
COALESCE(E.ITEM_NUMBER,'SIN ASIGNAR') AS \"IMEI\",
COALESCE(ET.DESCRIPTION,'SIN ASIGNAR') AS \"EQUIPO\"
FROM ADM_USUARIOS US
INNER JOIN ADM_UNIDADES UN ON UN.COD_ENTITY = US.COD_ENTITY_PWA
LEFT JOIN ADM_UNIDADES_EQUIPOS UE ON UE.COD_ENTITY = UN.COD_ENTITY
LEFT JOIN ADM_EQUIPOS E ON E.COD_EQUIPMENT = UE.COD_EQUIPMENT
LEFT JOIN ADM_EQUIPOS_TIPO ET ON ET.COD_TYPE_EQUIPMENT = E.COD_TYPE_EQUIPMENT
WHERE US.ID_USUARIO = ?
AND UN.ACTIVE= 1",
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
?>
