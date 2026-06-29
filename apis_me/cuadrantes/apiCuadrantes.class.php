<?php
class apiCuadrantes{
  private $objBd;
  private $hostCM;
  private $portCM;
  private $bnameCM;
  private $userCM;
  private $passCM;
  private $idCliente = 0;
  private $registros = array();
  private $stepResults = array();

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

  private function conectarServer(){
    if($this->objBd instanceof mysqli){
      return true;
    }

    $this->objBd = @mysqli_connect($this->hostCM, $this->userCM, $this->passCM, $this->bnameCM, $this->portCM);
    if(!$this->objBd){
      $this->erroresConfCuadrantesApi(300, "Error al conectar con la base de datos");
      return false;
    }

    @mysqli_set_charset($this->objBd, "utf8");
    return true;
  }

  private function prepararConsulta($sql){
    if(!$this->conectarServer()){
      return false;
    }

    $stmt = @mysqli_prepare($this->objBd, $sql);
    if(!$stmt){
      $this->erroresConfCuadrantesApi(300, "Error al preparar la consulta");
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
      $this->erroresConfCuadrantesApi(300, "Error al preparar los parametros de consulta");
      return false;
    }

    if(!@mysqli_stmt_execute($stmt)){
      @mysqli_stmt_close($stmt);
      $this->erroresConfCuadrantesApi(300, "Error al ejecutar la consulta");
      return false;
    }

    $result = @mysqli_stmt_get_result($stmt);
    if($result === false){
      @mysqli_stmt_close($stmt);
      $this->erroresConfCuadrantesApi(300, "Error al obtener la informacion");
      return false;
    }

    @mysqli_stmt_close($stmt);
    return $result;
  }

  private function validarContextoSesion(){
    if((int)$this->idCliente <= 0){
      $this->erroresConfCuadrantesApi(300, "Sesion no valida");
      return false;
    }

    $this->idCliente = (int)$this->idCliente;
    return true;
  }

  private function resolverBinding($bindingDefinition){
    if(!isset($bindingDefinition["source"])){
      $this->erroresConfCuadrantesApi(300, "Configuracion de bindings invalida");
      return false;
    }

    switch($bindingDefinition["source"]){
      case "property":
        if(!isset($bindingDefinition["name"])){
          $this->erroresConfCuadrantesApi(300, "Configuracion de bindings invalida");
          return false;
        }

        $property = $bindingDefinition["name"];
        return $this->$property;
      case "step_field":
        return $this->resolverBindingStepField($bindingDefinition);
      default:
        $this->erroresConfCuadrantesApi(300, "Origen de binding no soportado");
        return false;
    }
  }

  private function resolverBindingStepField($bindingDefinition){
    if(!isset($bindingDefinition["step"]) || !isset($bindingDefinition["field"])){
      $this->erroresConfCuadrantesApi(300, "Configuracion de bindings invalida");
      return false;
    }

    $stepKey = $bindingDefinition["step"];
    $field = $bindingDefinition["field"];

    if(!isset($this->stepResults[$stepKey]) || !is_array($this->stepResults[$stepKey])){
      $this->erroresConfCuadrantesApi(300, "Resultado intermedio no disponible");
      return false;
    }

    if(!array_key_exists($field, $this->stepResults[$stepKey])){
      $this->erroresConfCuadrantesApi(300, "Campo intermedio no disponible");
      return false;
    }

    return $this->stepResults[$stepKey][$field];
  }

  private function construirBindings($executionDefinition){
    $bindings = isset($executionDefinition["bindings"]) ? $executionDefinition["bindings"] : array();
    $types = "";
    $params = array();

    foreach($bindings as $bindingDefinition){
      if(!isset($bindingDefinition["type"])){
        $this->erroresConfCuadrantesApi(300, "Configuracion de bindings invalida");
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
      $this->erroresConfCuadrantesApi(300, "Configuracion de ejecucion invalida");
      return;
    }

    $executionDefinition = $actionDefinition["execution"];
    if(!isset($executionDefinition["type"])){
      $this->erroresConfCuadrantesApi(300, "Tipo de ejecucion invalido");
      return;
    }

    switch($executionDefinition["type"]){
      case "query":
        $this->executeDefinedQuery($executionDefinition);
      break;
      case "query_chain":
        $this->executeDefinedQueryChain($executionDefinition);
      break;
      case "stored_procedure":
        $this->executeDefinedProcedure($executionDefinition);
      break;
      default:
        $this->erroresConfCuadrantesApi(300, "Tipo de ejecucion no soportado");
      break;
    }
  }

  private function executeDefinedQuery($executionDefinition){
    if(!isset($executionDefinition["sql"]) || trim((string)$executionDefinition["sql"]) === ""){
      $this->erroresConfCuadrantesApi(300, "Consulta no definida");
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

  private function executeDefinedQueryChain($executionDefinition){
    if(!isset($executionDefinition["steps"]) || !is_array($executionDefinition["steps"]) || count($executionDefinition["steps"]) === 0){
      $this->erroresConfCuadrantesApi(300, "Pasos de consulta no definidos");
      return;
    }

    $this->stepResults = array();
    $lastRows = array();

    foreach($executionDefinition["steps"] as $stepDefinition){
      if(!isset($stepDefinition["key"]) || trim((string)$stepDefinition["key"]) === ""){
        $this->erroresConfCuadrantesApi(300, "Paso de consulta invalido");
        return;
      }

      if(!isset($stepDefinition["sql"]) || trim((string)$stepDefinition["sql"]) === ""){
        $this->erroresConfCuadrantesApi(300, "Consulta no definida");
        return;
      }

      $bindingData = $this->construirBindings($stepDefinition);
      if($bindingData === false){
        return;
      }

      $result = $this->ejecutarConsultaPreparada($stepDefinition["sql"], $bindingData["types"], $bindingData["params"]);
      if($result === false){
        return;
      }

      $rows = $this->obtenerFilasResultado($result);
      if($rows === false){
        return;
      }

      if(count($rows) === 0){
        $this->registros = array();
        $this->stepResults = array();
        return;
      }

      $stepKey = $stepDefinition["key"];
      $resultMode = isset($stepDefinition["result_mode"]) ? $stepDefinition["result_mode"] : "list";

      if($resultMode === "single"){
        $this->stepResults[$stepKey] = $rows[0];
      } else {
        $this->stepResults[$stepKey] = $rows;
      }

      $lastRows = $rows;
    }

    $this->stepResults = array();
    $this->registros = $lastRows;
  }

  private function executeDefinedProcedure($executionDefinition){
    if(!isset($executionDefinition["sql"]) || trim((string)$executionDefinition["sql"]) === ""){
      $this->erroresConfCuadrantesApi(300, "Procedimiento no definido");
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

  public function numeroRegistros($result){
    return @mysqli_num_rows($result);
  }

  private function obtenerFilasResultado($result){
    $rows = @mysqli_fetch_all($result, MYSQLI_ASSOC);
    @mysqli_free_result($result);

    if(!is_array($rows)){
      $this->erroresConfCuadrantesApi(300, "Error al obtener la informacion");
      return false;
    }

    return $rows;
  }

  private function erroresConfCuadrantesApi($errorNo, $mensaje){
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
