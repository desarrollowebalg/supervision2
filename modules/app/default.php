<?php
/** * 
 *  @package             
 *  @name                Default del modulo APP
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Gerardo Lara
 *  @modificado          30-10-2019
**/
	error_reporting(E_ALL);
	ini_set('display_errors', '0');

 	header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
 	header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past

	session_start();

	$db = new sql($config_bd['host'],$config_bd['port'],$config_bd['bname'],$config_bd['user'],$config_bd['pass']);
	
	if(!$userAdmin->u_logged()){
		// echo '<script>window.location="login/default"</script>';
		header("Location: /login/default");
		exit();	
	}

	include "vite.php";
	$vite = loadVite('src/pages/inicio/main.js');
	$linkCss = "";
	if(!empty($vite["css"])){
		foreach ($vite["css"] as $cssFile) {
			$linkCss .= '<link rel="stylesheet" href="'.$cssFile.'">';
		}
	}


	// include "apis_me/confMensajesClientes.movi.php";

	$tpl->set_filenames(array('default'=>'default'));	
	$idProfile   = $userAdmin->user_info['ID_PERFIL'];
	$idCliente   = $userAdmin->user_info['ID_CLIENTE'];
	$idUsuario	     = $userAdmin->user_info['ID_USUARIO'];
	$nombreUsuario	 = $userAdmin->user_info['USUARIO'];
	$nombreCompleto  = utf8_encode($userAdmin->user_info['NOMBRE_COMPLETO']);
	$fotoPerfilUsuario=$userAdmin->user_info['URL_FOTO_PERFIL'];
	
	// $_SESSION["ID_PROFILE"]=$userAdmin->user_info['ID_PERFIL'];
	// $_SESSION["ID_CLIENTE"]=$userAdmin->user_info['ID_CLIENTE'];
	// $_SESSION["ID_USUARIO"]=$userAdmin->user_info['ID_USUARIO'];
	// $_SESSION["USUARIO"]=$userAdmin->user_info['USUARIO'];
	// $_SESSION["NOMBRE_COMPLETO"]=$userAdmin->user_info['NOMBRE_COMPLETO'];
	// $_SESSION["URL_FOTO_PERFIL"]=$userAdmin->user_info['URL_FOTO_PERFIL'];
	$_SESSION["PLATTFORM"]="USER";
	// exit();

	// to do:
	// mensajes desde la plataforma ALG


	// $objMsg=new mensajesClientesMovi($config_bd["host"],$config_bd["user"],$config_bd["pass"],$config_bd["bname"],$config_bd["port"]);
	// $objMsg->__set("clienteID",$idCliente);
	// $mensajesApp=$objMsg->buscarMensajesClientesALG();
	// $contadorPer=0;
	// for($i=0;$i<count($mensajesApp);$i++){
	// 	if($mensajesApp[$i][5]=="Permanente"){
	// 		$contadorPer+=1;
	// 	}
	// }
	// echo count($mensajesApp)."|".$contadorPer;
	// importante colocar indicador de mensajes en la UI principal
	// $totalMensajes=count($mensajesApp);
	// $totalMensajesPermanentes=$contadorPer;

	// echo "<pre>";
	// print_r($mensajesApp);
	// echo "</pre>";	
	// exit();

	// $mensajesTemplate="";
	// if($totalMensajes!==0){
	// 	include "mensajes.php";

	// 	$objMsg=new mensajes();
	// 	foreach ($mensajesApp as $key => $value) {						
	// 		$mensajeAppALGC=$value[4];
	// 		$tipo=$value[5];
	// 		$estatus=$value[8];
	// 		$creado=$value['NOMBRE_COMPLETO'];
	// 		$fotoPerfilUsuarioMsg=$value['URL_FOTO_PERFIL'];
	// 		// echo "<br>";
	// 		// echo $tipo."<br>".$estatus."<br>".$creado."<br>".$mensajeAppALGC;
	// 		$objMsg->__set("tipo",$tipo);
	// 		$objMsg->__set("status",$estatus);
	// 		$objMsg->__set("creado",$creado);
	// 		$objMsg->__set("mensaje",$mensajeAppALGC);
	// 		$objMsg->__set("urlFotoPerfil",$fotoPerfilUsuarioMsg);
	// 		$objMsg->get_TemplateMsg();
	// 		$mensajesTemplate.=$objMsg->__get("templateMsg");
	// 	}
	// }

	/*se extrae el css a usar en el sitio*/
	// $sqlF= "SELECT ID_CLIENTE,NOMBRE,RAZON_SOCIAL,LOGO_CLIENTE FROM ADM_CLIENTES WHERE ID_CLIENTE='".$idCliente."'";
	// $resF= $db->sqlQuery($sqlF);
	// $rowF= $db->sqlFetchArray($resF);
	// echo "<pre>";
	// print_r($rowF);
	// echo "</pre>";exit();
	// $nombreCliente=utf8_encode($rowF["1"]);
	// $razonSocial=utf8_encode($rowF["2"]);
	// $logoCliente=$rowF["LOGO_CLIENTE"];
		
	// $saludo=obtenerSaludo();	

	/**
	 * se añaden los valores de sesion
	 */
	// $_SESSION["LOGO_CLIENTE"]=$logoCliente;
	// $_SESSION["NOMBRE_COMP"]=$nombreCompleto;
	// $_SESSION["FOTO_PERFIL_USUARIO"]=$fotoPerfilUsuario;

	$tpl->assign_vars(array(
		'PAGE_TITLE'	=> "Inicio",	
		'PATH'			=> $dir_mod,				
		'VITE_JS' => $vite['js'],
  	'VITE_CSS' => $linkCss,
  	'IS_DEV' => $vite['isDev']					
	));
	$tpl->pparse('default');

	function obtenerSaludo() {
    date_default_timezone_set('America/Guatemala');
    $hora = date('G');  
    if ($hora >= 6 && $hora < 12) {
      return "Buenos días";
    } elseif ($hora >= 12 && $hora < 18) {
      return "Buenas tardes";
    } else {
      return "Buenas noches";
    }
	}

?>
