<?php

class RadioFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {

        return [
            "type" => "radio",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => $field['required'],
                "disabled" => !$field['editable'],
                "options" => $this->parseOptions($field['complement'])
            ]
        ];
    }

    private function parseOptions($c): array {
        if (!$c) return [];
        $values = is_array($c) ? $c : explode(",", (string)$c);
        return array_map(function ($v) {
            return ["label" => trim($v), "value" => trim($v)];
        }, $values);
    }
}
