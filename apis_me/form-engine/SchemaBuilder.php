<?php

class SchemaBuilder {

    /** @var FieldDefinitionRegistry */
    private $registry;

    public function __construct(FieldDefinitionRegistry $registry) {
        $this->registry = $registry;
    }

    public function build(array $fields, int $formType = 0): array {

        usort($fields, function ($a, $b) {
            return $a['meta']['orden'] <=> $b['meta']['orden'];
        });

        $result = [];
        $unsupported = [];

        foreach ($fields as $field) {
            $definition = $this->registry->get($field['type']);
            if ($definition === null) {
                $unsupported[] = [
                    "type" => $field['type'],
                    "id" => $field['id'] ?? null,
                    "label" => $field['label'] ?? null,
                    "orden" => $field['meta']['orden'] ?? null
                ];
                continue;
            }
            $result[] = $definition->mapToSchema($field);
        }

        $form = [
            "fields" => $result
        ];

        if ($formType === 7) {
            $form["renderMode"] = "table-sections";
            $form["sections"] = $this->buildTableSections($result);
        }

        return [
            "form" => $form,
            "unsupported" => $unsupported
        ];
    }

    private function buildTableSections(array $fields): array {
        $sections = [];
        $activeSection = null;

        foreach ($fields as $field) {
            $type = (string)($field['type'] ?? '');
            if ($type === 'index-marker') {
                $activeSection = [
                    "label" => (string)($field['label'] ?? ''),
                    "fields" => []
                ];
                continue;
            }

            if ($type === 'table-end-marker') {
                if ($activeSection !== null) {
                    $sections[] = $activeSection;
                    $activeSection = null;
                }
                continue;
            }

            if ($activeSection !== null) {
                $activeSection["fields"][] = $field;
            }
        }

        if ($activeSection !== null) {
            $sections[] = $activeSection;
        }

        return $sections;
    }
}
