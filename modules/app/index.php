<?php
/** * 
 *  @package             
 *  @name                Indice del modulo APP
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Gerardo Lara
 *  @modificado          30-10-2019
**/
	$tpl = new Template('modules/'.$_GET['m'].'/template');
	$dir_pimages = "public/images";
	$dir_mod 	 = 'modules/'.$_GET['m'].'/template';
	$dbf         = new dbFunctions();

	if(isset($_GET['c'])){
		$filename = $config['modules']."".$_GET['m']."/".$_GET['c'].'.php';
		if(file_exists($filename)){
			include $filename;
		}else{
			// echo "<script>window.location='errors/index.php?e=error404';</script>";
			header("Location: /errors/index.php?e=error404");
			exit();
		}
	}else{
		// echo "<script>window.location='index.php?m=".$_GET['m']."&c=default';</script>";
		header("Location: /".$_GET['m']."/default");
		exit();
	}		
?>