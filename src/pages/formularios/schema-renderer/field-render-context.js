export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function boolAttr(enabled, attrName) {
  return enabled ? ` ${attrName}` : '';
}

export function toFieldProps(field, options = {}) {
  const props = field?.props || {};
  const readOnlyMode = options.readOnlyMode !== false;
  const respectFieldDisabled = options.respectFieldDisabled !== false;
  const required = Boolean(props.required);
  const disabled = (respectFieldDisabled && Boolean(props.disabled)) || readOnlyMode;
  const name = String(field?.name || '');
  const label = String(field?.label || '');

  return {
    name,
    label,
    required,
    disabled,
    props
  };
}

export function renderFieldWrapper(field, innerHtml, options = {}) {
  const { label, required } = toFieldProps(field, options);

  if (field?.type === 'separator') {
    return innerHtml;
  }

  const questionNumber = Number.isFinite(options?.questionNumber) ? options.questionNumber : null;

  const controlsWidthClass = String(options?.controlsWidthClass || 'uk-width-large@m');

  return `
    <div class="uk-margin-medium">
      <label class="uk-form-label schema-question-label">
        ${questionNumber !== null ? `<span class="schema-question-number">${questionNumber}.</span>` : ''}
        <span class="schema-question-text">${escapeHtml(label)}</span>
        ${required
          ? '<span class="uk-text-danger schema-question-required">*</span>'
          : '<span class="schema-question-optional">opcional</span>'}
      </label>
      <div class="uk-form-controls uk-width-1-1 ${controlsWidthClass}">
        ${innerHtml}
      </div>
    </div>
  `;
}

export function normalizeOptions(field) {
  const raw = field?.props?.options;
  return Array.isArray(raw) ? raw : [];
}
