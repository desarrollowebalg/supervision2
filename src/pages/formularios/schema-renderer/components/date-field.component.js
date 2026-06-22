import { boolAttr, escapeHtml, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

export function renderDateField(field, contextOptions) {
  const { name, disabled, required, props } = toFieldProps(field, contextOptions);
  const defaultValue = props.default ?? '';

  return renderFieldWrapper(
    field,
    `<input class="uk-input uk-border-rounded inputTxtFrm" type="date" name="${escapeHtml(name)}" value="${escapeHtml(defaultValue)}"${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>`,
    { ...contextOptions, controlsWidthClass: 'uk-width-small@m' }
  );
}
