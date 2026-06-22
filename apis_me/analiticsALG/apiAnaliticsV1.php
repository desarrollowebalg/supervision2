<?php
class apiPdiV2{
  private $objDbCM;
  private $hostCM;
  private $portCM;
  private $bnameCM;
  private $userCM;
  private $passCM;
  private $idCliente="";
  private $itemNumber="";
  private $idObjectMap="";
  private $cadValueInsertPdi="";

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
  private function getURLAnalitics(){
    $this->conectarServer();
  }
  private function enviarInfoAnalitcs($payload){
    // URL de destino
    $url = 'https://ojsnvpqexl.execute-api.us-east-1.amazonaws.com/default/demo_insert_DDB';

    // Cabeceras de la solicitud
    $headers = array(
        'Content-Type: application/json', // Tipo de contenido
        'api-key: tu_api_key' // Agrega aquí tu API key
    );

    // Configurar la solicitud cURL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    // Ejecutar la solicitud y obtener la respuesta
    $response = curl_exec($ch);

    // Verificar si ocurrió algún error
    if ($response === false) {
        echo 'Error en la solicitud: ' . curl_error($ch);
    }

    // Cerrar la conexión cURL
    curl_close($ch);

    // Manejar la respuesta
    echo 'Respuesta: ' . $response;
  }
  public function setApiAnaliticsALG_v1($idUsuario,$payload){
    //echo "<br>".$payload."<br>";
    
    $this->enviarInfoAnalitcs($payload);
  }















