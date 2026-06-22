<?php
/*
 *  @package             
 *  @name                Pagina default del modulo login  
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Enrique Pe�a 
 *  @modificado          27-04-2011
**/
	error_reporting(E_ALL);
	ini_set('display_errors', '0');			
	include "vite.php";
	$vite = loadVite('src/pages/login/main.js');
	
	$linkCss = "";
	if(!empty($vite["css"])){
		foreach ($vite["css"] as $cssFile) {
			$linkCss .= '<link type="text/css" rel="stylesheet" href="'.$cssFile.'">';
		}
	}
	// echo "css ".htmlentities($linkCss);exit();
	
	$db = new sql($config_bd['host'],$config_bd['port'],$config_bd['bname'],$config_bd['user'],$config_bd['pass']);

	if($userAdmin->u_logged()){
		// echo '<script>window.location="index.php?m=app"</script>';
		header("Location: /inicio/default");
		exit();
	}

	/**
	 * se extraen las nuevas configuraciones globales
	 */
	include "apis_me/getConfGral.class.php";	
	$confAval=new getConfGral($config_bd['host'],$config_bd['user'],$config_bd['pass'],$config_bd['bname'],$config_bd['port']);	
	$confAval->getConfiguracionGralMovilizandome("'SITIO_MANTENIMIENTO','VERSION_PLATAFORMA','URL_FAVICON','URL_SITIO_WEB','ESLOGAN_LOGIN','LOGO_DEFAULT'","0");	
	$confGral=json_decode($confAval->__get("confGral"),1);
	
	if($confGral[0]==="0"){
		echo "<h1>Espere un momento ...</h1>";
		exit();
	}
	
	$sitioMantto=$confGral[2][2];
	$urlFavicon=$confGral[1][2];
	$versionPlataforma=$confGral[3][2];
	$sitioWeb=$confGral[4][2];
	$eslogan=$confGral[5][2];
	$logoDefault=$confGral[0][2];

	$tpl->set_filenames(array('default'=>'default'));	
	$tpl->assign_vars(array(
		'PAGE_TITLE'	=> 'Bienvenido - LogIn',
		'PATH'			=> $dir_mod,
		'TIME'			=> time(),
		'URL_FAVICON' => $urlFavicon,
		'VERSION' => $versionPlataforma,
		'SITIOWEB' => $sitioWeb,
		'ESLOGAN' => $eslogan,
		'LOGO_DEFAULT' => $logoDefault,
		'USUARIO_BETA' => $valorBeta,
		'VALIDAR_USUARIO' => $validarUsuario,
		'TIME' => time(),		
		'VITE_JS' => $vite['js'],
  	'VITE_CSS' => $linkCss,
  	'IS_DEV' => $vite['isDev']
	));	
	$tpl->pparse('default');
?>
