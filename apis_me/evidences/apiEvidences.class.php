<?php
class apiEvidences{
  private const TEXT_EVIDENCE_API_URL = "https://ktw6p76syh.execute-api.us-east-1.amazonaws.com/DEV/New_Evidence";
  private const PHOTO_EVIDENCE_API_URL = "http://s3-api.movilizandome.xyz/carga.php";
  private const PHOTO_EVIDENCE_BUCKET = "movilizandome-cloudfront";
  private const EVIDENCE_LOG_BASE_PATH = __DIR__."/../../logs/evidences";
  private $idCliente = 0;
  private $idUsuario = 0;
  private $textEvidencePayload = array();
  private $photoEvidencePayload = array();
  private $registros = array();

  public function __get($name){
    return $this->$name;
  }

  public function __set($name, $value){
    return $this->$name = $value;
  }

  private function validarContextoSesion(){
    if((int)$this->idCliente <= 0 || (int)$this->idUsuario <= 0){
      $this->erroresConfEvidencesApi("Sesion no valida");
      return false;
    }

    $this->idCliente = (int)$this->idCliente;
    $this->idUsuario = (int)$this->idUsuario;
    return true;
  }

  public function executeDefinedAction($actionDefinition){
    if(!$this->validarContextoSesion()){
      return;
    }

    if(!isset($actionDefinition["execution"]) || !is_array($actionDefinition["execution"])){
      $this->erroresConfEvidencesApi("Configuracion de ejecucion invalida");
      return;
    }

    $executionDefinition = $actionDefinition["execution"];
    if(!isset($executionDefinition["type"])){
      $this->erroresConfEvidencesApi("Tipo de ejecucion invalido");
      return;
    }

    switch($executionDefinition["type"]){
      case "capture_json":
        $this->executeCaptureJson($executionDefinition);
      break;
      default:
        $this->erroresConfEvidencesApi("Tipo de ejecucion no soportado");
      break;
    }
  }

