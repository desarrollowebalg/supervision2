<?php

class SeparatorFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {
        return [
            "type" => "separator",
            "label" => $field['label']
        ];
    }
}