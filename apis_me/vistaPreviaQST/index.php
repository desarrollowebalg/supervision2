<?php
  error_reporting(E_ALL);
  ini_set('display_errors', '0');
  date_default_timezone_set("America/Mexico_City");
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET, POST');
  header("Access-Control-Allow-Headers: X-Requested-With");
  header('Content-Type: text/html; charset=utf-8');
  header('P3P: CP="IDC DSP COR CURa ADMa OUR IND PHY ONL COM STA"');

  require_once dirname(__FILE__) . "/Route.php";
  require_once dirname(__FILE__)."/apiVistaPrevia.class.php";
  
  $routes = new Route(true);
  $route = $routes->getRoutes();

  // echo "<pre>";
  // print_r($route);
  // echo "</pre>";
  // exit();
  // se recupera el request a efectuar
  $req=filter_var($route[1],FILTER_SANITIZE_STRING);
  // se obtiene el ID de CLIENTE
  //$idCliente=(int)filter_var($route[2],FILTER_SANITIZE_STRING);
  
  if(validarParametroObligatorio($req)){
    $res=array("Error" => "Verifique la información 1");    
    mostrarRespuesta($res);
    exit();
  }  
  // if(validarParametroObligatorio($idCliente)){
  //   $res=array("Error" => "Error, especifique un ID de Cliente valido");
  //   mostrarRespuesta($res);
  //   exit();
  // }
  include "../../config/database.php";
  $apiForm=new apiPreviewForms($config_bd["host"],$config_bd["user"],$config_bd["pass"],$config_bd["bname"],$config_bd["port"]);
  //$apiForm->__set("idCliente",$idCliente);
  switch($req){
    case "getForm":
      $idForm=filter_var($route[2],FILTER_SANITIZE_STRING);
      if(validarParametroObligatorio($idForm)){
        $res=array("Error" => "Error, especifique un formulario valido");
        mostrarRespuesta($res);
        exit();
      }
      $infoForm=array("info"=>"","pregs"=>"");
      //se obtiene la info del formulario
      $apiForm->getInfoForm($idForm);
      $res=$apiForm->__get("registros");      
      if(array_key_exists("Error",$res)){
        if($res["Error"]=="N/A"){
          $res=array("Error" => "Error, comuniquese con el Administrador");
          mostrarRespuesta($res);
          exit();
        }
      }else{
        $infoForm["info"]=$res;
        //se obtienen las preguntas del formulario
        $res1=$apiForm->getQuestionsForm($idForm);
        $res1=$apiForm->__get("registros");
        $infoForm["pregs"]=$res1;                        
        mostrarRespuesta($infoForm);
      }
    break;    
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