  private function executeCaptureJson($executionDefinition){
    if(!isset($executionDefinition["payload_property"])){
      $this->erroresConfEvidencesApi("Propiedad de payload no configurada");
      return;
    }

    $payloadProperty = $executionDefinition["payload_property"];
    $payload = $this->$payloadProperty;

    if(!is_array($payload) || empty($payload)){
      $this->erroresConfEvidencesApi("Payload vacio o invalido");
      return;
    }

    $payload["_meta"] = array(
      "idCliente" => $this->idCliente,
      "idUsuario" => $this->idUsuario,
      "receivedAt" => gmdate("c"),
    );

    if($payloadProperty === "textEvidencePayload"){
      $this->writeEvidenceLog("save-text", "request_received", array(
        "payloadProperty" => $payloadProperty,
        "answersCount" => isset($payload["answers"]) && is_array($payload["answers"]) ? count($payload["answers"]) : 0,
        "frontPayload" => $this->buildLoggableFrontPayload($payload, "save-text"),
      ));

      $rawTextPayload = $this->buildRawTextPayload($payload);
      if($rawTextPayload === false){
        $this->writeEvidenceLog("save-text", "request_rejected", array(
          "reason" => "raw_text_payload_invalid",
        ));
        return;
      }
      $apiDispatch = $this->dispatchRawTextPayload($rawTextPayload);

      if(!$apiDispatch["ok"]){
        $this->writeEvidenceLog("save-text", "api_error", array(
          "message" => isset($apiDispatch["message"]) ? (string)$apiDispatch["message"] : "Error desconocido",
          "statusCode" => isset($apiDispatch["statusCode"]) ? (string)$apiDispatch["statusCode"] : "",
          "idrc" => isset($apiDispatch["idrc"]) ? (string)$apiDispatch["idrc"] : "",
        ));
        $this->erroresConfEvidencesApi($apiDispatch["message"]);
        return;
      }

      $this->writeEvidenceLog("save-text", "api_success", array(
        "statusCode" => isset($apiDispatch["statusCode"]) ? (string)$apiDispatch["statusCode"] : "",
        "IDRC" => isset($apiDispatch["idrc"]) ? (string)$apiDispatch["idrc"] : "",
      ));

      $this->registros = array(
        "statusCode" => isset($apiDispatch["statusCode"]) ? (string)$apiDispatch["statusCode"] : "",
        "IDRC" => isset($apiDispatch["idrc"]) ? (string)$apiDispatch["idrc"] : "",
      );
      return;
    }
    if($payloadProperty === "photoEvidencePayload"){
      $this->writeEvidenceLog("save-photos", "request_received", array(
        "payloadProperty" => $payloadProperty,
        "photosCount" => isset($payload["photos"]) && is_array($payload["photos"]) ? count($payload["photos"]) : 0,
        "frontPayload" => $this->buildLoggableFrontPayload($payload, "save-photos"),
      ));

      $rawPhotoPayload = $this->buildRawPhotoPayload($payload);
      $apiDispatch = $this->dispatchRawPhotoPayload($rawPhotoPayload);
      if(!$apiDispatch["ok"]){
        $this->writeEvidenceLog("save-photos", "api_error", array(
          "message" => isset($apiDispatch["message"]) ? (string)$apiDispatch["message"] : "Error desconocido",
          "statusCode" => isset($apiDispatch["statusCode"]) ? (string)$apiDispatch["statusCode"] : "",
          "fieldName" => isset($apiDispatch["fieldName"]) ? (string)$apiDispatch["fieldName"] : "",
        ));
        $this->erroresConfEvidencesApi(
          $apiDispatch["message"],
          array(
            "statusCode" => isset($apiDispatch["statusCode"]) ? (string)$apiDispatch["statusCode"] : "",
            "fieldName" => isset($apiDispatch["fieldName"]) ? (string)$apiDispatch["fieldName"] : "",
            "uploadApiResponse" => isset($apiDispatch["uploadApiResponse"]) ? $apiDispatch["uploadApiResponse"] : null,
            "uploadDebug" => isset($apiDispatch["uploadDebug"]) ? $apiDispatch["uploadDebug"] : array(),
          )
        );
        return;
      }

      if(!isset($apiDispatch["uploadDebug"]) || !is_array($apiDispatch["uploadDebug"])){
        $apiDispatch["uploadDebug"] = array();
      }
      $this->writeEvidenceLog("save-photos", "api_success", array(
        "statusCode" => isset($apiDispatch["statusCode"]) ? (string)$apiDispatch["statusCode"] : "",
        "s3Name" => isset($apiDispatch["s3Name"]) ? (string)$apiDispatch["s3Name"] : "",
        "fieldName" => isset($apiDispatch["fieldName"]) ? (string)$apiDispatch["fieldName"] : "",
      ));

      $this->registros = array(
        "statusCode" => isset($apiDispatch["statusCode"]) ? (string)$apiDispatch["statusCode"] : "",
        "s3Name" => isset($apiDispatch["s3Name"]) ? (string)$apiDispatch["s3Name"] : "",
        "key" => isset($apiDispatch["key"]) ? (string)$apiDispatch["key"] : "",
        "estado" => isset($apiDispatch["estado"]) ? (string)$apiDispatch["estado"] : "",
        "fieldName" => isset($apiDispatch["fieldName"]) ? (string)$apiDispatch["fieldName"] : "",
        "uploadApiResponse" => isset($apiDispatch["uploadApiResponse"]) ? $apiDispatch["uploadApiResponse"] : null,
        "uploadDebug" => isset($apiDispatch["uploadDebug"]) && is_array($apiDispatch["uploadDebug"]) ? $apiDispatch["uploadDebug"] : array(),
      );
      return;
    }

    $this->registros = array($payload);
  }

