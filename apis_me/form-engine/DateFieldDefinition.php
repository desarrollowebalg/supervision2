<?php

class DateFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {

        return [
            "type" => "date",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => $field['required'],
                "disabled" => !$field['editable'],
                "default" => date("Y-m-d")
            ]
        ];
    }
}