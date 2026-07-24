<?php
  error_reporting(E_ALL);
  ini_set('display_errors', '0');
  set_time_limit(0);
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET, POST');
  header("Access-Control-Allow-Headers: X-Requested-With");
  header('Content-Type: application/json; charset=utf-8');
  header('P3P: CP="IDC DSP COR CURa ADMa OUR IND PHY ONL COM STA"');
  ob_start();

  require_once dirname(__DIR__) . "/Route.php";
  require_once dirname(__FILE__)."/apiReports.class.php";

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

  include "../../config/database.php";
  $reportsApi = new apiReports($config_bd["host"],$config_bd["user"],$config_bd["pass"],$config_bd["bname"],$config_bd["port"]);

  hidratarContextoSesion($reportsApi, $moduleConfig["session_context"]);
  $resolvedParams = resolverParametrosAccion($route, $actionDefinition);
  hidratarPropiedadesAccion($reportsApi, $actionDefinition, $resolvedParams);

  $reportsApi->executeDefinedAction($actionDefinition);
  $resultado = $reportsApi->__get("registros");

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

  function hidratarContextoSesion($reportsApi, $sessionContext){
    foreach($sessionContext as $sessionRule){
      $value = $_SESSION[$sessionRule["session_key"]];
      if($sessionRule["type"] === "int"){
        $value = (int)$value;
      }
      $reportsApi->__set($sessionRule["property"], $value);
    }
  }

  function resolverParametrosAccion($route, $actionDefinition){
    $resolvedParams = array();
    $params = isset($actionDefinition["params"]) ? $actionDefinition["params"] : array();

    foreach($params as $paramDefinition){
      $routeIndex = $paramDefinition["route_index"];
      $errorLabel = $paramDefinition["error_label"];

      if(!isset($route[$routeIndex])){
        responderApi(300, "Error, especifique un ".$errorLabel." valido");
        exit();
      }

      $rawValue = trim((string)$route[$routeIndex]);
      if($rawValue === ""){
        responderApi(300, "Error, especifique un ".$errorLabel." valido");
        exit();
      }

      $resolvedParams[$paramDefinition["name"]] = normalizarParametro($rawValue, $paramDefinition);
    }

    return $resolvedParams;
  }

  function normalizarParametro($rawValue, $paramDefinition){
    switch($paramDefinition["type"]){
      case "int":
        if(!ctype_digit($rawValue) || (int)$rawValue <= 0){
          responderApi(300, "Error, especifique un ".$paramDefinition["error_label"]." valido");
          exit();
        }
        return (int)$rawValue;
      case "date":
        $decodedValue = rawurldecode($rawValue);
        $date = DateTime::createFromFormat('Y-m-d', $decodedValue);
        $isValidDate = $date && $date->format('Y-m-d') === $decodedValue;
        if(!$isValidDate){
          responderApi(300, "Error, especifique una ".$paramDefinition["error_label"]." valida");
          exit();
        }
        return $decodedValue;
      case "string":
      default:
        return rawurldecode($rawValue);
    }
  }

  function hidratarPropiedadesAccion($reportsApi, $actionDefinition, $resolvedParams){
    $params = isset($actionDefinition["params"]) ? $actionDefinition["params"] : array();
    foreach($params as $paramDefinition){
      if(isset($paramDefinition["target_property"]) && array_key_exists($paramDefinition["name"], $resolvedParams)){
        $reportsApi->__set($paramDefinition["target_property"], $resolvedParams[$paramDefinition["name"]]);
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
