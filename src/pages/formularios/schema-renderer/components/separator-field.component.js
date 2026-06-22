import { escapeHtml, toFieldProps } from '../field-render-context.js';

export function renderSeparatorField(field) {
  const { label } = toFieldProps(field);

  return `
    <div class="uk-margin uk-margin-medium-top uk-margin-medium-bottom">
      <h3 class="uk-heading-bullet">${escapeHtml(label || '')}</h3>
    </div>
  `;
}
