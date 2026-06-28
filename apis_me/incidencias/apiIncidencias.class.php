<?php
class apiIncidencias{
  private $objBd;
  private $hostCM;
  private $portCM;
  private $bnameCM;
  private $userCM;
  private $passCM;
  private $idCliente = 0;
  private $idUsuario = 0;
  private $fechaInicial = "";
  private $requiredSessionProperties = array();
  private $registros = array();

  function __construct($host,$usuario,$password,$base,$puerto) {
    $this->hostCM = $host;
    $this->portCM = $puerto;
    $this->bnameCM = $base;
    $this->userCM = $usuario;
    $this->passCM = $password;
  }

  public function __get($name) {
    return $this->$name;
  }

  public function __set($name, $value) {
    return $this->$name = $value;
  }

  public function configureSessionContext($sessionContext){
    $requiredProperties = array();

    if(is_array($sessionContext)){
      foreach($sessionContext as $sessionRule){
        if(!isset($sessionRule["property"])){
          continue;
        }

        $isRequired = !isset($sessionRule["required"]) || $sessionRule["required"] === true;
        if($isRequired){
          $requiredProperties[] = (string)$sessionRule["property"];
        }
      }
    }

    $this->requiredSessionProperties = $requiredProperties;
  }

  private function conectarServer(){
    if($this->objBd instanceof mysqli){
      return true;
    }

    $this->objBd = @mysqli_connect($this->hostCM, $this->userCM, $this->passCM, $this->bnameCM, $this->portCM);
    if(!$this->objBd){
      $this->erroresApi(300, "Error al conectar con la base de datos");
      return false;
    }

    if(!@mysqli_set_charset($this->objBd, "utf8")){
      $this->erroresApi(300, "Error al configurar charset utf8");
      return false;
    }

    if(!@mysqli_query($this->objBd, "SET NAMES utf8")){
      $this->erroresApi(300, "Error al preparar conversion de caracteres");
      return false;
    }

    return true;
  }

  private function prepararConsulta($sql){
    if(!$this->conectarServer()){
      return false;
    }

    $stmt = @mysqli_prepare($this->objBd, $sql);
    if(!$stmt){
      $this->erroresApi(300, "Error al preparar la consulta");
      return false;
    }

    return $stmt;
  }

  private function bindStatementParams($stmt, $types, $params){
    $bindArgs = array($stmt, $types);
    foreach ($params as $key => $value) {
      $bindArgs[] = &$params[$key];
    }

    return call_user_func_array('mysqli_stmt_bind_param', $bindArgs);
  }

  private function ejecutarConsultaPreparada($sql, $types, $params){
    $stmt = $this->prepararConsulta($sql);
    if($stmt === false){
      return false;
    }

    if($types !== "" && !$this->bindStatementParams($stmt, $types, $params)){
      @mysqli_stmt_close($stmt);
      $this->erroresApi(300, "Error al preparar los parametros de consulta");
      return false;
    }

    if(!@mysqli_stmt_execute($stmt)){
      @mysqli_stmt_close($stmt);
      $this->erroresApi(300, "Error al ejecutar la consulta");
      return false;
    }

    $result = @mysqli_stmt_get_result($stmt);
    if($result === false){
      @mysqli_stmt_close($stmt);
      $this->erroresApi(300, "Error al obtener la informacion");
      return false;
    }

    @mysqli_stmt_close($stmt);
    return $result;
  }

  private function validarContextoSesion(){
    if(empty($this->requiredSessionProperties)){
      $this->requiredSessionProperties = array("idCliente", "idUsuario");
    }

    foreach($this->requiredSessionProperties as $property){
      if(!property_exists($this, $property)){
        $this->erroresApi(300, "Configuracion de sesion invalida");
        return false;
      }

      $value = $this->$property;
      if(is_int($value) || ctype_digit((string)$value)){
        $value = (int)$value;
        $this->$property = $value;
        if($value <= 0){
          $this->erroresApi(300, "Sesion no valida");
          return false;
        }
        continue;
      }

      if(trim((string)$value) === ""){
        $this->erroresApi(300, "Sesion no valida");
        return false;
      }
    }

    return true;
  }

