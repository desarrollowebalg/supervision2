<?php

class IndexFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {
        return [
            "type" => "index-marker",
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
