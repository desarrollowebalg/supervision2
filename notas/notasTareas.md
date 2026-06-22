## Tareas del d�a solo cuando la configuracion del usuario sea solo 1 d�a
<code>
SELECT DISTINCT DT.ID_TAREA, B.ID_SERVICE, DT.TIPO_TAREA, GEO.RUTA_IMG_GEO AS IMG, DT.ID_CLIENTE, DT.NOMBRE_TAREA,
            DT.DESCRIPCION,
            CASE 
            WHEN GEO.DIRECCION_CALCULADA IS NULL
                THEN DT.DIRECCION_CALCULADA_PDI
                ELSE GEO.DIRECCION_CALCULADA
            END as DIRECCION,
            DT.ID_PRIORIDAD, DT.ID_FORMULARIO,
            DT.ORDEN, DT.ITEM_NUMBER_PDI, GEO.LATITUDE, GEO.LONGITUDE,
            US.NOMBRE_COMPLETO AS CREADOR, DC.ID_STATUS AS S,
        DT.ID_RESPONSABLE_TAREA,DATE_FORMAT(DT.FECHA_PROGRAMADA, '%Y-%m-%d %T') AS FECHA_PROGRAMADA
            FROM DSP2_TAREAS DT
            INNER JOIN DSP2_CAPTURA DC ON  DC.ID_TAREA = DT.ID_TAREA
            LEFT JOIN ADM_USUARIOS US ON US.ID_USUARIO = DT.ID_USUARIO_CREO
            LEFT JOIN B2C_MASTER_TASK B ON B.ID_TAREA = DT.ID_TAREA
            LEFT JOIN ADM_GEOREFERENCIAS GEO ON GEO.ITEM_NUMBER = DT.ITEM_NUMBER_PDI
            WHERE DC.ID_USUARIO = 954 AND DC.ID_STATUS NOT IN (3, -1, 5, 9, 11) 
            AND DT.ID_PRIORIDAD > 0 
            AND DT.FECHA_PROGRAMADA >= CURDATE()
            AND DT.FECHA_PROGRAMADA < CURDATE() + INTERVAL 1 DAY 
            AND DT.ID_CLIENTE =  1
            AND (GEO.ID_CLIENTE IS NULL OR GEO.ID_CLIENTE = 1  OR (DT.ITEM_NUMBER_PDI = '' OR DT.ITEM_NUMBER_PDI = NULL) )
            GROUP BY DT.ID_TAREA ORDER BY DT.ORDEN;
</code>

## Tareas del per�odo definido para el usuario, m�nimo son 7 d�as

<code>
SELECT DISTINCT DT.ID_TAREA, B.ID_SERVICE, DT.TIPO_TAREA, GEO.RUTA_IMG_GEO AS IMG, DT.ID_CLIENTE, DT.NOMBRE_TAREA,
            DT.DESCRIPCION,
            CASE 
            WHEN GEO.DIRECCION_CALCULADA IS NULL
                THEN DT.DIRECCION_CALCULADA_PDI
                ELSE GEO.DIRECCION_CALCULADA
            END as DIRECCION,
            DT.ID_PRIORIDAD, DT.ID_FORMULARIO,
            DT.ORDEN, DT.ITEM_NUMBER_PDI, GEO.LATITUDE, GEO.LONGITUDE,
            US.NOMBRE_COMPLETO AS CREADOR, DC.ID_STATUS AS S,
        DT.ID_RESPONSABLE_TAREA,DATE_FORMAT(DT.FECHA_PROGRAMADA, '%Y-%m-%d %T') AS FECHA_PROGRAMADA
            FROM DSP2_TAREAS DT
            INNER JOIN DSP2_CAPTURA DC ON  DC.ID_TAREA = DT.ID_TAREA
            LEFT JOIN ADM_USUARIOS US ON US.ID_USUARIO = DT.ID_USUARIO_CREO
            LEFT JOIN B2C_MASTER_TASK B ON B.ID_TAREA = DT.ID_TAREA
            LEFT JOIN ADM_GEOREFERENCIAS GEO ON GEO.ITEM_NUMBER = DT.ITEM_NUMBER_PDI
            WHERE DC.ID_USUARIO = 954 AND DC.ID_STATUS NOT IN (3, -1, 5, 9, 11) 
            AND DT.FECHA_PROGRAMADA > DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND DT.FECHA_PROGRAMADA < DATE_ADD(NOW(), INTERVAL 7 DAY)
            AND DT.ID_CLIENTE =  1 
            AND (GEO.ID_CLIENTE IS NULL OR GEO.ID_CLIENTE = 1
            OR (DT.ITEM_NUMBER_PDI = '' OR DT.ITEM_NUMBER_PDI = NULL) ) 
            GROUP BY DT.ID_TAREA ORDER BY DT.ORDEN;
