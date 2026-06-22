<?php

class FieldDefinitionRegistry {

    /** @var array<int, FieldDefinitionInterface> */
    private $map = [];

    public function __construct() {

        $this->map = [
            1 => new NumberFieldDefinition(),
            2 => new TextFieldDefinition(),
            3 => new YesNoFieldDefinition(),
            4 => new DateFieldDefinition(),
            5 => new TimeFieldDefinition(),
            6 => new SelectFieldDefinition(),
            7 => new MultiSelectFieldDefinition(),
            8  => new TextareaFieldDefinition(),
            9  => new PhotoFieldDefinition(),
            13 => new SignatureFieldDefinition(),
            14 => new SeparatorFieldDefinition(),
            16 => new RadioFieldDefinition(),
            17 => new TextareaFieldDefinition(),
            18 => new GeoSelectFieldDefinition(),
            22 => new AutocompleteFieldDefinition(),
            26 => new GalleryFieldDefinition(),
            37 => new IndexFieldDefinition(),
            45 => new EndTableFieldDefinition(),
        ];
    }

    public function get(int $type): ?FieldDefinitionInterface {
        return $this->map[$type] ?? null;
    }
}
