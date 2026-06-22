import { boolAttr, escapeHtml, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

export function renderTextField(field, contextOptions) {
  const { name, disabled, required, props } = toFieldProps(field, contextOptions);
  const defaultValue = props.default ?? '';

  return renderFieldWrapper(
    field,
    `<input class="uk-input uk-border-rounded inputTxtFrm" type="text" name="${escapeHtml(name)}" value="${escapeHtml(defaultValue)}" placeholder="Escribe tu respuesta"${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>`,
    contextOptions
  );
}
