<?php
/**
*@description       Clase para el manejo de las diferentes operaciones en el modulo de Flujo de procesos
*@copyright         Air Logistics & GPS S.A. de C.V.  
*@author 			Gerardo Lara
*@version 			1.0.0
*/
class appSup{
	private $conn;
	
	// Método constructor para establecer la conexión
	public function __construct() {
		include "config/database.php";
		$this->conn = new mysqli($config_bd['host'], $config_bd['user'], $config_bd['pass'], $config_bd['bname']);
		$this->conn->set_charset("utf8mb4");
		if ($this->conn->connect_error) {
				die("Connection failed: " . $this->conn->connect_error);
		}
	}	
	// Método para recuperar los datos de la tabla en formato JSON
	public function getTableData($idCliente) {		
		$sql="SELECT ID_CANAL FROM CRM3_CANAL WHERE ID_CLIENTE=? AND DESCRIPCION='RONDINERO'";
		$stmt = $this->conn->prepare($sql);
		$stmt->bind_param("i", $idCliente);
		$stmt->execute();
		$row = $stmt->get_result();
		$data = $row->fetch_all(MYSQLI_ASSOC);		
		$idCanal=$data[0]["ID_CANAL"];		

		$query = "SELECT SG.ID_SUBGRUPO AS 'ID_SUBGRUPO',SG.DESCRIPCION AS 'SUBGRUPO',PE.DESCRIPCION AS 'PERIODICIDAD',SG.FRECUENCIA_VISITA AS 'FRECUENCIA VISITA',PF.ID_PDI_FORMATO,PF.ID_SUBGRUPO,PF.ID_OBJECT_MAP AS 'ID_OBJECT_MAP',GE.DESCRIPCION AS 'DESCRIPCION',GE.ITEM_NUMBER AS 'ITEM_NUMBER',GE.DIRECCION_CALCULADA AS 'DIRECCION '
		FROM CRM3_SUBGRUPO SG
			INNER JOIN CRM3_GRUPO GP ON GP.ID_GRUPO = SG.ID_GRUPO
			LEFT JOIN CRM3_PERIODOS PE ON SG.ID_PERIODO=PE.ID_PERIODO
			INNER JOIN CRM3_PDI_FORMATO PF ON SG.ID_SUBGRUPO=PF.ID_SUBGRUPO 
			INNER JOIN ADM_GEOREFERENCIAS GE ON PF.ID_OBJECT_MAP=GE.ID_OBJECT_MAP	  
		WHERE GP.ID_CANAL = ".$idCanal."
		AND GE.ID_CLIENTE='".$idCliente."' 
		ORDER BY SG.ID_SUBGRUPO,PF.ID_OBJECT_MAP";
		$result = $this->conn->query($query);

    if ($result) {
        $data = $result->fetch_all(MYSQLI_ASSOC);
    } else {
        $data = 0; // Si no hay resultados, colocamos 0
    }
		
    return json_encode($data);
	}	

	// Método destructor para cerrar la conexión
	public function __destruct() {
			$this->conn->close();
	}
}//fin de la clase Cuestionarios

?>