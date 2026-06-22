<?php
/** * 
 *  @package             
 *  @name                error 404 pagina no encontrada  
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Enrique Peña 
 *  @modificado          27-04-2011
**/
	$tpl = new Template('../errors/template');	
	$tpl->set_filenames(array('error444'=>'error444'));	
	$tpl->pparse('error444');
?>