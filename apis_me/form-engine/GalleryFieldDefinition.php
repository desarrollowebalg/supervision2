<?php

class GalleryFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {

        return [
            "type" => "gallery",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => $field['required']
            ]
        ];
    }
}