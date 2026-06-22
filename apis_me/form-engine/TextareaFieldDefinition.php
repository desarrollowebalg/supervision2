<?php

class TextareaFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {

        return [
            "type" => "textarea",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => $field['required'],
                "disabled" => !$field['editable'],
                "maxLength" => $field['complement'] ?? null
            ]
        ];
    }
}