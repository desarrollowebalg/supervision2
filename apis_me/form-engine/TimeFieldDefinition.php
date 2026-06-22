<?php

class TimeFieldDefinition implements FieldDefinitionInterface {

    public function mapToSchema(array $field): array {
        $nowInMexicoCity = new DateTimeImmutable('now', new DateTimeZone('America/Mexico_City'));

        return [
            "type" => "time",
            "name" => "field_" . $field['id'],
            "label" => $field['label'],
            "props" => [
                "required" => $field['required'],
                "disabled" => !$field['editable'],
                "default" => $nowInMexicoCity->format('H:i')
            ]
        ];
    }
}
