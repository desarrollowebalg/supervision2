import { boolAttr, escapeHtml, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

export function renderIndexMarkerField(field, contextOptions = {}) {
  const effectiveOptions = {
    ...contextOptions,
    readOnlyMode: false,
    respectFieldDisabled: false
  };
  const { name, disabled, required, props } = toFieldProps(field, effectiveOptions);
  const defaultValue = props?.default ?? '';

  return renderFieldWrapper(
    field,
    `<input class="uk-input uk-border-rounded inputTxtFrm" type="text" name="${escapeHtml(name)}" value="${escapeHtml(defaultValue)}" placeholder="Escribe tu respuesta"${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>`,
    effectiveOptions
  );
}
