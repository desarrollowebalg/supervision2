<?php

class SelectFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {

        return [
            "type" => "select",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => $field['required'],
                "disabled" => !$field['editable'],
                "options" => $this->parseOptions($field['complement'])
            ]
        ];
    }

    private function parseOptions($complement): array {
        if (!$complement) return [];

        $values = is_array($complement) ? $complement : explode(",", (string)$complement);
        return array_map(function ($v) {
            return [
                "label" => trim($v),
                "value" => trim($v)
            ];
        }, $values);
    }
}
