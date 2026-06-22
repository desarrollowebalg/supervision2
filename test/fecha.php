<?php
//date_default_timezone_set("America/Mexico_City");
//echo date_default_timezone_get();
date_default_timezone_set("UTC");
echo date("Y-m-d H:i:s", time()); 
echo '<br>';
echo diferenciaFechas(date("Y-m-d H:i:s"),'2015-05-30 19:14:11');
echo '<br>'.date("Y-m-d H:i:s").'|'.date("G:i:s").' |'. date("r");

//date_default_timezone_set('GMT-3');


 function diferenciaFechas($fecha1,$fecha2){
 $valor = 	(ceil(strtotime($fecha1) - strtotime($fecha2)))/60;
 $valor =   tiempoMinutos($valor);

 return $valor;
}


function tiempoMinutos($valorX){
 switch($valorX){
	case $valorX < 60:
	  $valorX = round($valorX,2).' min.'; 
	break;
	case $valorX>60:
	   if(($valorX%60) > 0){
           $valorX = round((($valorX-1)/60),0).'hrs ,'.($valorX%60).' min.'; 		   
	   }else{
		   $valorX = round(($valorX/60),0).'hrs ,'.($valorX%60).' min.'; 
	   }	  

	break;
	
 }
 return $valorX;
}
?>