  private function buildRawPhotoPayload($payload){
    $photos = isset($payload["photos"]) && is_array($payload["photos"]) ? $payload["photos"] : array();
    $firstPhoto = isset($photos[0]) && is_array($photos[0]) ? $photos[0] : array();

    return array(
      "formRef" => isset($payload["formRef"]) && is_array($payload["formRef"]) ? $payload["formRef"] : array(),
      "savedAt" => isset($payload["savedAt"]) ? (string)$payload["savedAt"] : "",
      "gps" => isset($payload["gps"]) && is_array($payload["gps"]) ? $payload["gps"] : null,
      "photo" => array(
        "fieldName" => isset($firstPhoto["fieldName"]) ? (string)$firstPhoto["fieldName"] : "",
        "fieldType" => isset($firstPhoto["fieldType"]) ? (string)$firstPhoto["fieldType"] : "",
        "fileName" => isset($firstPhoto["fileName"]) ? (string)$firstPhoto["fileName"] : "",
        "mimeType" => isset($firstPhoto["mimeType"]) ? (string)$firstPhoto["mimeType"] : "",
        "contentBase64" => isset($firstPhoto["contentBase64"]) ? (string)$firstPhoto["contentBase64"] : "",
      ),
    );
  }

  private function dispatchRawPhotoPayload($rawPayload){
    $fieldName = isset($rawPayload["photo"]["fieldName"]) ? (string)$rawPayload["photo"]["fieldName"] : "";
    $fileName = isset($rawPayload["photo"]["fileName"]) ? (string)$rawPayload["photo"]["fileName"] : "";
    $contentBase64 = isset($rawPayload["photo"]["contentBase64"]) ? (string)$rawPayload["photo"]["contentBase64"] : "";

    if(trim($fileName) === ""){
      return array(
        "ok" => false,
        "message" => "Nombre de archivo invalido para envio de foto",
      );
    }

    if(trim($contentBase64) === ""){
      return array(
        "ok" => false,
        "message" => "Contenido base64 vacio para envio de foto",
      );
    }

    if(!function_exists("curl_init")){
      return array(
        "ok" => false,
        "message" => "cURL no disponible en servidor",
      );
    }

    $uploadFileName = $this->buildPhotoUploadFileName();
    $tmpFileData = $this->createTempFileFromBase64($contentBase64, $uploadFileName);
    $tmpFilePath = isset($tmpFileData["path"]) ? (string)$tmpFileData["path"] : "";
    $tmpFileSize = isset($tmpFileData["size"]) ? (int)$tmpFileData["size"] : 0;
    if($tmpFilePath === ""){
      return array(
        "ok" => false,
        "message" => "No fue posible preparar archivo temporal para envio",
      );
    }
    if($tmpFileSize <= 0){
      $this->deleteTempFileIfExists($tmpFilePath);
      return array(
        "ok" => false,
        "message" => "Archivo de foto invalido: tamano cero bytes",
      );
    }

    $safeMimeType = "image/jpeg";
    $safeUploadFileName = trim($uploadFileName) !== "" ? $uploadFileName : "s3.9".date("y")."F0i.jpg";
    $tags = "version=1&fecha=".date("d-m-Y");
    $uploadDebug = array();

    $curl = curl_init();
    curl_setopt_array($curl, array(
      CURLOPT_URL => self::PHOTO_EVIDENCE_API_URL,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 60,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "POST",
      CURLOPT_POSTFIELDS => array(
        "archivo" => new CURLFILE($tmpFilePath, $safeMimeType, basename($safeUploadFileName)),
        "bucket" => self::PHOTO_EVIDENCE_BUCKET,
        "tags" => $tags,
      ),
    ));

    $response = curl_exec($curl);
    $httpCode = (string)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlErrno = (int)curl_errno($curl);
    $curlError = curl_error($curl);
    curl_close($curl);
    $this->deleteTempFileIfExists($tmpFilePath);

    $uploadDebug = array(
      "endpoint" => self::PHOTO_EVIDENCE_API_URL,
      "bucket" => self::PHOTO_EVIDENCE_BUCKET,
      "tags" => $tags,
      "httpCode" => $httpCode,
      "curlErrno" => $curlErrno,
      "curlError" => $curlError,
      "rawResponsePreview" => substr((string)$response, 0, 1500),
      "parsedResponse" => null,
    );

    if($response === false){
      return array(
        "ok" => false,
        "message" => "Error al invocar API de foto: ".$curlError,
        "uploadApiResponse" => null,
        "uploadDebug" => $uploadDebug,
      );
    }

    $decoded = json_decode($response, true);
    if(is_array($decoded)){
      $uploadDebug["parsedResponse"] = $decoded;
    }
    if(!is_array($decoded) && trim((string)$response) !== ""){
      $uploadDebug["parsedResponse"] = $response;
    }
    if(!is_array($decoded)){
      return array(
        "ok" => false,
        "message" => "Respuesta invalida de API de foto",
        "uploadApiResponse" => $response,
        "uploadDebug" => $uploadDebug,
      );
    }

    $statusCode = isset($decoded["statusCode"]) ? (string)$decoded["statusCode"] : "200";
    $responseBody = isset($decoded["body"]) ? $decoded["body"] : $decoded;
    if(is_string($responseBody)){
      $parsedBody = json_decode($responseBody, true);
      if(is_array($parsedBody)){
        $responseBody = $parsedBody;
      }
    }

    $estado = $this->extractUploadEstado($responseBody);
    if($estado !== "" && strtolower($estado) !== "ok"){
      return array(
        "ok" => false,
        "message" => "API de foto devolvio estado no exitoso",
        "statusCode" => $statusCode,
        "estado" => $estado,
        "fieldName" => $fieldName,
        "uploadApiResponse" => (string)$response,
        "uploadDebug" => $uploadDebug,
      );
    }

    $s3Name = $this->extractS3NameFromPhotoBody($responseBody);
    if(trim($s3Name) === ""){
      return array(
        "ok" => false,
        "message" => "API de foto no devolvio nombre S3",
        "statusCode" => $statusCode,
        "estado" => $estado,
        "fieldName" => $fieldName,
        "uploadApiResponse" => (string)$response,
        "uploadDebug" => $uploadDebug,
      );
    }

    return array(
      "ok" => true,
      "message" => "Foto registrada en API externa",
      "statusCode" => $statusCode,
      "s3Name" => $s3Name,
      "key" => $s3Name,
      "estado" => $estado !== "" ? $estado : "ok",
      "fieldName" => $fieldName,
      "uploadApiResponse" => (string)$response,
      "uploadDebug" => $uploadDebug,
    );
  }


