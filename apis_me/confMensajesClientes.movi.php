<?php 
	/**
	 * Configuracion de los metodos para saber si el cliente relacionado al usuario tiene algun mensaje pendiente por mostrar
	 * la configuracion se extrae dependiendo de una tabla en la base de datos
	 * ===================================================================================
	 * Cada usuario que haga login en el sistema se verificará la existencia de algun mensaje general
	 */
	// error_reporting(E_ALL);
	// ini_set('display_errors', '1');
	class mensajesClientesMovi{
		private $objDbCM;
		private $hostCM;
		private $portCM;
		private $bnameCM;
		private $userCM;
		private $passCM;
		private $clienteID="";
		private $mensajes=array();
		public $resultado="";
		/*
		*@method 		constructor
		*@description 	Método constructor
		*/
		function __construct($host,$usuario,$password,$base,$puerto) {//constructor
	  		$this->hostCM=$host;
	  		$this->portCM=$puerto;
	  		$this->bnameCM=$base;
	  		$this->userCM=$usuario;
	  		$this->passCM=$password;
   		}
   		/*
	  	*@method 		__get
	  	*@description 	Funcion para extraer un valor de una variable
	  	*/
		public function __get($name) { return $this->$name; }
		/*
	  	*@method 		__set
	  	*@description 	Funcion para añadir un valor a una variable
	  	*/
		public function __set($name, $value) { return $this->$name = $value; }
		/*
	  	*@method 		conectarServer
	  	*@description 	Funcion para conectar con el servidor de base de datos
	  	*/
		private function conectarServer(){
			$this->objBd = mysqli_connect($this->hostCM, $this->userCM, $this->passCM, $this->bnameCM, $this->portCM);
			if(!$this->objBd)
				echo "Error al realizar la conexion con la base de datos";

		}
		/*
	  	*@method 		ejecutarQuery
	  	*@description 	Funcion que ejecuta el query en la base de datos
	  	*/
		public function ejecutarQuery($sql){
			$sql=@mysqli_query($this->objBd,$sql);
			if(!$sql){
				echo "Error no.".mysqli_errno($this->objBd);
			}else{
				return $sql;
			}
		}
		/*
	  	*@method 		regresaResultados
	  	*@description 	Funcion que regresa el resultado de la consulta
	  	*/
		public function regresaResultados($result){
			return @mysqli_fetch_array($result);
		}
		/*
	  	*@method 		numeroRegistros
	  	*@description 	Funcion que retorna el numero de registros del query ejecutado
	  	*/
		public function numeroRegistros($result){
			return @mysqli_num_rows($result);
		}
		/*
	  	*@method 		liberarResultado
	  	*@description 	Funcion que libera de memoria el resultado de la consulta
	  	*/
		public function liberarResultado($result){
			return @mysqli_free_result($result);
		}
		/*
	  	*@method 		buscarMensajesClientesALG
	  	*@description 	Funcion que busca los mensajes asociados con el cliente
	  	*/
		public function buscarMensajesClientesALG(){
			if($this->clienteID==""){
				$this->erroresConfClientes(100);
			}else{
				$this->conectarServer();
				$this->ejecutarQuery("SET NAMES 'utf8'");
				//primero se extraen los mensajes globales
				//$sqlMT="SELECT * FROM ADM_MENSAJES WHERE DATE(FECHA_VENCIMIENTO) >= CURDATE() AND ESTATUS='vigente' AND ENVIAR_A='Todos' ORDER BY DATE(FECHA_VENCIMIENTO);";
				$sqlMT="SELECT * 
					FROM ADM_MENSAJES INNER JOIN ADM_USUARIOS ON ADM_MENSAJES.CREADO_POR=ADM_USUARIOS.ID_USUARIO
					WHERE DATE(FECHA_VENCIMIENTO) >= CURDATE() AND ADM_MENSAJES.ESTATUS='vigente' AND ENVIAR_A='Todos' ORDER BY DATE(ADM_MENSAJES.FECHA_CREACION)";
				$resMT=$this->ejecutarQuery($sqlMT);
				while($rowMT=$this->regresaResultados($resMT)){
					array_push($this->mensajes, $rowMT);
				}
				$this->liberarResultado($resMT);
				// echo "sqlMT => ".$sqlMT."<br>";
				$this->ejecutarQuery("SET NAMES 'utf8'");
				$sqlMP="SELECT ADM_MENSAJES.ID_MENSAJE,ADM_MENSAJES.FECHA_CREACION,CREADO_POR,FECHA_VENCIMIENTO,MENSAJE,TIPO,ENVIAR_A,ENVIAR_A_CLIENTES,ADM_MENSAJES.ESTATUS,ADM_MENSAJES_CLIENTES.ID_MENSAJES_CLIENTES,ADM_MENSAJES.ID_MENSAJE,ADM_MENSAJES_CLIENTES.ID_CLIENTE,NOMBRE_COMPLETO,USUARIO,URL_FOTO_PERFIL  
				FROM ADM_MENSAJES INNER JOIN ADM_MENSAJES_CLIENTES ON ADM_MENSAJES.ID_MENSAJE=ADM_MENSAJES_CLIENTES.ID_MENSAJE
					INNER JOIN ADM_USUARIOS ON ADM_MENSAJES.CREADO_POR=ADM_USUARIOS.ID_USUARIO
				WHERE DATE(FECHA_VENCIMIENTO) >= CURDATE() AND ADM_MENSAJES.ESTATUS='vigente' AND ENVIAR_A='diff' AND ADM_MENSAJES_CLIENTES.ID_CLIENTE='".$this->clienteID."'
				ORDER BY TIPO DESC";
				$resMP=$this->ejecutarQuery($sqlMP);
				while($rowMP=$this->regresaResultados($resMP)){
					array_push($this->mensajes, $rowMP);
				}
				$this->liberarResultado($resMP);
				// echo "sqlMP => ".$sqlMP."<br>";
				return $this->mensajes;
			}
		}
		/*
	  	*@method 		erroresConfClientes
	  	*@description 	Funcion que muestra los errores en la ejecucion del query
	  	*/
		private function erroresConfClientes($errorNo){
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