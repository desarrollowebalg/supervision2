<?php
/*** 
 *  @name                Controla las solicitudes de la pagina
 *  @version             2
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Enrique Pe�a 
 *  @modificado          Gerardo Lara 16 Oct 2019
**/
	
	// error_reporting(E_ALL);
	// ini_set('display_errors', '1');

	// include 'config/on_load.php';
	
	// header( "Expires: Mon, 26 Jul 1997 05:00:00 GMT" );  // disable IE caching
	// header( "Last-Modified: " . gmdate( "D, d M Y H:i:s" ) . " GMT" ); 
	// header( "Cache-Control: no-cache, must-revalidate" ); 
	// header( "Pragma: no-cache" );
	
	// $userAdmin = new usersAdministration();	
	
	// if(isset($_GET['m'])){
	// 	$file = "modules/".$_GET['m']."/index.php";
	// 	if(file_exists($file)){
	// 		include $file;
	// 	}else{
	// 		echo "archivo no encontrado => ".$file."<br>";
	// 		//exit();
	// 		//include 'errors/index.php';
	// 	}
	// }else{
	// 	// echo "<script>window.location='".$config['mlogin']."'</script>";
	// 	header("Location: /".$config['mlogin']."/default");
	// 	exit();		
	// }
	error_reporting(E_ALL);
  ini_set("display_errors","0");	
	include "config/on_load.php";
	
	$m=$_GET['m'] ?? '';

	if(($m == 'index.php') || $m == ''){
		header("Location: /".$config['mlogin']."/default");
		exit();
	}

	try {
		$userAdmin = new usersAdministration();		
		if((isset($m))){		
			$file = "modules/".$m."/index.php";		
			if(file_exists($file)){
				include $file;
			}
			else{				
				include 'errors/index.php';
			}
		}else{
			// echo "<script>window.location='index.php?m=".$config['mlogin']."'</script>";	
			header("Location: /".$config['mlogin']."/default");
			exit();
		}
	} catch (\Throwable $th) {
		echo "Error: ".$th->getMessage();
	}
?>
