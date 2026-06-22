<?php
/**
*@name 				Controlador para las funciones de las Tareas
*@copyright         Air Logistics & GPS S.A. de C.V.  
*@author 			Gerardo Lara
*/
error_reporting(E_ALL);
ini_set('display_errors', '0');
session_start();
if($_SERVER["HTTP_REFERER"]==""){
	echo "0";
}else{
	include "app.class.php";
	// echo "<pre>";
	// print_r($_SESSION);
	// echo "</pre>";
	$idCliente=$_SESSION["ID_CLIENTE"];
	$idUsuario=$_SESSION["ID_USUARIO"];
	//se instancia la clase que contiene las funciones de los cuestionarios
	$objApp=new appSup();
	switch($_POST["action"]){
		case "getCuadrantes":
			$res=json_decode($objApp->getTableData($idCliente),1);
			// echo "<pre>";
			// print_r($res);
			// echo "</pre>";
			$mensaje=array("error"=>true,"mensaje"=>"No se encontraron resultados");
			if(count($res)==0){
				$mensaje=array("error"=>true,"mensaje"=>"No se encontraron resultados");
			}else{
				$mensaje=array("error"=>false,"mensaje"=>$res);
			}
			mostrarRespuesta($mensaje);
		break;
		case "getPhotosUsuarios":			
			$usuarios=json_decode($_SESSION["FOTOS_USUARIOS"],true);
			mostrarRespuesta($usuarios);
		break;
	}
}

function mostrarRespuesta($res){
	header('Content-Type: application/json');
	echo json_encode($res);
}
function agruparYOrdenarPorFecha($array,$sector) {
	// ordenar el array por hora desde la más reciente a la más antigua y por fecha desde la más reciente a la más antigua
	usort($array, function($a, $b) {
		return strtotime($b['FECHA']) - strtotime($a['FECHA']);
	});
	usort($array, function($a, $b) {
		return strtotime($b['HORA']) - strtotime($a['HORA']);
	});

	// usort($array, function($a, $b) {
	// 	return strtotime($b['FECHA']) - strtotime($a['FECHA']);
	// });

	// Agrupar por PUNTO_DE_REVISION
	$resultadoAgrupado = [];
	foreach ($array as $item) {
			// Convertir el formato de la fecha a dd/mm/aa
			$fechaOriginal = strtotime($item['FECHA']);
			$item['FECHA'] = date('d/m/y', $fechaOriginal);

			// Agrupar por PUNTO_DE_REVISION
			if(($item['PUNTO_DE_REVISION']!="") && ($item['PUNTO_DE_REVISION']==$sector[1])){
				$puntoDeRevision = $item['PUNTO_DE_REVISION'];
				if (!isset($resultadoAgrupado[$puntoDeRevision])) {
						$resultadoAgrupado[$puntoDeRevision] = [];
				}
				$resultadoAgrupado[$puntoDeRevision][] = $item;
			}
	}

	return $resultadoAgrupado;
}
function convertirFecha($fecha) {
	// Crear un objeto DateTime a partir del formato dado
	$fechaObjeto = DateTime::createFromFormat('d/m/y', $fecha);
	
	// Verificar si la conversión fue exitosa
	if ($fechaObjeto) {
			return $fechaObjeto->format('Y-m-d'); // Convertir al formato deseado
	} else {
			return false; // Retornar false si el formato es inválido
	}
}
function validarFormatoFecha($fecha) {
	return preg_match('/^\d{2}\/\d{2}\/\d{2}$/', $fecha) === 1;
}
?>