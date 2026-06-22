import { boolAttr, escapeHtml, renderFieldWrapper, toFieldProps } from '../field-render-context.js';

export function renderTimeField(field, contextOptions) {
  const { name, disabled, required, props } = toFieldProps(field, contextOptions);
  const defaultValue = normalizeTimeValue(props.default);

  return renderFieldWrapper(
    field,
    `<input class="uk-input uk-border-rounded inputTxtFrm" type="time" name="${escapeHtml(name)}" value="${escapeHtml(defaultValue)}"${boolAttr(disabled, 'disabled')}${boolAttr(required, 'required')}>`,
    { ...contextOptions, controlsWidthClass: 'uk-width-small@m' }
  );
}

function normalizeTimeValue(rawValue) {
  if (rawValue == null) {
    return '';
  }

  const value = String(rawValue).trim();
  if (!value) {
    return '';
  }

  const hourMinuteMatch = value.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (hourMinuteMatch) {
    return `${hourMinuteMatch[1]}:${hourMinuteMatch[2]}`;
  }

  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) {
    return '';
  }

  const hours = String(asDate.getHours()).padStart(2, '0');
  const minutes = String(asDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
