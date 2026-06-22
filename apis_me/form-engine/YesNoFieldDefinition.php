<?php

class YesNoFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {

        return [
            "type" => "radio",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => $field['required'],
                "disabled" => !$field['editable'],
                "options" => [
                    ["label" => "Sí", "value" => "SI"],
                    ["label" => "No", "value" => "NO"]
                ]
            ]
        ];
    }
}