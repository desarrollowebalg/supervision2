<?php
  error_reporting(E_ALL);
  ini_set('display_errors', '0');
  set_time_limit(0);
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
  header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
  header('Content-Type: application/json; charset=utf-8');
  header('P3P: CP="IDC DSP COR CURa ADMa OUR IND PHY ONL COM STA"');
  ob_start();

  require_once dirname(__DIR__) . "/Route.php";
  require_once dirname(__FILE__)."/apiSupervision.class.php";

  $moduleConfig = require dirname(__FILE__) . "/actions.php";

  if($_SERVER['REQUEST_METHOD'] === 'OPTIONS'){
    http_response_code(204);
    exit();
  }

  iniciarSesionApi();
  $requestBody = obtenerBodyJsonRequest();

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

  include "../../config/database.php";
  $supervisionApi = new apiSupervision($config_bd["host"],$config_bd["user"],$config_bd["pass"],$config_bd["bname"],$config_bd["port"]);

  hidratarContextoSesion($supervisionApi, $moduleConfig["session_context"]);
  $resolvedParams = resolverParametrosAccion($route, $actionDefinition, $requestBody);
  hidratarPropiedadesAccion($supervisionApi, $actionDefinition, $resolvedParams);

  $supervisionApi->executeDefinedAction($actionDefinition);
  $resultado = $supervisionApi->__get("registros");

  if(isset($resultado["Error"])){
    $mensaje = ($resultado["Error"] === "") ? "NO EXISTE" : $resultado["Error"];
    responderApi(300, $mensaje);
    exit();
  }

  responderApi(200, "OK", $resultado);

  function iniciarSesionApi(){
    if(function_exists('session_status') && session_status() === PHP_SESSION_NONE && !headers_sent()){
      session_start();
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

  function hidratarContextoSesion($supervisionApi, $sessionContext){
    foreach($sessionContext as $sessionRule){
      $value = $_SESSION[$sessionRule["session_key"]];
      if($sessionRule["type"] === "int"){
        $value = (int)$value;
      }
      $supervisionApi->__set($sessionRule["property"], $value);
    }
  }

  function obtenerBodyJsonRequest(){
    $method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string)$_SERVER['REQUEST_METHOD']) : 'GET';
    if($method !== 'PUT' && $method !== 'POST' && $method !== 'PATCH'){
      return array();
    }

    $rawInput = file_get_contents("php://input");
    if($rawInput === false){
      responderApi(300, "No fue posible leer el body de la solicitud");
      exit();
    }

    $rawInput = trim($rawInput);
    if($rawInput === ""){
      return array();
    }

    $decoded = json_decode($rawInput, true);
    if(!is_array($decoded) || json_last_error() !== JSON_ERROR_NONE){
      responderApi(300, "Body JSON invalido");
      exit();
    }

    return $decoded;
  }

  function resolverParametrosAccion($route, $actionDefinition, $requestBody = array()){
    $resolvedParams = array();
    $params = isset($actionDefinition["params"]) ? $actionDefinition["params"] : array();

    foreach($params as $paramDefinition){
      $rawValue = obtenerValorParametro($route, $requestBody, $paramDefinition);
      if($rawValue === false){
        $errorLabel = $paramDefinition["error_label"];
        responderApi(300, "Error, especifique un ".$errorLabel." valido");
        exit();
      }

      $resolvedParams[$paramDefinition["name"]] = normalizarParametro($rawValue, $paramDefinition);
    }

    return $resolvedParams;
  }

  function obtenerValorParametro($route, $requestBody, $paramDefinition){
    $source = isset($paramDefinition["source"]) ? strtolower(trim((string)$paramDefinition["source"])) : "route";

    if($source === "body"){
      $bodyKey = isset($paramDefinition["body_key"]) && trim((string)$paramDefinition["body_key"]) !== ""
        ? (string)$paramDefinition["body_key"]
        : $paramDefinition["name"];

      if(!is_array($requestBody) || !array_key_exists($bodyKey, $requestBody)){
        return false;
      }

      $bodyValue = $requestBody[$bodyKey];
      if(is_string($bodyValue)){
        return $bodyValue;
      }

      if(is_numeric($bodyValue)){
        return (string)$bodyValue;
      }

      return false;
    }

    if(!isset($paramDefinition["route_index"])){
      return false;
    }

    $routeIndex = $paramDefinition["route_index"];
    if(!isset($route[$routeIndex])){
      return false;
    }

    $rawValue = trim((string)$route[$routeIndex]);
    if($rawValue === ""){
      return false;
    }

    return $rawValue;
  }

  function normalizarParametro($rawValue, $paramDefinition){
    switch($paramDefinition["type"]){
      case "int":
        if(!ctype_digit($rawValue) || (int)$rawValue <= 0){
          responderApi(300, "Error, especifique un ".$paramDefinition["error_label"]." valido");
          exit();
        }
        return (int)$rawValue;
      case "string":
      default:
        $normalizedValue = isset($paramDefinition["source"]) && strtolower(trim((string)$paramDefinition["source"])) === "body"
          ? (string)$rawValue
          : rawurldecode($rawValue);

        if(trim($normalizedValue) === ""){
          responderApi(300, "Error, especifique un ".$paramDefinition["error_label"]." valido");
          exit();
        }

        return $normalizedValue;
    }
  }

  function hidratarPropiedadesAccion($supervisionApi, $actionDefinition, $resolvedParams){
    $params = isset($actionDefinition["params"]) ? $actionDefinition["params"] : array();
    foreach($params as $paramDefinition){
      if(isset($paramDefinition["target_property"]) && array_key_exists($paramDefinition["name"], $resolvedParams)){
        $supervisionApi->__set($paramDefinition["target_property"], $resolvedParams[$paramDefinition["name"]]);
      }
    }
  }

  function responderApi($status, $message, $data = array()){
    if(ob_get_length() > 0){
      ob_clean();
    }

    echo json_encode(array(
      "status" => (int)$status,
      "success" => ((int)$status === 200),
      "message" => (string)$message,
      "data" => is_array($data) ? $data : array($data),
    ));

    if(ob_get_level() > 0){
      ob_end_flush();
    }
  }

?>
