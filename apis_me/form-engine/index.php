<?php

require_once dirname(__FILE__) . '/../shared/session_guard.php';
requireSessionContext(['ID_USUARIO']);

require_once "FormNormalizer.php";
require_once "SchemaBuilder.php";
require_once "FieldDefinitionRegistry.php";
require_once "FieldDefinitionInterface.php";
require_once "TextareaFieldDefinition.php";
require_once "SeparatorFieldDefinition.php";
require_once "PhotoFieldDefinition.php";
require_once "GeoSelectFieldDefinition.php";
require_once "TextFieldDefinition.php";
require_once "SignatureFieldDefinition.php";
require_once "GalleryFieldDefinition.php";
require_once "AutocompleteFieldDefinition.php";
require_once "RadioFieldDefinition.php";
require_once "YesNoFieldDefinition.php";
require_once "DateFieldDefinition.php";
require_once "TimeFieldDefinition.php";
require_once "NumberFieldDefinition.php";
require_once "SelectFieldDefinition.php";
require_once "MultiSelectFieldDefinition.php";
require_once "IndexFieldDefinition.php";
require_once "EndTableFieldDefinition.php";
require_once "RadioFieldDefinition.php";
require_once "YesNoFieldDefinition.php";
require_once "AutocompleteFieldDefinition.php";
require_once dirname(__FILE__) . "/../vistaPreviaQST/apiVistaPrevia.class.php";

header('Content-Type: application/json');

$idFormulario = getFormId();
if ($idFormulario === null || $idFormulario === '') {
    http_response_code(400);
    echo json_encode(["error" => "Falta idformulario"]);
    exit;
}

$transportError = null;
$data = fetchPreviewForm((string)$idFormulario, $transportError);
if (!is_array($data) || !isset($data['pregs']) || !is_array($data['pregs'])) {
    http_response_code(502);
    $detail = null;
    if (is_array($data) && isset($data['Error'])) {
        $detail = $data['Error'];
    }
    echo json_encode([
        "error" => "Respuesta invalida de vistaPreviaQST",
        "detail" => $detail,
        "transport_error" => $transportError
    ]);
    exit;
}

$normalizer = new FormNormalizer();
$normalized = $normalizer->normalize($data);
$formType = extractFormType($data);

$builder = new SchemaBuilder(new FieldDefinitionRegistry());
$schema = $builder->build($normalized, $formType);

echo json_encode($schema);

function getFormId() {
    if (isset($_GET['idformulario'])) {
        return trim((string)$_GET['idformulario']);
    }
    if (isset($_GET['idform'])) {
        return trim((string)$_GET['idform']);
    }
    if (!empty($_SERVER['PATH_INFO'])) {
        $parts = array_values(array_filter(explode('/', (string)$_SERVER['PATH_INFO'])));
        if (!empty($parts)) {
            return trim((string)$parts[0]);
        }
    }
    return null;
}

function fetchPreviewForm(string $idFormulario, ?string &$transportError = null): ?array {
    $databaseConfigPath = dirname(__FILE__) . "/../../config/database.php";
    if (!file_exists($databaseConfigPath)) {
        $transportError = "No existe config/database.php";
        return null;
    }

    include $databaseConfigPath;
    if (!isset($config_bd) || !is_array($config_bd)) {
        $transportError = "Configuracion de base de datos invalida";
        return null;
    }

    $apiForm = new apiPreviewForms(
        $config_bd["host"],
        $config_bd["user"],
        $config_bd["pass"],
        $config_bd["bname"],
        $config_bd["port"]
    );

    $apiForm->getInfoForm($idFormulario);
    $info = $apiForm->__get("registros");
    if (!is_array($info)) {
        $transportError = "getInfoForm no devolvio array";
        return null;
    }
    if (array_key_exists("Error", $info)) {
        $transportError = "getInfoForm error: " . $info["Error"];
        return $info;
    }

    $apiForm->getQuestionsForm($idFormulario);
    $pregs = $apiForm->__get("registros");
    if (!is_array($pregs)) {
        $transportError = "getQuestionsForm no devolvio array";
        return null;
    }
    if (array_key_exists("Error", $pregs)) {
        $transportError = "getQuestionsForm error: " . $pregs["Error"];
        return $pregs;
    }

    return [
        "info" => $info,
        "pregs" => $pregs
    ];
}

function extractFormType(array $data): int {
    $info = $data['info'] ?? null;
    if (!is_array($info) || empty($info[0]) || !is_array($info[0])) {
        return 0;
    }

    return (int)($info[0]['ID_TIPO'] ?? 0);
}
