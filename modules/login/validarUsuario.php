<?php
	/** * 
	 * verificacion de usuario
	**/
	error_reporting(E_ALL);
	ini_set('display_errors', '0');
	date_default_timezone_set('America/Mexico_City');
	include "apis_me/confClientes.movi.php";
	
	$db = new sql($config_bd['host'],$config_bd['port'],$config_bd['bname'],$config_bd['user'],$config_bd['pass']);

	function sanear_string($string){
		$string = trim($string);
		$string = str_replace(array('á', 'à', 'ä', 'â', 'ª', 'Á', 'À', 'Â', 'Ä'), array('a', 'a', 'a', 'a', 'a', 'A', 'A', 'A', 'A'), $string);
		$string = str_replace(array('é', 'è', 'ë', 'ê', 'É', 'È', 'Ê', 'Ë'), array('e', 'e', 'e', 'e', 'E', 'E', 'E', 'E'), $string);
		$string = str_replace(array('í', 'ì', 'ï', 'î', 'Í', 'Ì', 'Ï', 'Î'), array('i', 'i', 'i', 'i', 'I', 'I', 'I', 'I'), $string);
		$string = str_replace(array('ó', 'ò', 'ö', 'ô', 'Ó', 'Ò', 'Ö', 'Ô'), array('o', 'o', 'o', 'o', 'O', 'O', 'O', 'O'), $string);
		$string = str_replace(array('ú', 'ù', 'ü', 'û', 'Ú', 'Ù', 'Û', 'Ü'), array('u', 'u', 'u', 'u', 'U', 'U', 'U', 'U'), $string); 
		$string = str_replace(array('ç', 'Ç'), array('c', 'C', ), $string); 
			//Esta parte se encarga de eliminar cualquier caracter extraño 
		$string = str_replace(array("\\", "¨", "º", "~", "#", "|", "!", "\"", "$", "%", "&", "(", ")", "?", "'", "¡", "¿", "[", "^", "`", "]", "+", "}", "{", "¨", "´", ">“, “< ", ";", ","), '', $string);
		return $string;
	}

	function imprimirSalidaJson($codigo,$respuesta){
		header('HTTP/1.1 '.$codigo);
		header('Content-Type: application/json');
		echo json_encode($respuesta);
		exit();
	}

	$seValidaPolitica=$_POST["opc"];
	$usuario= sanear_string($_POST["vuname"]);
	$usuario=strip_tags($usuario);

	//se manda llamar al API que controla la información del usuario
	$objConfS=new confClientesMovi($config_bd["host"],$config_bd["user"],$config_bd["pass"],$config_bd["bname"],$config_bd["port"]);

	$objConfS->__set("usuarioLogin",$usuario);
	$objConfS->verificarInfoUsuario();	
	$verificacionUL=json_decode($objConfS->__get("statusCliente"),1);
	$objConfS->getLogoEmpresa($verificacionUL[0][5]); // se agrega el logo de empresa guardada en configuracion
	
	// echo "<pre>";
	// print_r($verificacionUL);
	// echo "</pre>";
	// exit();

	if($verificacionUL[0]["COD_ENTITY_PWA"]==="0"){
		$respuesta = array(
			'result'=>'0',
			'desc'=>'Usuario no registrado en plataforma'
		);
		imprimirSalidaJson(403,$respuesta);
	}

	if($verificacionUL[0]==="Error"){		
		$respuesta = array(
			'result'=>'0',
			'desc'=>'Verifique la información'
		);
		imprimirSalidaJson(403,$respuesta);
	}else if($verificacionUL[0]==="E1001"){
		//se añade la modificacion para validar si el usuario puede hacer login en plataforma		
		// echo $mensaje="1001";  //se dirige a la pantalla de error
		$respuesta = array(
			'result'=>'0',
			'desc'=>'Verifique la información 1001'
		);
	}else{				
		$mensajeCambioPass = array('mostrarMensajeCambioPass' => "0","diasVencimientoPass" => "0");		
		if($verificacionUL[0][6]==="1"){ // valida si esta activo RESET_PASSWORD_POLITICS en BD
			if($seValidaPolitica==="0"){
				$soloFecha = explode(" ", $verificacionUL[0][9]); // LAST_UPDATE_DATE -- [2022-08-01 10:35:42]
				$fechaUltimaActPassUsr = $soloFecha[0]; // solo fecha se quita la hora
				$diasRecordatorio      = $verificacionUL[0][8]; // REMEMBER_CHANGE_PASSWORD -- [5]
				$diasVigenciaPassword  = $verificacionUL[0][7]; // PASSWORD_VALIDITY -- [30]
				// echo "diasRecordatorio => ".$diasRecordatorio."<br><br>";
				// echo "diasVigenciaPass => ".$diasVigenciaPassword."<br><br>";
				// echo "fechaActualServer => ".date("Y-m-d")."<br><br>";
				// echo "fechaActualizacionPass => ".date("Y-m-d",strtotime($fechaUltimaActPassUsr))."<br><br>";
				// echo "fechaVencimiento => ".date("Y-m-d",strtotime(date("Y-m-d",strtotime($fechaUltimaActPassUsr))."+ ".$diasVigenciaPassword." days"))."<br><br>";
				//echo 'solo fecha'.$soloFecha[0];
				//exit();
				$fechaActualServer = strtotime(date("Y-m-d"));
				//fecha de la ultima actualizacion del password del usuario
				$fechaUsuario = strtotime(date("Y-m-d",strtotime($fechaUltimaActPassUsr)));
				//se obtiene la fecha de vencimiento con respecto a la fecha de update + 30 días
				$fechaVencimiento = strtotime(date("Y-m-d",
												 strtotime(date("Y-m-d",strtotime($fechaUltimaActPassUsr)).
												 "+ ".$diasVigenciaPassword." days")));				
				// echo "<br><br><br><br><br>";
				// echo "fechaActualServer => ".$fechaActualServer."<br><br>";
				// echo "fechaUsuario => ".$fechaUsuario."<br><br>";
				// echo "fechaVencimiento => ".$fechaVencimiento."<br><br>";				
				//exit();
				//se extraen la diferencia de dias tomando la fecha actual y la ultima guardada en el usuario
				$diasDiferencia=($fechaActualServer - $fechaUsuario)/60/60/24;
				$diasVencimiento=($fechaVencimiento - $fechaActualServer)/60/60/24;
				// echo "<br><br><br>";
				//echo "Días transcurridos desde ultimo update $fechaUltimaActPassUsr al dia de hoy ".date('Y-m-d')." => ".$diasDiferencia;
				//			 echo "<br><br>";
				//echo "Días restantes => ".$diasVencimiento.' hasta el '. date("Y-m-d",strtotime($fechaUltimaActPassUsr."+ ".$diasVigenciaPassword." days")); 
				//			 echo "<br><br>";				 
				// exit();
				//se evalua los diasVencimiento para mostrar el mensaje de cambio en la contraseña
				if(($diasVencimiento <= $diasRecordatorio) && ($diasVencimiento >= 0)){
					$mensajeCambioPass = array('mostrarMensajeCambioPass' => 1,'diasVencimientoPass'=> $diasVencimiento);
					//echo "1 $diasDiferencia >= $diasRecordatorio) && ($diasVencimiento > 0";	
				}
				// mostrar el mensaje de cambio en la contraseña, por rebasar los dias de vencimiento
				if((($diasVencimiento <= 0))){				
					$diasVencimiento=0;
					$mensajeCambioPass = array('mostrarMensajeCambioPass' => 2,'diasVencimientoPass'      => $diasVencimiento);
					//echo "2 ($diasVencimiento==0) || ($diasVencimiento < 0)";		
				}
			}
		}

		//exit();

		array_push($verificacionUL,$mensajeCambioPass);
		
		// echo "<br><br>Nuevo arreglo ================>";
		
		$logoEmpresa=$objConfS->__get("logoEmpresa");	
		$verificacionUL[0][6]=$logoEmpresa; // se añade al arreglo final
		$verificacionUL[0]["LOGO_EMPRESA"]=$logoEmpresa;
		
		if($verificacionUL[0][3]==="1"){			
			// echo "<pre>";
			// print_r($verificacionUL);
			// echo "</pre>";
			// exit();
			
			$respuesta = array(
				'result'=>'1',
				'ID_USUARIO'=>$verificacionUL[0]["ID_USUARIO"],
				'usuario'=>$verificacionUL[0]["USUARIO"],
				'logoCliente'=> $verificacionUL[0]["LOGO_CLIENTE"],
				'logoEmpresa'=>$verificacionUL[0]["LOGO_EMPRESA"],
				'RPP'=>$verificacionUL[0]["RESET_PASSWORD_POLITICS"],
				'PV'=>$verificacionUL[0]["PASSWORD_VALIDITY"],
				'RCP'=>$verificacionUL[0]["REMEMBER_CHANGE_PASSWORD"],
				'LU'=>$verificacionUL[0]["LAST_UPDATE_DATE"],
				'MMCP'=>$verificacionUL[1]["mostrarMensajeCambioPass"],
				'DVCP'=>$verificacionUL[1]["diasVencimientoPass"],
				'foto_perfil'=>$verificacionUL[0]["URL_FOTO_PERFIL"],
				'nombre_completo'=>$verificacionUL[0]["NOMBRE_COMPLETO"]
			);

			// echo "<pre>";
			// print_r($respuesta);
			// echo "</pre>";
			// exit();

			// "chgPwd.php?action=chgPwd&c="+b64EncodeUnicode(uname)+"&i="+b64EncodeUnicode(datosCliente[0].ID_USUARIO);

			// if($verificacionUL[1]["mostrarMensajeCambioPass"]==2){
			// 	header("Location: chgPwd.php?action=chgPwd&c=".base64_encode($usuario)."&i=".base64_encode($verificacionUL[0]["ID_USUARIO"]));
			// 	exit();
			// }
			// exit();

			// lo que se retornaba anteriormente
			// echo $mensaje=json_encode($verificacionUL);

			imprimirSalidaJson(200,$respuesta);

		}else if($verificacionUL[0][3]==="0"){
			// echo $mensaje="2";
			$respuesta = array(
				'result'=>'2',
				'desc'=>'Verifique la información o contacte al administrador'
			);
			imprimirSalidaJson(403,$respuesta);	
		}
	}
?>