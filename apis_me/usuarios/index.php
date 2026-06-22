<?php
  error_reporting(E_ALL);
  ini_set('display_errors', '0');
  if(session_id() === '' && !headers_sent()){
    session_start();
  }
  set_time_limit(0);
  header("Access-Control-Allow-Origin: *");
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Methods: GET, POST');
  header("Access-Control-Allow-Headers: X-Requested-With");
  header('Content-Type: application/json; charset=utf-8');
  header('P3P: CP="IDC DSP COR CURa ADMa OUR IND PHY ONL COM STA"');

  require_once dirname(__DIR__) . "/Route.php";
  require_once dirname(__FILE__)."/apiUsuarios.class.php";

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
  $usuariosApi = new apiUsuarios($config_bd["host"],$config_bd["user"],$config_bd["pass"],$config_bd["bname"],$config_bd["port"]);

  hidratarContextoSesion($usuariosApi, $moduleConfig["session_context"]);
  $resolvedParams = resolverParametrosAccion($route, $actionDefinition);
  hidratarPropiedadesAccion($usuariosApi, $actionDefinition, $resolvedParams);

  $usuariosApi->executeDefinedAction($actionDefinition);
  $resultado = $usuariosApi->__get("registros");

  if(isset($resultado["Error"])){
    $mensaje = ($resultado["Error"] === "") ? "NO EXISTE" : $resultado["Error"];
    responderApi(300, $mensaje);
    exit();
  }

  responderApi(200, "OK", $resultado);

  function iniciarSesionApi(){
    if(!headers_sent()){
      if(function_exists('session_status')){
        if(session_status() === PHP_SESSION_NONE){
          session_start();
        }
      } else if(session_id() === ''){
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

  function construirDiagnosticoSesion($reason, $sessionKey){
    $cookieName = session_name();
    $hasSessionCookie = isset($_COOKIE[$cookieName]) && trim((string)$_COOKIE[$cookieName]) !== "";
    $sessionValue = null;

    if($sessionKey !== null && isset($_SESSION[$sessionKey])){
      $sessionValue = $_SESSION[$sessionKey];
    }

    return array(
      "debug_session" => array(
        "reason" => $reason,
        "session_id" => session_id(),
        "session_name" => $cookieName,
        "has_session_cookie" => $hasSessionCookie,
        "requested_session_key" => $sessionKey,
        "session_key_exists" => ($sessionKey !== null) ? isset($_SESSION[$sessionKey]) : false,
        "session_key_value" => $sessionValue,
      ),
    );
  }

  function hidratarContextoSesion($usuariosApi, $sessionContext){
    foreach($sessionContext as $sessionRule){
      $value = $_SESSION[$sessionRule["session_key"]];
      if($sessionRule["type"] === "int"){
        $value = (int)$value;
      }
      $usuariosApi->__set($sessionRule["property"], $value);
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
      case "string":
      default:
        return $rawValue;
    }
  }

  function hidratarPropiedadesAccion($usuariosApi, $actionDefinition, $resolvedParams){
    $params = isset($actionDefinition["params"]) ? $actionDefinition["params"] : array();
    foreach($params as $paramDefinition){
      if(isset($paramDefinition["target_property"]) && array_key_exists($paramDefinition["name"], $resolvedParams)){
        $usuariosApi->__set($paramDefinition["target_property"], $resolvedParams[$paramDefinition["name"]]);
      }
    }
  }

  function responderApi($status, $message, $data = array()){
    echo json_encode(array(
      "status" => (int)$status,
      "success" => ((int)$status === 200),
      "message" => (string)$message,
      "data" => is_array($data) ? $data : array($data),
    ));
  }

?>
