import { boolAttr, escapeHtml, normalizeOptions, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

export function renderRadioField(field, contextOptions) {
  const { name, disabled, required, props } = toFieldProps(field, contextOptions);
  const options = normalizeOptions(field);
  const defaultValue = String(props.default ?? '');

  const radiosHtml = options
    .map((option, index) => {
      const value = String(option?.value ?? '');
      const checked = value === defaultValue ? ' checked' : '';
      return `
        <label class="uk-display-block uk-margin-small-bottom">
          <input class="uk-radio" type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}"${checked}${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>
          <span class="uk-margin-small-left">${escapeHtml(option?.label ?? `Opcion ${index + 1}`)}</span>
        </label>
      `;
    })
    .join('');

  return renderFieldWrapper(field, radiosHtml, contextOptions);
}
