<?php

class FormNormalizer {

    public function normalize(array $apiResponse): array {

        $fields = [];

        foreach ($apiResponse['pregs'] as $item) {

            if ($item['ACTIVO'] !== "1") continue;

            $fields[] = [
                "id" => (int)$item['ID_PREGUNTA'],
                "type" => (int)$item['ID_TIPO'],
                "label" => $item['DESCRIPCION'],
                "required" => $this->toBool($item['REQUERIDO']),
                "editable" => $this->toEditable($item['EDITABLE']),
                "options" => [],
                "meta" => [
                    "orden" => (int)$item['ORDEN'],
                    "payload" => $item['PAYLOAD'] === "1",
                    "tipo_label" => $item['TIPO']
                ],
                "group" => null,
                "complement" => $this->parseComplement($item['COMPLEMENTO'], (int)$item['ID_TIPO'])
            ];
        }

        return $fields;
    }

    private function toBool(string $value): bool {
        return $value === "1";
    }

    private function toEditable(string $value): bool {
        return $value === "S";
    }

    private function parseComplement(string $value, int $fieldType) {
        if (in_array($fieldType, [37, 45], true)) {
            return "";
        }

        if ($value === "") return null;

        // Tipos de opciones: conservar texto con comas para parseo en definition.
        if (in_array($fieldType, [3, 6, 7, 16], true)) {
            return $value;
        }

        // Tipo numerico: conservar literal (ej. "3.2").
        if ($fieldType === 1) {
            return $value;
        }

        if (preg_match('/^\d+$/', $value)) {
            return (int)$value;
        }

        return $value;
    }
}