</code>


### payloads

public function getGeoPoints($cli, $uId, $interval) {
        $result = array();
        $sql = "SELECT GEO.ID_OBJECT_MAP AS I, GEO.DESCRIPCION AS D, GEO.LONGITUDE AS LON, GEO.LATITUDE AS LAT,
 GEO.ITEM_NUMBER AS ITM, GEO.RADIO AS R 
	FROM ADM_GEOREFERENCIAS GEO
	INNER JOIN ADM_RH_USUARIO RP ON RP.ID_RH = GEO.ID_OBJECT_MAP AND RP.ID_USUARIO = $uId
	INNER JOIN ADM_USUARIO_PDI UP ON UP.ID_OBJECT_MAP = RP.ID_RH
        WHERE UP.ID_USUARIO = $uId
        AND GEO.ACTIVO = 'S'
        GROUP BY GEO.ID_OBJECT_MAP;";

        $sql2 = "SELECT GEO.ID_OBJECT_MAP AS I, GEO.DESCRIPCION AS D, GEO.LONGITUDE AS LON, GEO.LATITUDE AS LAT,
 GEO.ITEM_NUMBER AS ITM, GEO.RADIO AS R 
	FROM DSP2_TAREAS DT
	INNER JOIN DSP2_CAPTURA DC ON  DC.ID_TAREA = DT.ID_TAREA
	LEFT JOIN ADM_GEOREFERENCIAS GEO ON GEO.ITEM_NUMBER = DT.ITEM_NUMBER_PDI
        WHERE DC.ID_USUARIO = $uId AND DC.ID_STATUS NOT IN (3, -1, 5, 9, 11) 
        AND GEO.ACTIVO = 'S'
        AND DT.FECHA_PROGRAMADA > DATE_SUB(NOW(), INTERVAL $interval DAY)
        AND DT.FECHA_PROGRAMADA < DATE_ADD(NOW(), INTERVAL $interval DAY)  " .
                ($cli == '0' ? "" : " AND DT.ID_CLIENTE =  $cli ") .
                ($cli == '0' ? "" : " AND GEO.ID_CLIENTE =  $cli ") .
                "GROUP BY DT.ID_TAREA"; //*/

        if ($interval == 0) {
            $sql2 = "SELECT GEO.ID_OBJECT_MAP AS I, GEO.DESCRIPCION AS D, GEO.LONGITUDE AS LON, GEO.LATITUDE AS LAT,
     GEO.ITEM_NUMBER AS ITM, GEO.RADIO AS R 
            FROM DSP2_TAREAS DT
            INNER JOIN DSP2_CAPTURA DC ON  DC.ID_TAREA = DT.ID_TAREA
            LEFT JOIN ADM_GEOREFERENCIAS GEO ON GEO.ITEM_NUMBER = DT.ITEM_NUMBER_PDI
            WHERE DC.ID_USUARIO = $uId AND DC.ID_STATUS NOT IN (3, -1, 5, 9, 11) 
            AND GEO.ACTIVO = 'S'
            AND DT.FECHA_PROGRAMADA >= CURDATE()
            AND DT.FECHA_PROGRAMADA < CURDATE() + INTERVAL 1 DAY   " .
                    ($cli == '0' ? "" : " AND DT.ID_CLIENTE =  $cli ") .
                    ($cli == '0' ? "" : " AND GEO.ID_CLIENTE =  $cli ") .
                    "GROUP BY DT.ID_TAREA"; //*/
        }

        $res2 = $this->db->executeQueryAssocArray($sql2);
        $res1 = $this->db->executeQueryAssocArray($sql);

        try {
            foreach ($res1 as $valor) {
                $result[] = $valor;
            }
        } catch (Exception $ex) {
            
        }

        try {
            foreach ($res2 as $valor) {
                $result[] = $valor;
            }
        } catch (Exception $ex) {
            
        }

        return $result;
    }
