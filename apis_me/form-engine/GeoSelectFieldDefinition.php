<?php

class GeoSelectFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {

        return [
            "type" => "geo-select",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => $field['required'],
                "disabled" => !$field['editable'],

                // Fuente dinámica
                "dataSource" => [
                    "type" => "api",
                    "endpoint" => "/api/geo/lugares"
                ],

                // Fallback si no hay datos
                "fallbackOptions" => [
                    [
                        "label" => "Crear lugar",
                        "value" => "CREATE"
                    ],
                    [
                        "label" => "No crear lugar",
                        "value" => "SKIP"
                    ]
                ]
            ]
        ];
    }
}