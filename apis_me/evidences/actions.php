<?php
return array(
  "module" => "evidences",
  "session_context" => array(
    array(
      "session_key" => "ID_CLIENTE",
      "property" => "idCliente",
      "type" => "int",
      "required" => true,
    ),
    array(
      "session_key" => "ID_USUARIO",
      "property" => "idUsuario",
      "type" => "int",
      "required" => true,
    ),
  ),
  "actions" => array(
    "save-text" => array(
      "label" => "Recibir evidencia con respuestas de texto",
      "required_fields" => array("formRef", "savedAt", "gps", "answers"),
      "response_message" => "Evidencia de texto recibida",
      "execution" => array(
        "type" => "capture_json",
        "payload_property" => "textEvidencePayload",
      ),
    ),
    "save-photos" => array(
      "label" => "Recibir evidencia con fotografias",
      "required_fields" => array("formRef", "savedAt", "gps", "photos"),
      "response_message" => "Evidencia de fotografias recibida",
      "execution" => array(
        "type" => "capture_json",
        "payload_property" => "photoEvidencePayload",
      ),
    ),
  ),
);
