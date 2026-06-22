<?php
/** * 
 *  @package             
 *  @name                Indice del modulo  
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Enrique Pe�a 
 *  @modificado          13/04/2011
**/
	$tpl 		= new Template('modules/'.$_GET['m'].'/template');
	$dir_mod 	= 'modules/'.$_GET['m'].'/template';
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
