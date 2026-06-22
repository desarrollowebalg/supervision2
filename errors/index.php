<?php
/** * 
 *  @package             
 *  @name                Indice del modulo de errores
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Enrique Pe�a 
 *  @modificado          13/04/2011
**/
	error_reporting(0);
	// include __DIR__ . '/../libs/tpl.lib.php';
	if(isset($_GET['e'])){
		$filename = __DIR__ . '/' . basename($_GET['e']) . '.php';
		if(file_exists($filename)){
			include $filename;
		}else{
			include __DIR__ . '/error404.php';
			exit();
		}
	}else{
		include __DIR__ . '/error404.php';
		exit();
	}
?>
