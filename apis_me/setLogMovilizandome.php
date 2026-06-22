<?php 
	/**
	 * Configuración para guardar el log de los pdf's descargados
	 */
	class logPlataformaMovi{
		private $objDbCM;
		private $hostCM;
		private $portCM;
		private $bnameCM;		
		private $clienteID="";
		
		/**@description 	Método constructor*/
		function __construct($host,$usuario,$password,$base,$puerto) {//constructor
	  		$this->hostCM=$host;
	  		$this->portCM=$puerto;
	  		$this->bnameCM=$base;
	  		$this->userCM=$usuario;
	  		$this->passCM=$password;
   		}
   		/**@description 	Funcion para extraer un valor de una variable*/
		public function __get($name) { return $this->$name; }
		/**@description 	Funcion para añadir un valor a una variable*/
		public function __set($name, $value) { return $this->$name = $value; }
		/**@description 	Funcion para conectar con el servidor de base de datos*/
		private function conectarServer(){
			$this->objBd = mysqli_connect($this->hostCM, $this->userCM, $this->passCM, $this->bnameCM, $this->portCM);
			if(!$this->objBd)
				echo "Error al realizar la conexion con la base de datos";
		}
		/**@description 	Funcion que ejecuta el query en la base de datos*/
		public function ejecutarQuery($sql){
			$sql=@mysqli_query($this->objBd,$sql);
			if(!$sql){
				echo "Error no.".mysqli_errno($this->objBd);
			}else{
				return $sql;
			}
		}
		public function regresaResultados($result){/**@description 	Funcion que regresa el resultado de la consulta*/
			return @mysqli_fetch_array($result);
		}		
		public function numeroRegistros($result){/**@description 	Funcion que retorna el numero de registros del query ejecutado*/
			return @mysqli_num_rows($result);
		}
		public function liberarResultado($result){/**@description 	Funcion que libera de memoria el resultado de la consulta*/
			return @mysqli_free_result($result);
		}
		public function setLogPlataforma($info){
			//echo "props: ".$info;			
			$props=json_decode($info,1);			
			// echo "<pre>";
			// print_r($props);
			// echo "</pre>";
			$this->conectarServer();
			$this->ejecutarQuery("SET NAMES utf8");
			$sql="CALL INST_LOG_REP('".$props["ID_USUARIO"]."','".$props["CADENA_GENERADA"]."','".$props["ID_SQL"]."','".$props["IP_SERVIDOR"]."','".$props["IP_REMOTA"]."','".$props["DOMINIO"]."','".$props["LANGUAGE"]."','".$props["USER_AGENT"]."','".$props["ID_EVIDENCIA"]."')";
			//echo $sql."<br>";
			$res=$this->ejecutarQuery($sql);
		}
		private function erroresConfClientes($errorNo){/**@description 	Funcion que muestra los errores en la ejecucion del query*/
			switch ($errorNo) {
				case '100':
					$mensaje="Cliente no especificado";
				break;
				case "200":
					$mensaje="Sin archivo de configuracion especificado";
				break;
				case "300":
					$mensaje="Error al buscar la configuración del Cliente";
				break;
				default:
					$mensaje="Error desconocido";
				break;
			}
			echo $mensaje;exit();
		}
	}
?>