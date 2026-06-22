<?php
	/**
	 *@name Clase para manejar el envio de notificacion hacia los telefonos
	 *@author Gerardo Lara
	 *@version 1.0.0
	 *@package apisInternas
	 */
	class validacionSuperUsuario{
		private $objDbCM;
		private $hostCM;
		private $portCM;
		private $bnameCM;
		private $userCM;
		private $passCM;
		//variables de uso
		private $userId=0;
		private $perfilUser="";
		private $clienteId=0;
		private $idSubmenu=0;


		private $resVal="";


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
		
		private function conectarServer(){
			$this->objBd = mysqli_connect($this->hostCM, $this->userCM, $this->passCM, $this->bnameCM, $this->portCM);
			if(!$this->objBd)
				echo "Error al realizar la conexion con la base de datos";
		}
		public function ejecutarQuery($sql){/**@description 	Funcion que ejecuta el query en la base de datos*/
			$sql=@mysqli_query($this->objBd,$sql);
			if(!$sql){
				echo "Error no.".mysqli_errno($this->objBd)." ".$sql;
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

		public function verificaUsuarioSuper(){
			$valorPermiso="";
			$this->conectarServer();
			//echo $this->userId;
			//se verifica que el usuario sea superAdmin
			$sql="SELECT ADM_USUARIOS.ID_CLIENTE AS ID_CLIENTE,ADM_USUARIOS.ID_EMPRESA AS ID_EMPRESA,ADM_USUARIOS.ID_USUARIO AS ID_USUARIO,USUARIO,NOMBRE_COMPLETO AS NOMBRE_COMPLETO,ADM_USUARIOS_SUPER.NIVEL AS NIVEL
				FROM ADM_USUARIOS_SUPER INNER JOIN ADM_USUARIOS ON ADM_USUARIOS_SUPER.ID_USUARIO=ADM_USUARIOS.ID_USUARIO
				WHERE ADM_USUARIOS_SUPER.ID_USUARIO='".$this->userId."'";
			$resSA=$this->ejecutarQuery($sql);
			$rowSA=$this->regresaResultados($resSA);
			$numSA=$this->numeroRegistros($resSA);
			if($numSA===0){//si no es SUPER_ADMIN se verifica si es administrador
				echo "<br>Entro al IF<br>";
				// echo "<br>".$sqlAdmin="SELECT ADM_PERFILES.ID_PERFIL AS ID_PERFIL,ADM_PERFILES.DESCRIPCION 
				// FROM ADM_PERFILES 
				// 	INNER JOIN ADM_PERFILES_CLIENTES ON ADM_PERFILES.ID_PERFIL=ADM_PERFILES_CLIENTES.ID_PERFIL
				// 	INNER JOIN ADM_USUARIOS ON ADM_PERFILES.ID_PERFIL=ADM_USUARIOS.ID_PERFIL
				// WHERE ADM_PERFILES_CLIENTES.ID_CLIENTE='".$this->clienteId."' AND ADM_USUARIOS.ID_USUARIO='".$this->userId."' AND ADM_PERFILES.ESTATUS='Activo'";
				$sqlAdmin="SELECT ID_PERFIL FROM ADM_USUARIOS WHERE ID_USUARIO='".$this->userId."'";
				$resAdmin=$this->ejecutarQuery($sqlAdmin);
				$rowAdmin=$this->regresaResultados($resAdmin);
				$numAdmin=$this->numeroRegistros($resAdmin);
				if($rowAdmin["ID_PERFIL"] != "113"){//si el perfil del usuario es diferente a 113 se verifica si el usuario tiene una excepción
					$sqlE="SELECT * FROM ADM_USUARIOS_PERMISOS_MODULO WHERE ID_SUBMENU='".$this->idSubmenu."' AND ID_USUARIO='".$this->userId."'";
					$resE=$this->ejecutarQuery($sqlE);
					$rowE=$this->regresaResultados($resE);
					$numE=$this->numeroRegistros($resE);
					if($numE===0){
						$valorPermiso="0|0|1|1";
						return 0;
					}
				}else{
					$valorPermiso="0|0|0|1";
				}
			}else{
				//el usuario es SUPER ADMIN y se verifica si es ALG
				if($rowSA["ID_EMPRESA"] != "0"){
					// echo "<br>Entro al IF<br>";
					$valorPermiso="0|1|1|1";
				}else{
					// echo "<br>Entro al ELSE EMPRESA<br>";
					$valorPermiso="1|1|1|1";
				}
			}
			$this->resVal=$valorPermiso;
		}
	}
	/*ejemplo de instancia de la clase una ves que ya se incluyo al codigo*/
	// $objV=new validacionSuperUsuario("188.138.16.27","savl",'$s4v1XX0$',"ALG_BD_CORPORATE_MOVI","3306");
	
	// $objV->__set("userId","2241");
	// $objV->__set("perfilUser","113");
	// $objV->__set("clienteId","144");
	// $objV->__set("idSubmenu","66");
	// $objV->verificaUsuarioSuper();
	// $res=$objV->__get("resVal");
	// echo "<br><br>Test 1 : Resultado Costena 2241 => ".$res;

	// echo "<br><br>===================<br><br>";

	// $objV->__set("userId","954");
	// $objV->__set("perfilUser","1");
	// $objV->__set("clienteId","1");
	// $objV->__set("idSubmenu","66");
	// $objV->verificaUsuarioSuper();
	// $res=$objV->__get("resVal");	
	// echo "<br><br>Test 2 : Resultado ALG 954 => ".$res;


	// echo "<br><br>===================<br><br>";

	// $objV->__set("userId","5841");
	// $objV->__set("perfilUser","113");
	// $objV->__set("clienteId","218");
	// $objV->__set("idSubmenu","66");
	// $objV->verificaUsuarioSuper();
	// $res=$objV->__get("resVal");	
	// echo "<br><br>Test 3 : Resultado COMSYS 5841 => ".$res;

	// echo "<br><br>===================<br><br>";

	// $objV->__set("userId","2055");
	// $objV->__set("perfilUser","45");
	// $objV->__set("clienteId","42");
	// $objV->__set("idSubmenu","66");
	// $objV->verificaUsuarioSuper();
	// $res=$objV->__get("resVal");	
	// echo "<br><br>Test 4 : Resultado G&C 2055 => ".$res;


	// echo "<br><br>===================<br><br>";

	// $objV->__set("userId","50");
	// $objV->__set("perfilUser","1");
	// $objV->__set("clienteId","1");
	// $objV->__set("idSubmenu","66");
	// $objV->verificaUsuarioSuper();
	// $res=$objV->__get("resVal");	
	// echo "<br><br>Test 3 : Resultado ALG 50 => ".$res;

?>