  private function writeEvidenceLog($action, $event, $data = array()){
    $month = gmdate("Y-m");
    $day = gmdate("d");
    $clientId = (int)$this->idCliente > 0 ? (int)$this->idCliente : 0;
    $userId = (int)$this->idUsuario > 0 ? (int)$this->idUsuario : 0;
    $baseDir = rtrim(self::EVIDENCE_LOG_BASE_PATH, "\\/");
    $dir = $baseDir.DIRECTORY_SEPARATOR.$month.DIRECTORY_SEPARATOR.$day.DIRECTORY_SEPARATOR.$clientId;
    if(!is_dir($dir)){
      @mkdir($dir, 0775, true);
    }

    $filePath = $dir.DIRECTORY_SEPARATOR."user_".$userId.".log";
    $lineData = array(
      "timestamp" => gmdate("c"),
      "action" => (string)$action,
      "event" => (string)$event,
      "idUsuario" => (int)$this->idUsuario,
      "idCliente" => (int)$this->idCliente,
      "data" => is_array($data) ? $data : array("value" => $data),
    );

    $line = json_encode($lineData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if($line === false){
      @error_log("EVIDENCE_LOG: no fue posible serializar linea");
      return;
    }

    $written = @file_put_contents($filePath, $line.PHP_EOL, FILE_APPEND | LOCK_EX);
    if($written === false){
      @error_log("EVIDENCE_LOG: no fue posible escribir log local ".$filePath);
    }
  }

  private function buildLoggableFrontPayload($payload, $action){
    if(!is_array($payload)){
      return array();
    }

    if((string)$action !== "save-photos"){
      return $payload;
    }

    $loggablePayload = $payload;
    if(!isset($loggablePayload["photos"]) || !is_array($loggablePayload["photos"])){
      return $loggablePayload;
    }

    foreach($loggablePayload["photos"] as $index => $photo){
      if(!is_array($photo)){
        continue;
      }

      $contentBase64 = isset($photo["contentBase64"]) ? (string)$photo["contentBase64"] : "";
      $loggablePayload["photos"][$index]["contentBase64"] = array(
        "preview" => substr($contentBase64, 0, 200),
        "length" => strlen($contentBase64),
        "truncated" => true,
      );
    }

    return $loggablePayload;
  }

  private function createTempFileFromBase64($contentBase64, $fileName){
    $decoded = base64_decode((string)$contentBase64, true);
    if($decoded === false){
      return array("path" => "", "size" => 0);
    }

    $safeName = preg_replace('/[^a-zA-Z0-9._-]+/', '_', (string)$fileName);
    if(trim((string)$safeName) === ""){
      $safeName = "s3.9".date("y")."F0i.jpg";
    }
    if(strtolower((string)pathinfo($safeName, PATHINFO_EXTENSION)) !== "jpg"){
      $safeName = (string)pathinfo($safeName, PATHINFO_FILENAME).".jpg";
    }

    $tmpBase = function_exists("sys_get_temp_dir") ? sys_get_temp_dir() : ".";
    $tmpPath = rtrim((string)$tmpBase, "\\/").DIRECTORY_SEPARATOR."evidence_".uniqid("", true)."_".$safeName;

    // Fallback when GD is not available: keep original bytes and enforce .jpg filename/mime on upload.
    if(!function_exists("imagecreatefromstring") || !function_exists("imagejpeg")){
      $written = @file_put_contents($tmpPath, $decoded);
      if($written === false || (int)$written <= 0){
        return array("path" => "", "size" => 0);
      }
      return array("path" => $tmpPath, "size" => (int)$written);
    }

    $imageResource = @imagecreatefromstring($decoded);
    if($imageResource === false){
      // If GD cannot decode this input, fallback to raw bytes to avoid blocking upload.
      $written = @file_put_contents($tmpPath, $decoded);
      if($written === false || (int)$written <= 0){
        return array("path" => "", "size" => 0);
      }
      return array("path" => $tmpPath, "size" => (int)$written);
    }

    $saved = @imagejpeg($imageResource, $tmpPath, 90);
    @imagedestroy($imageResource);
    if($saved === false){
      return array("path" => "", "size" => 0);
    }
    $written = @filesize($tmpPath);
    if($written === false || (int)$written <= 0){
      $this->deleteTempFileIfExists($tmpPath);
      return array("path" => "", "size" => 0);
    }

    return array("path" => $tmpPath, "size" => (int)$written);
  }

  private function buildPhotoUploadFileName(){
    $timezone = new DateTimeZone("America/Guatemala");
    $now = new DateTime("now", $timezone);
    $tipo = "9";
    $anio = $now->format("y");
    $mes = $now->format("m");
    $dia = $now->format("d");
    $hora = $now->format("His");
    $idCliente = (int)$this->idCliente > 0 ? (string)((int)$this->idCliente) : "0";
    $idUsuario = (int)$this->idUsuario > 0 ? (string)((int)$this->idUsuario) : "0";
    $codEntity = isset($_SESSION["COD_ENTITY"]) ? preg_replace('/[^0-9]+/', '', (string)$_SESSION["COD_ENTITY"]) : "";
    if(trim((string)$codEntity) === ""){
      $codEntity = "0";
    }

    return "s3."
      .$tipo
      .$anio."F"
      .$idCliente."F"
      .$idUsuario."F"
      .$mes."F"
      .$dia."F"
      .$hora."F"
      .$codEntity
      ."F0i.jpg";
  }

  private function deleteTempFileIfExists($path){
    if(trim((string)$path) === ""){
      return;
    }
    if(file_exists($path)){
      @unlink($path);
    }
  }

  private function extractS3NameFromPhotoBody($body){
    if(is_string($body)){
      $trimmed = trim($body);
      if($trimmed !== ""){
        return $trimmed;
      }
      return "";
    }

    if(!is_array($body)){
      return "";
    }
    if($this->isSequentialArray($body)){
      foreach($body as $item){
        $candidate = $this->extractS3NameFromPhotoBody($item);
        if(trim($candidate) !== ""){
          return $candidate;
        }
      }
      return "";
    }

    $keys = array("s3Name", "name", "nombre", "fileName", "filename", "key", "objectKey");
    foreach($keys as $key){
      if(isset($body[$key]) && trim((string)$body[$key]) !== ""){
        return (string)$body[$key];
      }
    }
    $caseVariants = array("Key", "S3Name", "FileName", "ObjectKey");
    foreach($caseVariants as $key){
      if(isset($body[$key]) && trim((string)$body[$key]) !== ""){
        return (string)$body[$key];
      }
    }

    if(isset($body["data"]) && is_array($body["data"])){
      return $this->extractS3NameFromPhotoBody($body["data"]);
    }

    if(isset($body["result"]) && is_array($body["result"])){
      return $this->extractS3NameFromPhotoBody($body["result"]);
    }

    return "";
  }

  private function extractUploadEstado($body){
    if(is_string($body)){
      return "";
    }
    if(!is_array($body)){
      return "";
    }
    if($this->isSequentialArray($body)){
      foreach($body as $item){
        $candidate = $this->extractUploadEstado($item);
        if(trim($candidate) !== ""){
          return $candidate;
        }
      }
      return "";
    }
    if(isset($body["estado"]) && trim((string)$body["estado"]) !== ""){
      return (string)$body["estado"];
    }
    if(isset($body["Estado"]) && trim((string)$body["Estado"]) !== ""){
      return (string)$body["Estado"];
    }
    if(isset($body["status"]) && trim((string)$body["status"]) !== ""){
      return (string)$body["status"];
    }
    if(isset($body["Status"]) && trim((string)$body["Status"]) !== ""){
      return (string)$body["Status"];
    }
    if(isset($body["data"]) && is_array($body["data"])){
      return $this->extractUploadEstado($body["data"]);
    }
    if(isset($body["result"]) && is_array($body["result"])){
      return $this->extractUploadEstado($body["result"]);
    }
    return "";
  }

  private function isSequentialArray($value){
    if(!is_array($value)){
      return false;
    }
    return array_keys($value) === range(0, count($value) - 1);
  }

  private function buildLocalS3Reference($fileName){
    $baseName = preg_replace('/[^a-zA-Z0-9._-]+/', '_', (string)$fileName);
    if(trim((string)$baseName) === ""){
      $baseName = "photo";
    }
    return gmdate("Ymd_His")."_".$baseName;
  }

  private function buildRawTextPayload($payload){
    $timezone = new DateTimeZone("America/Guatemala");
    $savedAt = isset($payload["savedAt"]) ? (string)$payload["savedAt"] : "";
    $gpsCapturedAt = isset($payload["gps"]["capturedAt"]) ? (string)$payload["gps"]["capturedAt"] : "";

    $fechaInicio = $this->formatDateForLegacy($gpsCapturedAt, $timezone);
    $fechaFin = $this->formatDateForLegacy($savedAt, $timezone);
    $lat = isset($payload["gps"]["latitude"]) ? (string)$payload["gps"]["latitude"] : "";
    $lon = isset($payload["gps"]["longitude"]) ? (string)$payload["gps"]["longitude"] : "";
    $idq = isset($payload["formRef"]["clv"]) ? (string)$payload["formRef"]["clv"] : "";
    $answers = isset($payload["answers"]) && is_array($payload["answers"]) ? $payload["answers"] : array();
    $codEntity = $this->resolveCodEntityFromSession();
    if($codEntity === false){
      return false;
    }

    return array(
      "IDQ" => $idq,
      "IDU" => (string)$this->idUsuario,
      "FECHA_FIN" => $fechaFin,
      "LAT" => $lat,
      "LON" => $lon,
      "BAT" => "100",
      "FECHA_INICIO" => $fechaInicio,
      "CEN" => (string)$codEntity,
      "RESP" => json_encode($this->buildEncodedAnswers($answers), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    );
  }

  private function resolveCodEntityFromSession(){
    if(!isset($_SESSION["COD_ENTITY"])){
      $this->erroresConfEvidencesApi("No es posible enviar la informacion: COD_ENTITY no disponible en sesion");
      return false;
    }

    $codEntity = (int)$_SESSION["COD_ENTITY"];
    if($codEntity <= 0){
      $this->erroresConfEvidencesApi("No es posible enviar la informacion: COD_ENTITY invalido");
      return false;
    }

    return $codEntity;
  }

  private function buildEncodedAnswers($answers){
    $result = array();
    $groupedValuesByQuestion = array();
    $groupedQuestionOrder = array();
    $normalQuestionOrder = array();
    $normalValuesByQuestion = array();

    foreach($answers as $fieldName => $value){
      $questionId = $this->extractQuestionId($fieldName);
      if($questionId === ""){
        continue;
      }

      $sectionRows = $this->parseMixedSectionRows($value);
      if($sectionRows !== null){
        $flattened = $this->flattenMixedSectionRows($sectionRows);
        foreach($flattened as $rowQuestionId => $rowValues){
          if(!isset($groupedValuesByQuestion[$rowQuestionId])){
            $groupedValuesByQuestion[$rowQuestionId] = array();
            $groupedQuestionOrder[] = $rowQuestionId;
          }
          foreach($rowValues as $rowValue){
            $groupedValuesByQuestion[$rowQuestionId][] = $rowValue;
          }
        }
        continue;
      }

      if(!isset($normalValuesByQuestion[$questionId])){
        $normalValuesByQuestion[$questionId] = "";
        $normalQuestionOrder[] = $questionId;
      }
      $normalValuesByQuestion[$questionId] = $this->normalizeAnswerValue($value);
    }

    foreach($normalQuestionOrder as $questionId){
      if(isset($groupedValuesByQuestion[$questionId])){
        continue;
      }
      $normalizedValue = isset($normalValuesByQuestion[$questionId]) ? (string)$normalValuesByQuestion[$questionId] : "";
      $encodedValue = $normalizedValue === "" ? "" : base64_encode($normalizedValue);
      $result[] = array($questionId => $encodedValue);
    }

    foreach($groupedQuestionOrder as $questionId){
      $groupValues = isset($groupedValuesByQuestion[$questionId]) && is_array($groupedValuesByQuestion[$questionId])
        ? $groupedValuesByQuestion[$questionId]
        : array();
      $groupJson = json_encode($groupValues, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      if($groupJson === false){
        $groupJson = "[]";
      }
      $encodedValue = base64_encode($groupJson);
      $result[] = array($questionId => $encodedValue);
    }

    return $result;
  }

  private function parseMixedSectionRows($value){
    if(is_array($value)){
      if($this->isSequentialArray($value)){
        if(empty($value)){
          return array();
        }
        $first = $value[0];
        if(is_array($first) && !$this->isSequentialArray($first)){
          return $value;
        }
      }
      return null;
    }

    if(!is_string($value)){
      return null;
    }

    $trimmed = trim($value);
    if($trimmed === "" || $trimmed[0] !== "["){
      return null;
    }

    $decoded = json_decode($trimmed, true);
    if(!is_array($decoded) || !$this->isSequentialArray($decoded)){
      return null;
    }

    if(empty($decoded)){
      return array();
    }

    $first = $decoded[0];
    if(!is_array($first) || $this->isSequentialArray($first)){
      return null;
    }

    return $decoded;
  }

  private function flattenMixedSectionRows($rows){
    $result = array();
    if(!is_array($rows)){
      return $result;
    }

    foreach($rows as $row){
      if(!is_array($row)){
        continue;
      }

      foreach($row as $rowFieldName => $rowValue){
        $rowQuestionId = $this->extractQuestionId($rowFieldName);
        if($rowQuestionId === ""){
          continue;
        }
        if(!isset($result[$rowQuestionId])){
          $result[$rowQuestionId] = array();
        }
        $result[$rowQuestionId][] = $this->normalizeAnswerValue($rowValue);
      }
    }

    return $result;
  }

  private function extractQuestionId($fieldName){
    $name = (string)$fieldName;
    if(preg_match('/(\d+)/', $name, $matches) !== 1){
      return "";
    }

    return (string)$matches[1];
  }

  private function normalizeAnswerValue($value){
    if(is_array($value)){
      return implode(",", array_map(function($item){
        return (string)$item;
      }, $value));
    }

    if(is_object($value)){
      return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    if(is_bool($value)){
      return $value ? "true" : "false";
    }

    if($value === null){
      return "";
    }

    return (string)$value;
  }

  private function formatDateForLegacy($isoDate, $timezone){
    try{
      if(trim((string)$isoDate) !== ""){
        $date = new DateTime((string)$isoDate);
      } else {
        $date = new DateTime("now", new DateTimeZone("UTC"));
      }
    } catch(Exception $exception){
      $date = new DateTime("now", new DateTimeZone("UTC"));
    }

    $date->setTimezone($timezone);
    return $date->format("Y-n-j H:i:s");
  }

  private function dispatchRawTextPayload($rawPayload){
    if(!function_exists("curl_init")){
      return array(
        "ok" => false,
        "message" => "cURL no disponible en servidor",
      );
    }

    $raw = json_encode($rawPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if($raw === false){
      return array(
        "ok" => false,
        "message" => "No fue posible serializar el RAW de texto",
      );
    }

    $curl = curl_init();
    curl_setopt_array($curl, array(
      CURLOPT_URL => self::TEXT_EVIDENCE_API_URL,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => "",
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 30,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => "POST",
      CURLOPT_POSTFIELDS => $raw,
      CURLOPT_HTTPHEADER => array(
        "Content-Type: text/plain"
      ),
    ));

    $response = curl_exec($curl);
    $curlError = curl_error($curl);
    curl_close($curl);

    if($response === false){
      return array(
        "ok" => false,
        "message" => "Error al invocar API externa: ".$curlError,
      );
    }

    $decoded = json_decode($response, true);
    if(!is_array($decoded)){
      return array(
        "ok" => false,
        "message" => "Respuesta invalida de API externa",
        "rawResponsePreview" => substr((string)$response, 0, 500),
      );
    }

    $statusCode = isset($decoded["statusCode"]) ? (string)$decoded["statusCode"] : "";
    $idrc = "";
    $bodyData = isset($decoded["body"]) ? $decoded["body"] : array();
    if(is_string($bodyData)){
      $parsedBody = json_decode($bodyData, true);
      if(is_array($parsedBody)){
        $bodyData = $parsedBody;
      }
    }
    if(is_array($bodyData) && isset($bodyData["IDRC"])){
      $idrc = (string)$bodyData["IDRC"];
    }

    if($statusCode !== "200" || $idrc === ""){
      return array(
        "ok" => false,
        "message" => "API externa rechazo la evidencia",
        "statusCode" => $statusCode,
        "idrc" => $idrc,
        "rawResponse" => array(
          "statusCode" => $statusCode,
          "body" => is_array($bodyData) ? $bodyData : array("raw" => substr((string)$response, 0, 500)),
        ),
      );
    }

    return array(
      "ok" => true,
      "message" => "Evidencia registrada en API externa",
      "statusCode" => $statusCode,
      "idrc" => $idrc,
      "rawResponse" => array(
        "statusCode" => $statusCode,
        "body" => is_array($bodyData) ? $bodyData : array(),
      ),
    );
  }

  private function erroresConfEvidencesApi($mensaje, $data = array()){
    $this->registros = array(
      "Error" => $mensaje,
      "ErrorData" => is_array($data) ? $data : array(),
    );
  }
}
?>
