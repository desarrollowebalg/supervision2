<?php
error_reporting(E_ALL);
ini_set("display_errors", "0");
set_time_limit(0);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Content-Type: application/json; charset=utf-8");
header('P3P: CP="IDC DSP COR CURa ADMa OUR IND PHY ONL COM STA"');

require_once dirname(__DIR__) . "/Route.php";
require_once dirname(__FILE__) . "/apiEvidences.class.php";

$moduleConfig = require dirname(__FILE__) . "/actions.php";

iniciarSesionApi();

$routes = new Route(true);
$route = $routes->getRoutes();
$actionName = isset($route[1]) ? trim((string)$route[1]) : "";

if($actionName === ""){
  responderApi(300, "Verifique la informacion");
  exit();
}

$actionDefinition = obtenerDefinicionAccion($moduleConfig, $actionName);
if($actionDefinition === false){
  responderApi(300, "Operacion no soportada");
  exit();
}

validarSesionApi($moduleConfig);

$payload = leerJsonEntrada();
validarPayloadAccion($payload, $actionDefinition);

$evidencesApi = new apiEvidences();
include "../../config/database.php";
$evidencesApi->__set("hostCM", isset($config_bd["host"]) ? $config_bd["host"] : "");
$evidencesApi->__set("userCM", isset($config_bd["user"]) ? $config_bd["user"] : "");
$evidencesApi->__set("passCM", isset($config_bd["pass"]) ? $config_bd["pass"] : "");
$evidencesApi->__set("bnameCM", isset($config_bd["bname"]) ? $config_bd["bname"] : "");
$evidencesApi->__set("portCM", isset($config_bd["port"]) ? (int)$config_bd["port"] : 0);
hidratarContextoSesion($evidencesApi, $moduleConfig["session_context"]);
hidratarPayloadAccion($evidencesApi, $actionDefinition, $payload);

$evidencesApi->executeDefinedAction($actionDefinition);
$resultado = $evidencesApi->__get("registros");

if(isset($resultado["Error"])){
  $mensaje = ($resultado["Error"] === "") ? "NO EXISTE" : $resultado["Error"];
  $errorData = array();
  if(isset($resultado["ErrorData"]) && is_array($resultado["ErrorData"])){
    $errorData = $resultado["ErrorData"];
  }
  responderApi(300, $mensaje, $errorData);
  exit();
}

$responseMessage = isset($actionDefinition["response_message"]) ? (string)$actionDefinition["response_message"] : "OK";
responderApi(200, $responseMessage, $resultado);

function iniciarSesionApi(){
  if(!headers_sent()){
    if(function_exists("session_status")){
      if(session_status() === PHP_SESSION_NONE){
        session_start();
      }
    } else if(session_id() === ""){
      session_start();
    }
  }
}

function obtenerDefinicionAccion($moduleConfig, $actionName){
  if(!isset($moduleConfig["actions"][$actionName])){
    return false;
  }

  return $moduleConfig["actions"][$actionName];
}

function validarSesionApi($moduleConfig){
  if(!isset($moduleConfig["session_context"]) || !is_array($moduleConfig["session_context"])){
    responderApi(300, "Configuracion de sesion invalida");
    exit();
  }

  foreach($moduleConfig["session_context"] as $sessionRule){
    $sessionKey = $sessionRule["session_key"];
    if(!isset($_SESSION[$sessionKey])){
      responderApi(300, "Sesion no valida");
      exit();
    }

    if($sessionRule["type"] === "int" && (int)$_SESSION[$sessionKey] <= 0){
      responderApi(300, "Sesion no valida");
      exit();
    }
  }
}

function leerJsonEntrada(){
  $rawInput = file_get_contents("php://input");
  if($rawInput === false || trim($rawInput) === ""){
    responderApi(300, "Body JSON requerido");
    exit();
  }

  $decoded = json_decode($rawInput, true);
  if(!is_array($decoded)){
    responderApi(300, "JSON invalido");
    exit();
  }

  return $decoded;
}

function validarPayloadAccion($payload, $actionDefinition){
  if(!isset($actionDefinition["required_fields"]) || !is_array($actionDefinition["required_fields"])){
    responderApi(300, "Configuracion de accion invalida");
    exit();
  }

  foreach($actionDefinition["required_fields"] as $field){
    if(!array_key_exists($field, $payload)){
      responderApi(300, "Campo requerido faltante: ".$field);
      exit();
    }
  }
}

function hidratarContextoSesion($evidencesApi, $sessionContext){
  foreach($sessionContext as $sessionRule){
    $value = $_SESSION[$sessionRule["session_key"]];
    if($sessionRule["type"] === "int"){
      $value = (int)$value;
    }
    $evidencesApi->__set($sessionRule["property"], $value);
  }
}

function hidratarPayloadAccion($evidencesApi, $actionDefinition, $payload){
  if(!isset($actionDefinition["execution"]["payload_property"])){
    responderApi(300, "Configuracion de payload invalida");
    exit();
  }

  $payloadProperty = $actionDefinition["execution"]["payload_property"];
  $evidencesApi->__set($payloadProperty, $payload);
}

function responderApi($status, $message, $data = array()){
  $payload = array(
    "status" => (int)$status,
    "success" => ((int)$status === 200),
    "message" => (string)$message,
    "data" => is_array($data) ? $data : array($data),
  );

  $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
  if($json === false){
    $fallback = array(
      "status" => 300,
      "success" => false,
      "message" => "No fue posible serializar la respuesta",
      "data" => array(),
    );
    echo json_encode($fallback, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return;
  }

  echo $json;
}
?>
