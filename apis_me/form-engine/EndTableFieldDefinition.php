<?php

class EndTableFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {
        return [
            "type" => "table-end-marker",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => false,
                "disabled" => true,
                "complement" => ""
            ]
        ];
    }
}