  public function getVisitasPdiUser($idUsuario,$idObjectMap){
    $this->conectarServer();
    $this->ejecutarQuery("SET NAMES utf8");
    $sql="";
  }
  public function getVisitaPdiUserByDate($idUsuario,$idObjectMap,$fechaInicio,$fechaFinal){
    if($this->idCliente==""){
      $this->erroresConfPdiApi(100,"Verifique que el ID de cliente exista");
    }else{
      // echo "en la clase";
      // echo "<br>";
      // echo $idUsuario;
      // echo "<br>";
      // echo $idObjectMap;
      // echo "<br>";
      // echo $fechaInicio;
      // echo "<br>";
      // echo $fechaFinal;
      // echo "<br>";

      $sql="SELECT R.ID_RES_CUESTIONARIO,IF(INSTR(Q.DESCRIPCION,'*')=1,SUBSTRING(Q.DESCRIPCION,2),Q.DESCRIPCION) AS QST,U.NOMBRE_COMPLETO,R.LATITUD,R.LONGITUD,Q.ID_TIPO,DATE_FORMAT(R.FECHA, '%y/%m/%d') FECHA,DATE_FORMAT(R.FECHA,'%H:%i:%s') HORA 
        FROM ADM_GEOREFERENCIA_RESPUESTAS GR
          INNER JOIN CRM2_RESPUESTAS R ON R.ID_RES_CUESTIONARIO = GR.ID_RES_CUESTIONARIO
          INNER JOIN CRM2_CUESTIONARIOS Q ON Q.ID_CUESTIONARIO = R.ID_CUESTIONARIO
          INNER JOIN ADM_USUARIOS U ON U.ID_USUARIO = R.COD_USER
      WHERE GR.ID_OBJECT_MAP = '".$idObjectMap."'
      AND R.FECHA_INICIO_CAPTURA BETWEEN '".$fechaInicio."' AND '".$fechaFinal."'
      AND IF(IS_ADMIN(".$idUsuario.") = 0, U.ID_USUARIO='".$idUsuario."',1)
      ORDER BY FECHA DESC";

      //echo $sql;exit();
  
      $this->execQueryApi($sql);

    }
  }
  public function extraerPdisCliente($idCliente){
    if($this->idCliente==""){
      $this->erroresConfPdiApi(100,"Verifique que el ID de cliente exista");
    }else{
      $bloque_tamano = 1000; // Cantidad de registros por bloque
      $offset = 0; // Desplazamiento inicial
      $regs = array(); // Array para almacenar registros

      $this->conectarServer();

      while(true){
        $this->ejecutarQuery("SET NAMES utf8");
        $sql="SELECT 
        ADM_GEOREFERENCIAS.ID_OBJECT_MAP AS IDOBJMAP,
        ADM_GEOREFERENCIAS.DESCRIPCION AS DESCRIPCION,
        ADM_GEOREFERENCIAS.LONGITUDE AS LONGITUDE,
        ADM_GEOREFERENCIAS.LATITUDE AS LATITUDE,
        ADM_GEOREFERENCIAS.RADIO AS RADIO,
        ADM_GEOREFERENCIAS.TIPO AS TIPO,
        ADM_GEOREFERENCIAS.ITEM_NUMBER AS ITEM_NUMBER,
        ADM_GEOREFERENCIAS.DIRECCION_CALCULADA AS DIRECCION,
        ADM_GEOREFERENCIAS_TIPO.DESCRIPCION AS TIPO
        FROM ADM_GEOREFERENCIAS INNER JOIN ADM_GEOREFERENCIAS_TIPO ON ADM_GEOREFERENCIAS.ID_TIPO_GEO=ADM_GEOREFERENCIAS_TIPO.ID_TIPO AND ADM_GEOREFERENCIAS.ID_CLIENTE='".$this->idCliente."'
        WHERE ADM_GEOREFERENCIAS.ID_CLIENTE='".$this->idCliente."' AND ACTIVO='S'
        ORDER BY IDOBJMAP
        LIMIT $offset, $bloque_tamano";
        //echo $sql;

        $resultado = $this->ejecutarQuery($sql);

        // Verificar si hay resultados
        if ($this->numeroRegistros($resultado) == 0) {
          // No hay más resultados, terminar el bucle
          break;
        }

        // Agregar los registros al array
        while ($fila = $this->regresaFila($resultado)) {
          $regs[] = $fila;
        }

        // Incrementar el desplazamiento para el siguiente bloque
        $offset += $bloque_tamano;

        // Esperar un breve periodo para evitar sobrecargar el servidor
        usleep(10000); // 10 milisegundos

      }

      // Convertir el array de registros a formato JSON y enviarlo
      //echo json_encode($registros);
      $this->registros=$regs;



      //$this->execQueryApi($sql);
    }
  }
  public function setPDICliente(){
    if($this->idCliente==""){
      $this->erroresConfPdiApi(100,"Verifique que el ID de cliente exista");
    }else{      
      $sql="CALL INST_PDI".$this->cadValueInsertPdi;
      $this->execQueryApi($sql);
    }
  }
  public function getInfoPDICliente(){
    if($this->idCliente==""){
      $this->erroresConfPdiApi(100,"Verifique que el ID de cliente exista");
    }else{      
      $sql="CALL VAL_PDI3(".$this->idCliente.",'(\'".$this->idObjectMap."\',\'".$this->itemNumber."\')')";
      $this->execQueryApi($sql);
    }
  }
  public function getIdCliente($idUsuario){
    $sql="SELECT ID_CLIENTE FROM ADM_USUARIOS WHERE ID_USUARIO='".$idUsuario."'";
    $this->conectarServer();
    $res=$this->ejecutarQuery($sql);
    $fila = $this->regresaFila($res);    
    return $fila["ID_CLIENTE"];
  }
  private function execQueryApi($sql=""){
    if($sql!=""){
      $sqlExec=$sql;
      $this->conectarServer();
      $this->ejecutarQuery("SET NAMES utf8");
      if($res=$this->ejecutarQuery($sqlExec)){
        if($this->numeroRegistros($res)==0){
          $this->erroresConfPdiApi(200,"");
        }else{
          $this->registros=$this->getAll($res);
        }
      }else{
        $this->erroresConfPdiApi(300,"Error al buscar información");
      }
    }else{
      $this->erroresConfPdiApi(001,"Error");
    }
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