<?php
/** * 
 *  @package             
 *  @name                error 404 pagina no encontrada  
 *  @version             1
 *  @copyright           Air Logistics & GPS S.A. de C.V.   
 *  @author              Enrique Pena 
 *  @modificado          27-04-2011
**/

$template = __DIR__ . '/template/error404.dwt';

if (is_file($template)) {
    readfile($template);
    exit();
}

http_response_code(404);
echo 'Pagina no encontrada';
?>
