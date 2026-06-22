import { boolAttr, escapeHtml, normalizeOptions, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

export function renderSelectField(field, contextOptions) {
  const { name, disabled, required, props } = toFieldProps(field, contextOptions);
  const options = normalizeOptions(field);
  const defaultValue = props.default ?? '';

  const optionsHtml = options
    .map((option) => {
      const value = String(option?.value ?? '');
      const selected = value === String(defaultValue) ? ' selected' : '';
      return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(option?.label ?? value)}</option>`;
    })
    .join('');

  return renderFieldWrapper(
    field,
    `<select class="uk-select uk-border-rounded inputTxtFrm" name="${escapeHtml(name)}"${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>${optionsHtml}</select>`,
    contextOptions
  );
}
