<?php
return array(
  "module" => "cuadrantes",
  "session_context" => array(
    array(
      "session_key" => "ID_CLIENTE",
      "property" => "idCliente",
      "type" => "int",
      "required" => true,
    ),
  ),
  "actions" => array(
    "listar" => array(
      "label" => "Listar cuadrantes por cliente usando canal RONDINERO",
      "params" => array(),
      "execution" => array(
        "type" => "query_chain",
        "result_mode" => "list",
        "steps" => array(
          array(
            "key" => "canal",
            "result_mode" => "single",
            "sql" => "SELECT ID_CANAL
              FROM CRM3_CANAL
              WHERE ID_CLIENTE = ?
              AND DESCRIPCION = 'RONDINERO'",
            "bindings" => array(
              array(
                "source" => "property",
                "name" => "idCliente",
                "type" => "i",
              ),
            ),
          ),
          array(
            "key" => "cuadrantes",
            "result_mode" => "list",
            "sql" => "SELECT
                SG.ID_SUBGRUPO AS ID_SUBGRUPO,
                SG.DESCRIPCION AS SUBGRUPO,
                PE.DESCRIPCION AS PERIODICIDAD,
                SG.FRECUENCIA_VISITA AS 'FRECUENCIA_VISITA',
                PF.ID_PDI_FORMATO,
                PF.ID_SUBGRUPO,
                PF.ID_OBJECT_MAP AS ID_OBJECT_MAP,
                GE.DESCRIPCION AS DESCRIPCION,
                GE.ITEM_NUMBER AS ITEM_NUMBER,
                GE.DIRECCION_CALCULADA AS 'DIRECCION'
              FROM CRM3_SUBGRUPO SG
              INNER JOIN CRM3_GRUPO GP ON GP.ID_GRUPO = SG.ID_GRUPO
              LEFT JOIN CRM3_PERIODOS PE ON SG.ID_PERIODO = PE.ID_PERIODO
              INNER JOIN CRM3_PDI_FORMATO PF ON SG.ID_SUBGRUPO = PF.ID_SUBGRUPO
              INNER JOIN ADM_GEOREFERENCIAS GE ON PF.ID_OBJECT_MAP = GE.ID_OBJECT_MAP
              WHERE GP.ID_CANAL = ?
              AND GE.ID_CLIENTE = ?
              ORDER BY SG.ID_SUBGRUPO, PF.ID_OBJECT_MAP",
            "bindings" => array(
              array(
                "source" => "step_field",
                "step" => "canal",
                "field" => "ID_CANAL",
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
    ),
  ),
);
