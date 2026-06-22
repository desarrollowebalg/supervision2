<?php
class apiPreviewForms{
  private $objDbCM;
  private $hostCM;
  private $portCM;
  private $bnameCM;
  private $userCM;
  private $passCM;
  private $idCliente="";
  

  private $registros=array();
  /**@description   Método constructor*/
  function __construct($host,$usuario,$password,$base,$puerto) {//constructor
      $this->hostCM=$host;
      $this->portCM=$puerto;
      $this->bnameCM=$base;
      $this->userCM=$usuario;
      $this->passCM=$password;
    }
    /**@description   Funcion para extraer un valor de una variable*/
  public function __get($name) { return $this->$name; }
  /**@description   Funcion para añadir un valor a una variable*/
  public function __set($name, $value) { return $this->$name = $value; }
  /**@description   Funcion para conectar con el servidor de base de datos*/
  private function conectarServer(){
    $this->objBd = mysqli_connect($this->hostCM, $this->userCM, $this->passCM, $this->bnameCM, $this->portCM);
    if(!$this->objBd)
      echo "Error al realizar la conexion con la base de datos";
  }
  /**@description   Funcion que ejecuta el query en la base de datos*/
  public function ejecutarQuery($sql){
    $sql=@mysqli_query($this->objBd,$sql);
    if(!$sql){
      // echo "Error no.".mysqli_errno($this->objBd);
      $this->erroresConfPdiApi(001,"ERROR");
    }else{
      return $sql;
    }
  }
  public function regresaResultados($result){/**@description  Funcion que regresa el resultado de la consulta*/
    return @mysqli_fetch_array($result);
  }
  public function regresaFila($result){
    return @mysqli_fetch_assoc($result);
  }
  public function numeroRegistros($result){/**@description  Funcion que retorna el numero de registros del query ejecutado*/
    return @mysqli_num_rows($result);
  }
  public function liberarResultado($result){/**@description   Funcion que libera de memoria el resultado de la consulta*/
    return @mysqli_free_result($result);
  }
  public function getAll($result){
    return @mysqli_fetch_all($result,MYSQLI_ASSOC);
  }
  public function getInfoForm($idForm){
    // if($this->idCliente==""){
    //   $this->erroresConfPdiApi(100,"Verifique que el ID de cliente exista");
    // }else{
      $sql="SELECT ID_CUESTIONARIO,IF(INSTR(CRM2_CUESTIONARIOS.DESCRIPCION,'*')=1,SUBSTRING(CRM2_CUESTIONARIOS.DESCRIPCION,2),CRM2_CUESTIONARIOS.DESCRIPCION) AS 'DESCRIPCION',ID_TIPO,TEMA,ITEM_NUMBER FROM CRM2_CUESTIONARIOS WHERE CRM2_CUESTIONARIOS.ID_CUESTIONARIO='".$idForm."' AND IS_WF=0 AND CRM2_CUESTIONARIOS.ACTIVO='S'";
      $this->execQueryApi($sql);
    // }
  }
  public function getQuestionsForm($idForm){
    // if($this->idCliente==""){
    //   $this->erroresConfPdiApi(100,"Verifique que el ID de cliente exista");
    // }else{
      $sql="SELECT 
      CRM2_CUESTIONARIO_PREGUNTAS.ORDEN AS ORDEN,
      CRM2_CUESTIONARIO_PREGUNTAS.ID_PREGUNTA AS ID_PREGUNTA,
      CRM2_PREGUNTAS.DESCRIPCION AS DESCRIPCION,
      CRM2_PREGUNTAS.COMPLEMENTO AS COMPLEMENTO,
      CRM2_PREGUNTAS.ACTIVO AS ACTIVO,
      CRM2_PREGUNTAS.RECORDADO AS RECORDADO,
      CRM2_PREGUNTAS.REQUERIDO AS REQUERIDO,
      CRM2_PREGUNTAS.GRAFICABLEDATA AS GRAFICABLEDATA,
      CRM2_PREGUNTAS.EDITABLE AS EDITABLE,
      CRM2_PREGUNTAS.CONDICIONADO AS CONDICIONADO,
      CRM2_PREGUNTAS.PREGUNTA_DEPENDIENTE AS PREGUNTA_DEPENDIENTE,
      CRM2_PREGUNTAS.DISPARADOR AS DISPARADOR,
      CRM2_PREGUNTAS.FLAG_NUMERABLE AS FLAG_NUMERABLE,
      CRM2_PREGUNTAS.ITEM_NUMBER AS ITEM_NUMBER,
      CRM2_TIPO_PREG.ID_TIPO AS ID_TIPO,
      CRM2_TIPO_PREG.TIPO AS TIPO,
      CRM2_TIPO_PREG.ACTIVO AS ACTIVO,
      CRM2_TIPO_PREG.P_PANTALLA AS P_PANTALLA,
      CRM2_TIPO_PREG.GRAFICABLE AS GRAFICABLE,
      CRM2_TIPO_PREG.PAYLOAD AS PAYLOAD,
      CRM2_TIPO_PREG.EDITABLE AS EDITABLE
      FROM CRM2_CUESTIONARIO_PREGUNTAS 
      INNER JOIN CRM2_PREGUNTAS ON CRM2_CUESTIONARIO_PREGUNTAS.ID_PREGUNTA=CRM2_PREGUNTAS.ID_PREGUNTA
      INNER JOIN CRM2_TIPO_PREG ON CRM2_PREGUNTAS.ID_TIPO=CRM2_TIPO_PREG.ID_TIPO
      WHERE CRM2_CUESTIONARIO_PREGUNTAS.ID_CUESTIONARIO='".$idForm."' 
      ORDER BY CRM2_CUESTIONARIO_PREGUNTAS.ORDEN";
      $this->execQueryApi($sql);      
    // }    
  }
  private function execQueryApi($sql=""){
    if($sql!=""){
      $sqlExec=$sql;
      $this->conectarServer();
      $this->ejecutarQuery("SET NAMES utf8");
      if($res=$this->ejecutarQuery($sqlExec)){
        if($this->numeroRegistros($res)==0){
          $this->erroresConfPdiApi(200,"N/A");
        }else{
          $this->registros=$this->getAll($res);
        }
      }else{
        $this->erroresConfPdiApi(300,"Error al buscar información");
      }
    }else{
      $this->erroresConfPdiApi(001,"Error");
    }
    $this->liberarResultado($res);
  }


  private function erroresConfPdiApi($errorNo,$mensaje){/**@description  Funcion que muestra los errores en la ejecucion del query*/
    switch ($errorNo) {
      case '001':
        $this->registros= array("Error" => $mensaje);
      break;
      case '100':
        $this->registros= array("Error" => $mensaje);
      break;
      case "200":
        $this->registros= array("Error" => $mensaje);
      break;
      case "300":
        $this->registros= array("Error" => $mensaje);
      break;
      default:
        $this->registros= array("Error" => $mensaje);
      break;
    }      
  }
}
?>