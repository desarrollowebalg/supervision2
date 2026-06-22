<?php

interface FieldDefinitionInterface {

    /**
     * Transforma un campo normalizado en una estructura de schema
     * que será consumida por el frontend (PWA renderer).
     *
     * @param array $field Campo en formato normalizado
     * @return array Estructura del campo en el schema final
     */
    public function mapToSchema(array $field): array;
}