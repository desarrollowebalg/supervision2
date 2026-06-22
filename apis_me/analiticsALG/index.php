<?php
  error_reporting(E_ALL);
  ini_set('display_errors', '0');
  set_time_limit(0);
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET, POST');
  header("Access-Control-Allow-Headers: X-Requested-With");
  header('Content-Type: text/html; charset=utf-8');
  header('P3P: CP="IDC DSP COR CURa ADMa OUR IND PHY ONL COM STA"');

  require_once dirname(__DIR__) . "/Route.php";
  require_once dirname(__FILE__)."/apiAnaliticsV1.php";
  
  $routes = new Route(true);
  $route = $routes->getRoutes();

  // echo "<pre>";
  // print_r($route);
  // echo "</pre>";
  //exit();
  // se recupera el request a efectuar
  $req=filter_var($route[1],FILTER_SANITIZE_STRING);
  // se obtiene el ID de CLIENTE
  $idCliente=(int)filter_var($route[2],FILTER_SANITIZE_STRING);  
  
  if(validarParametroObligatorio($req)){
    $res=array("Error" => "Verifique la información 1");    
    mostrarRespuesta($res);
    exit();
  }
  if($idCliente!==0){
    if(validarParametroObligatorio($idCliente)){
      $res=array("Error" => "Error, especifique un ID de Cliente valido");
      mostrarRespuesta($res);
      exit();
    }
  }
  include "../../config/database.php";
  $analiticsApi=new apiPdiV2($config_bd["host"],$config_bd["user"],$config_bd["pass"],$config_bd["bname"],$config_bd["port"]);
  $analiticsApi->__set("idCliente",$idCliente);
  switch($req){
    case "setEvent":{
      // echo "<pre>";
      // print_r($route);
      // echo "</pre>";
      //exit();
      $idUsuario=(int)filter_var($route[3],FILTER_SANITIZE_STRING);
      $info=filter_var($route[4],FILTER_SANITIZE_STRING);
      $apiKey=filter_var($route[5],FILTER_SANITIZE_STRING);
      $proyecto=filter_var($route[6],FILTER_SANITIZE_STRING);
      if(validarParametroObligatorio($idUsuario)){
        $res=array("Error" => "Error, especifique un usuario valido");
        mostrarRespuesta($res);
        exit();
      }
      if(validarParametroObligatorio($info)){
        $res=array("Error" => "Error, especifique un payload valido");
        mostrarRespuesta($res);
        exit();
      }
      if(validarParametroObligatorio($apiKey)){
        $res=array("Error" => "Error, especifique una clave valida");
        mostrarRespuesta($res);
        exit();
      }
      $info=json_decode(base64_decode($info),true);
      $infoUC=array(
        'ID_CLIENTE' => $idCliente,
        'ID_USUARIO' => $idUsuario,         
      );
      $payload=array_merge($infoUC,$info);
      //se envia al api
      $analiticsApi->setApiAnaliticsALG_v1($idUsuario,json_encode($payload));
      $res=array("status" => "ok");
      mostrarRespuesta();
    }
    
  }
  
  function validarParametroObligatorio($parametro){
    if(($parametro=="") || ($parametro==null) || (empty($parametro)) || is_null($parametro) ){
      return true;
    }
  }

  function mostrarRegistroUnico($idCliente,$itemNumber,$idObjectMap,$pdiApi){    
    $pdiApi->__set("itemNumber",$itemNumber);
    $pdiApi->__set("idObjectMap",$idObjectMap);
    $pdiApi->getInfoPDICliente();
    $res=$pdiApi->__get("registros");    
    if($res[0]["ID"]==0){
      $res=array("Error" => "NO EXISTE");
      mostrarRespuesta($res);
      exit();
    }
    mostrarRespuesta($res);
  }

  function mostrarRespuesta($res){
    header('Content-Type: application/json');
    echo json_encode($res);
  }

?>
