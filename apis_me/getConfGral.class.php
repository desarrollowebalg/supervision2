<?php
/**
 * Clase para poder extraer la configuracion general de la plataforma
 * Autor - Gerardo Lara - Daniel Arazo
 */
class getConfGral{
  private $objDbCM;
  private $hostCM;
  private $portCM;
  private $bnameCM;
  private $userCM;
  private $passCM;
  private $confGral="";

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

  private function conectarServer(){
    $this->objBd = mysqli_connect($this->hostCM, $this->userCM, $this->passCM, $this->bnameCM, $this->portCM);
    if(!$this->objBd)
      echo "Error al realizar la conexion con la base de datos";
  }
  private function ejecutarQuery($sql){/**@description   Funcion que ejecuta el query en la base de datos*/
    $sql=@mysqli_query($this->objBd,$sql);
    if(!$sql){
      echo "Error no.".mysqli_errno($this->objBd);
    }else{
      return $sql;
    }
  }
  private function regresaResultados($result){/**@description  Funcion que regresa el resultado de la consulta*/
    return @mysqli_fetch_array($result);
  }   
  private function numeroRegistros($result){/**@description  Funcion que retorna el numero de registros del query ejecutado*/
    return @mysqli_num_rows($result);
  }
  private function liberarResultado($result){/**@description   Funcion que libera de memoria el resultado de la consulta*/
    return @mysqli_free_result($result);
  }
  private function queryDefault($confs){
    if($confs===""){
     // $sql="SELECT * FROM A_MOVI_CONF";
      $sql="SELECT id,NOMBRE_CONF,VALOR FROM A_MOVI_CONF";
    }else{
      //$sql="SELECT * FROM A_MOVI_CONF WHERE NOMBRE_CONF IN (".$confs.")";
      $sql="SELECT id,NOMBRE_CONF,VALOR FROM A_MOVI_CONF WHERE NOMBRE_CONF IN (".$confs.")";
    }
    return $sql;
  }
  public function getConfiguracionGralMovilizandome($confs="",$idEmpresa="0"){
    $confAval=array();
    $this->conectarServer();
    if($idEmpresa==""){
      echo "Error al cargar configuración general<br>Cod MOVI00001";
      exit();
    }else{
      if($idEmpresa!="0"){
        // echo "Se extrae configuracion faltante<br>";
        if($confs===""){
          $sql="SELECT id,NOMBRE_CONF,VALOR FROM ADM_EMPRESAS_CONF WHERE ID_EMPRESA='".$idEmpresa."'";
        }else{
          $sql="SELECT id,NOMBRE_CONF,VALOR FROM ADM_EMPRESAS_CONF WHERE ID_EMPRESA='".$idEmpresa."' AND NOMBRE_CONF IN (".$confs.")";
        }
      }else{
        if($confs===""){
          $sql=$this->queryDefault($confs);
        }else{
          $sql=$this->queryDefault($confs);
        }    
      }
    }    
    $resSA=$this->ejecutarQuery($sql);
    if($resSA){
      if($this->numeroRegistros($resSA)===0){
        if($confs===""){
          $sql=$this->queryDefault($confs);
        }else{
          $sql=$this->queryDefault($confs);
        }
        $resSA=$this->ejecutarQuery($sql);
        while($rowSA=$this->regresaResultados($resSA)){
          array_push($confAval,$rowSA);
        }        
      }else{
        while($rowSA=$this->regresaResultados($resSA)){
          array_push($confAval,$rowSA);
        }
      }
    }else{
      array_push($confAval,"0");
    }

     $prevalida = json_encode($confAval);
    
      if ($prevalida === false) {
       // echo 'cargar alternativa, crear log y enviar mail ';
        include 'errors/confRespaldoGral.php';
        include 'metodosAWS.php';
        $logCG = new metodosAWS();
        // print_r($confRespaldo);
        //  echo "Error al codificar JSON, Mensaje: ".json_last_error_msg().' se limpiara la structura';
         //  $confAval = $this->reemplazarEnArray($confAval);
          // $prevalida = json_encode($confAval);
         //-------------------------//
          $error_msg = '[Titulo]: Ha ocurrido un error al construir el json, '.
                  ' [Clave de error]:'.json_last_error().
                  ' [Mensaje de error]:'.json_last_error_msg().
                  ' [Servidor]: '.$_SERVER['SERVER_NAME'].
                  ' [PHP VER.]: '.phpversion().
                  ' [Accion-realizada]: Se ha reemplazado el json original por json alternativo';
          //-------------------------//
          $tituloMail = 'Evento generado en Servidor [FCG] - json error ['.json_last_error().']';
          $error_msg_mail = '[Titulo]: Ha ocurrido un error al construir el json CG, '.
                  ' <br>[Clave de error]:'.json_last_error().
                  ' <br>[Mensaje de error]:'.json_last_error_msg().
                  ' <br>[Servidor]: '.$_SERVER['SERVER_NAME'].
                  ' <br>[PHP VER.]: '.phpversion().
                  ' <br>[Accion-realizada]: Se ha reemplazado el json original por json alternativo';     
        //-------------------------//             
        $logCG->crearLogEnServer(0,$error_msg);
        $logCG->enviarMailAWS('daniel@movilizando.me',$tituloMail,$error_msg_mail);
        $this->confGral=$confRespaldo;

      } else {
         // echo 'todo okkkkk';
          $this->confGral=$prevalida;
      }
  }
   /* public function reemplazarEnArray($array) {
        return array_map(function($item) {
            if (is_array($item)) {
                return $this->reemplazarEnArray($item);
            } else {
                return $this->reemplazarCaracteres($item);
            }
        }, $array);
    }
  
   public function reemplazarCaracteres($cadena) {
    $reemplazos = array("`"=>" ","ñ"=>"n","é" => "e", "í" => "i", "ó" => "o", "ú" => "u");
    return strtr(utf8_encode($cadena), $reemplazos);
   }*/

}
?>