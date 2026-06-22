<?php

class AutocompleteFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {

        $options = $this->parseOptions($field['complement']);

        return [
            "type" => "autocomplete",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => $field['required'],
                "disabled" => !$field['editable'],
                "options" => $options
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
