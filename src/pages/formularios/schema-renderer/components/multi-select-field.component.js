import { boolAttr, escapeHtml, normalizeOptions, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

export function renderMultiSelectField(field, contextOptions) {
  const { name, disabled, required, props } = toFieldProps(field, contextOptions);
  const options = normalizeOptions(field);
  const defaultList = Array.isArray(props.default) ? props.default.map((item) => String(item)) : [];

  const optionsHtml = options
    .map((option) => {
      const value = String(option?.value ?? '');
      const selected = defaultList.includes(value) ? ' selected' : '';
      return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(option?.label ?? value)}</option>`;
    })
    .join('');

  return renderFieldWrapper(
    field,
    `<select class="uk-select uk-border-rounded inputTxtFrm" name="${escapeHtml(name)}" multiple${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>${optionsHtml}</select>`,
    contextOptions
  );
}
