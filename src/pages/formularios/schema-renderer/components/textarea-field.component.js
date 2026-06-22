import { boolAttr, escapeHtml, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

export function renderTextareaField(field, contextOptions) {
  const { name, disabled, required, props } = toFieldProps(field, contextOptions);
  const defaultValue = props.default ?? '';
  const maxLength = Number.isFinite(Number(props.maxLength)) ? Number(props.maxLength) : null;

  return renderFieldWrapper(
    field,
    `<textarea class="uk-textarea uk-border-rounded inputTxtFrm" name="${escapeHtml(name)}" placeholder="Escribe tu respuesta"${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}${maxLength ? ` maxlength="${maxLength}"` : ''}>${escapeHtml(defaultValue)}</textarea>`,
    contextOptions
  );
}