  private function resolverBinding($bindingDefinition){
    if(!isset($bindingDefinition["source"]) || !isset($bindingDefinition["name"])){
      $this->erroresApi(300, "Configuracion de bindings invalida");
      return false;
    }

    if($bindingDefinition["source"] !== "property"){
      $this->erroresApi(300, "Origen de binding no soportado");
      return false;
    }

    $property = $bindingDefinition["name"];
    return $this->$property;
  }

  private function construirBindings($executionDefinition){
    $bindings = isset($executionDefinition["bindings"]) ? $executionDefinition["bindings"] : array();
    $types = "";
    $params = array();

    foreach($bindings as $bindingDefinition){
      if(!isset($bindingDefinition["type"])){
        $this->erroresApi(300, "Configuracion de bindings invalida");
        return false;
      }

      $value = $this->resolverBinding($bindingDefinition);
      if($value === false && isset($this->registros["Error"])){
        return false;
      }

      $types .= $bindingDefinition["type"];
      if($bindingDefinition["type"] === "i"){
        $params[] = (int)$value;
      } else {
        $params[] = (string)$value;
      }
    }

    return array(
      "types" => $types,
      "params" => $params,
    );
  }

  private function normalizarResultado($resultMode, $result){
    if($this->numeroRegistros($result) === 0){
      @mysqli_free_result($result);
      $this->registros = array();
      return;
    }

    $rows = @mysqli_fetch_all($result, MYSQLI_ASSOC);
    @mysqli_free_result($result);

    if($resultMode === "single"){
      $this->registros = array($rows[0]);
      return;
    }

    $this->registros = $rows;
  }

  public function executeDefinedAction($actionDefinition){
    if(!$this->validarContextoSesion()){
      return;
    }

    if(!isset($actionDefinition["execution"]) || !is_array($actionDefinition["execution"])){
      $this->erroresApi(300, "Configuracion de ejecucion invalida");
      return;
    }

    $executionDefinition = $actionDefinition["execution"];
    if(!isset($executionDefinition["type"])){
      $this->erroresApi(300, "Tipo de ejecucion invalido");
      return;
    }

    switch($executionDefinition["type"]){
      case "query":
        $this->executeDefinedQuery($executionDefinition);
      break;
      case "stored_procedure":
        $this->executeDefinedProcedure($executionDefinition);
      break;
      case "api":
        $this->executeDefinedApi($executionDefinition);
      break;
      default:
        $this->erroresApi(300, "Tipo de ejecucion no soportado");
      break;
    }
  }

  private function executeDefinedQuery($executionDefinition){
    if(!isset($executionDefinition["sql"]) || trim((string)$executionDefinition["sql"]) === ""){
      $this->erroresApi(300, "Consulta no definida");
      return;
    }

    $bindingData = $this->construirBindings($executionDefinition);
    if($bindingData === false){
      return;
    }

    $result = $this->ejecutarConsultaPreparada($executionDefinition["sql"], $bindingData["types"], $bindingData["params"]);
    if($result === false){
      return;
    }

    $resultMode = isset($executionDefinition["result_mode"]) ? $executionDefinition["result_mode"] : "list";
    $this->normalizarResultado($resultMode, $result);
  }

  private function executeDefinedProcedure($executionDefinition){
    if(!isset($executionDefinition["sql"]) || trim((string)$executionDefinition["sql"]) === ""){
      $this->erroresApi(300, "Procedimiento no definido");
      return;
    }

    $bindingData = $this->construirBindings($executionDefinition);
    if($bindingData === false){
      return;
    }

    $result = $this->ejecutarConsultaPreparada($executionDefinition["sql"], $bindingData["types"], $bindingData["params"]);
    if($result === false){
      return;
    }

    $resultMode = isset($executionDefinition["result_mode"]) ? $executionDefinition["result_mode"] : "list";
    $this->normalizarResultado($resultMode, $result);
  }

