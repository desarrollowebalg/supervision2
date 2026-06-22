<?php 
	/**
	 * Configuracion de las variables para colocar los mapas de los diferentes clientes
	 * se lee la configuración que esta contenida en archivos de configuracion y se mandan a la aplicacion.
	 * ===================================================================================
	 * Cada cliente cuenta con una configuracion inicial la cual es inicialmente para todos los clientes
	 * posteriormente cada archivo se personalizara con las opciones de cada cliente
	 * ***********************************************************************************
	 * Modificacion 5 de Agosto de 2016
	 * Se corrigio la forma en como se accede al servidor de BD y se agregaron funciones para su manejo
	 */
	class confClientesMovi{
		private $objDbCM;
		private $hostCM;
		private $portCM;
		private $bnameCM;
		private $userCM;
		private $passCM;
		private $clienteID="";
		private $confCliente="";
		private $configuracion="";
		private $resultadoConf="";
		/************************************* 
		****** Configuraciones Globales ******
		**************************************/
		private $tipoConf="Produccion";
		//nombre del directorio raiz del sitio
		private $nameDirSite="betamovilizandome";
		//directorio donde estan los archivos de configuracion
		private $pathConfig = '../config/';
		//directorio donde estan los archivos de configuracion de los clientes
		//private $pathConfigCliente="../config/me_conf/";
		private $pathConfigCliente="/config/me_conf/";
		//archivo de configuracion por default que se cargara en caso de que no se cumplan todas las condiciones
		private $fileConfiguracion ='me_conf/confDefault.json';
		//ruta del archivo de configuracion de la base de datos
		private $pathConfDatabase="";
		//ruta donde se deposita la ruta completa del archivo
		private $fileConfigDefault="";
		//ubicaciones del API en los diferentes servidores
		private $ubicacionesAPI="";
		private $perfilUsuario="";
		public $moduloInicial="";//retorna el modulo inicial para el usuario que esta entrando a la plataforma
		public $usuarioLogin="";//se setea el usuario para comparar
		public $statusCliente="";//retorna el status del cliente
		public $idEmpresa="";
		private $logoEmpresa="";
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
		public function buscarConfCliente(){/**@description 	Funcion que busca la configuracion del cliente*/
			if($this->clienteID==""){
				$this->erroresConfClientes(100);
			}else if($this->clienteID){
				$this->conectarServer();
				$sqlCC="SELECT ARCHIVO_CONF FROM ADM_CLIENTES WHERE ID_CLIENTE='".$this->clienteID."'";
				if($this->ejecutarQuery($sqlCC)){
					$resCC=$this->ejecutarQuery($sqlCC);
					$rowCC=$this->regresaResultados($resCC);
					if($rowCC["ARCHIVO_CONF"]==""){
						$this->erroresConfClientes(200);
					}else{
						$this->configuracion=$rowCC["ARCHIVO_CONF"].".json";
						$this->resultadoConf=$this->cargarConfiguracionCliente();	
					}
				}else{
					$this->erroresConfClientes(300);
				}
				return $this->resultadoConf;
			}
			$this->liberarResultado($resCC);
		}
		private function cargarConfiguracionCliente(){/**@description 	Funcion que extrae la informacion de configuracion del cliente*/
			if($this->configuracion==""){
				$this->erroresConfClientes(200);
			}else{
				//$_SERVER["DOCUMENT_ROOT"] . "/".$this->nameDirSite.$this->pathConfigCliente;
				if($this->tipoConf=="Produccion"){
					$ficheros1  = scandir($_SERVER["DOCUMENT_ROOT"] . "/".$this->pathConfigCliente);//produccion
				}else if($this->tipoConf=="Dev"){
					$ficheros1  = scandir($_SERVER["DOCUMENT_ROOT"] . "/".$this->nameDirSite.$this->pathConfigCliente);//desarrollo
				}
				//$ficheros1  = scandir($_SERVER["DOCUMENT_ROOT"] . "/".$this->nameDirSite.$this->pathConfigCliente);//desarrollo
				//$ficheros1  = scandir($_SERVER["DOCUMENT_ROOT"] . "/".$this->pathConfigCliente);//produccion
				foreach ($ficheros1 as $key => $value) {
					if($value!="." && $value!=".."){
						if($value==$this->configuracion){
							if($this->tipoConf=="Produccion"){
								$datosConf=file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/".$this->pathConfigCliente."/".$value);//produccion
							}else if($this->tipoConf=="Dev"){
								$datosConf=file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/".$this->nameDirSite.$this->pathConfigCliente."/".$value);//desarrollo
							}
							//$datosConf=file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/".$this->nameDirSite.$this->pathConfigCliente."/".$value);//desarrollo
							//$datosConf=file_get_contents($_SERVER["DOCUMENT_ROOT"] . "/".$this->pathConfigCliente."/".$value);//produccion
						}
					}
				}
				return $datosConf;
			}
		}
		public function verificarModuloPrincipal(){/**@method 	metodo que valida la informacion del perfil*/
			$mensaje="";
			$this->conectarServer();
			$sqlPP="SELECT ADM_PERFILES.ID_PERFIL,DESCRIPCION,ESTATUS,ADM_PERFIL_PERMISOS.ID_SUBMENU,DESCRIPTION,UBICACION,TIPO,ACCION,ACTIVO,ADM_SUBMENU.TIPO
			FROM ADM_PERFILES 
				INNER JOIN ADM_PERFIL_PERMISOS ON ADM_PERFILES.ID_PERFIL=ADM_PERFIL_PERMISOS.ID_PERFIL
				INNER JOIN ADM_SUBMENU ON ADM_PERFIL_PERMISOS.ID_SUBMENU=ADM_SUBMENU.ID_SUBMENU
			WHERE ADM_PERFILES.ID_PERFIL='".$this->perfilUsuario."' AND ADM_SUBMENU.TIPO='A' LIMIT 1";
			$resPP=$this->ejecutarQuery($sqlPP);
			if($resPP){
				$rowPP=$this->regresaResultados($resPP);
				$mensaje=$rowPP["UBICACION"];
			}else{
				$mensaje="Error";
			}
			$this->moduloInicial=$mensaje;
			$mensaje="";
		}
		public function verificarInfoUsuario(){
			$mensaje=array();
			$this->conectarServer();
			$sqlIU="SELECT ID_USUARIO,ADM_USUARIOS.ID_CLIENTE AS ID_CLIENTE,USUARIO,IF(ADM_CLIENTES.ACTIVO IN ('N','I'),'0','1') AS STATUS,LOGO_CLIENTE,ADM_USUARIOS.ID_EMPRESA AS ID_EMPRESA,RESET_PASSWORD_POLITICS,PASSWORD_VALIDITY,REMEMBER_CHANGE_PASSWORD,LAST_UPDATE_DATE,URL_FOTO_PERFIL,NOMBRE_COMPLETO,COD_ENTITY_PWA FROM ADM_USUARIOS INNER JOIN ADM_CLIENTES ON ADM_USUARIOS.ID_CLIENTE=ADM_CLIENTES.ID_CLIENTE WHERE USUARIO LIKE '".$this->usuarioLogin."' AND DO_LOGIN_PLATTFORM='1'";
			$resIU=$this->ejecutarQuery($sqlIU);
			if($resIU){
				$rowIU=$this->regresaResultados($resIU);
				if($this->numeroRegistros($resIU)===0){
					array_push($mensaje, "Error");
				}else{
					array_push($mensaje, $rowIU);	
				}
			}else{
				array_push($mensaje,"Error");
			}
			$this->statusCliente=json_encode($mensaje);
		}
		public function verificarStatusCliente(){
			$mensaje="";
			$this->conectarServer();
			$sqlCS="SELECT IF(ACTIVO IN ('N','I'),'0','1') AS STATUS FROM ADM_CLIENTES WHERE ID_CLIENTE='".$this->clienteID."'";
			$resCS=$this->ejecutarQuery($sqlCS);
			if($resCS){
				$rowCS=$this->regresaResultados($resCS);
				$mensaje=$rowPP["STATUS"];
			}else{
				$mensaje="Error";
			}
			$this->statusCliente=$mensaje;
		}
		public function getLogoEmpresa($idEmpresa){
			$mensaje="";
			$this->conectarServer();
			$sql_logo="SELECT VALOR FROM A_MOVI_CONF WHERE NOMBRE_CONF = 'LOGO_DEFAULT'";
			if($idEmpresa!=="0"){
				// empresa distinta
				$sql_logo="SELECT VALOR FROM ADM_EMPRESAS_CONF WHERE NOMBRE_CONF = 'LOGO_DEFAULT' AND ID_EMPRESA='".$idEmpresa."'";
			}			
			$res_logo=$this->ejecutarQuery($sql_logo);
			if($res_logo){
				$row_logo=$this->regresaResultados($res_logo);
				$mensaje=$row_logo["VALOR"];
				if($mensaje==""){
					// Se extrae el valor por defecto
					$sql_logo="SELECT VALOR FROM A_MOVI_CONF WHERE NOMBRE_CONF = 'LOGO_DEFAULT'";
					$res_logo=$this->ejecutarQuery($sql_logo);
					$row_logo=$this->regresaResultados($res_logo);
					$mensaje=$row_logo["VALOR"];
				}
			}else{
				$mensaje="Error";
			}			
			$this->logoEmpresa=$mensaje;
		}
		public function getInfoEvidencia($idEvidencia=0){
			$mensaje=array();
			if($idEvidencia!=0){
				$this->conectarServer();
				$this->ejecutarQuery("SET NAMES 'utf8'");
				$sqlDetalle="CALL INFO_EVD(".$idEvidencia.")";
				$resD=$this->ejecutarQuery($sqlDetalle);
				$rowD=$this->regresaResultados($resD);			
				return json_encode($rowD);
			}else{
				$this->erroresConfClientes(300);
			}
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