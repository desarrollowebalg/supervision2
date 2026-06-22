import { boolAttr, escapeHtml, normalizeOptions, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

function buildDatalistId(name) {
  const base = String(name || 'autocomplete').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `list_${base}`;
}

export function renderAutocompleteField(field, contextOptions) {
  const { name, disabled, required, props } = toFieldProps(field, contextOptions);
  const options = normalizeOptions(field);
  const defaultValue = props.default ?? '';
  const listId = buildDatalistId(name);

  const datalistHtml = options
    .map((option) => `<option value="${escapeHtml(option?.value ?? '')}">${escapeHtml(option?.label ?? option?.value ?? '')}</option>`)
    .join('');

  return renderFieldWrapper(
    field,
    `
      <input class="uk-input uk-border-rounded inputTxtFrm" type="text" name="${escapeHtml(name)}" value="${escapeHtml(defaultValue)}" list="${escapeHtml(listId)}" placeholder="Escribe tu respuesta"${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>
      <datalist id="${escapeHtml(listId)}">${datalistHtml}</datalist>
    `,
    contextOptions
  );
}