  private function executeDefinedApi($executionDefinition){
    if(!isset($executionDefinition["url"]) || trim((string)$executionDefinition["url"]) === ""){
      $this->erroresApi(300, "URL de API no definida");
      return;
    }

    if(!function_exists("curl_init")){
      $this->erroresApi(300, "cURL no disponible en servidor");
      return;
    }

    $payload = $this->construirApiPayload($executionDefinition);
    if($payload === false){
      return;
    }

    $rawPayload = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if($rawPayload === false){
      $this->erroresApi(300, "No fue posible serializar el payload de API");
      return;
    }

    $method = isset($executionDefinition["method"]) ? strtoupper(trim((string)$executionDefinition["method"])) : "POST";
    $headers = isset($executionDefinition["headers"]) && is_array($executionDefinition["headers"])
      ? $executionDefinition["headers"]
      : array("Content-Type: application/json");

    $curl = curl_init();
    curl_setopt_array($curl, array(
      CURLOPT_URL => $executionDefinition["url"],
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 30,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => $method,
      CURLOPT_POSTFIELDS => $rawPayload,
      CURLOPT_HTTPHEADER => $headers,
    ));

    $response = curl_exec($curl);
    $httpCode = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlErrno = (int)curl_errno($curl);
    $curlError = curl_error($curl);
    curl_close($curl);

    if($response === false){
      $this->erroresApi(300, "Error al invocar API externa: ".$curlError);
      return;
    }

    if($curlErrno !== 0){
      $this->erroresApi(300, "Error de cURL al invocar API externa: ".$curlError);
      return;
    }

    if($httpCode < 200 || $httpCode >= 300){
      $this->erroresApi(300, "API externa respondio HTTP ".$httpCode);
      return;
    }

    if(trim((string)$response) === ""){
      $this->registros = array();
      return;
    }

    $decoded = json_decode($response, true);
    if($decoded === null && json_last_error() !== JSON_ERROR_NONE){
      $this->erroresApi(300, "Respuesta invalida de API externa");
      return;
    }

    $resultMode = isset($executionDefinition["result_mode"]) ? $executionDefinition["result_mode"] : "list";
    $this->normalizarResultadoApi($resultMode, $decoded);
  }

  private function construirApiPayload($executionDefinition){
    $bodyDefinition = isset($executionDefinition["body"]) ? $executionDefinition["body"] : array();
    if(!is_array($bodyDefinition)){
      $this->erroresApi(300, "Configuracion de payload API invalida");
      return false;
    }

    $payload = array();
    foreach($bodyDefinition as $fieldName => $fieldDefinition){
      if(!is_array($fieldDefinition)){
        $payload[$fieldName] = $fieldDefinition;
        continue;
      }

      $value = $this->resolverBinding($fieldDefinition);
      if($value === false && isset($this->registros["Error"])){
        return false;
      }

      $cast = isset($fieldDefinition["cast"]) ? (string)$fieldDefinition["cast"] : "";
      switch($cast){
        case "int":
          $payload[$fieldName] = (int)$value;
        break;
        case "string":
          $payload[$fieldName] = (string)$value;
        break;
        default:
          $payload[$fieldName] = $value;
        break;
      }
    }

    return $payload;
  }

  private function normalizarResultadoApi($resultMode, $decoded){
    if(!is_array($decoded)){
      $this->registros = array(
        array(
          "value" => $decoded,
        ),
      );
      return;
    }

    if($this->esListaSecuencial($decoded)){
      $this->registros = $decoded;
      return;
    }

    if(isset($decoded["data"]) && is_array($decoded["data"])){
      if($resultMode === "single" && $this->esListaSecuencial($decoded["data"]) && isset($decoded["data"][0])){
        $this->registros = array($decoded["data"][0]);
        return;
      }

      $this->registros = $decoded["data"];
      return;
    }

    if($resultMode === "single"){
      $this->registros = array($decoded);
      return;
    }

    $this->registros = array($decoded);
  }

  private function esListaSecuencial($value){
    if(!is_array($value)){
      return false;
    }

    if(empty($value)){
      return true;
    }

    return array_keys($value) === range(0, count($value) - 1);
  }

  public function numeroRegistros($result){
    return @mysqli_num_rows($result);
  }

  private function erroresApi($errorNo, $mensaje){
    switch ($errorNo) {
      case '200':
        $this->registros = array();
      break;
      case '300':
      default:
        $this->registros = array("Error" => $mensaje);
      break;
    }
  }
}
?>
