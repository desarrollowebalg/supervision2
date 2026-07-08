import { getPanelDomBindings } from './supervision-sidebar.dom.js';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderIndicator(panel) {
  const color = escapeHtml(panel.indicatorColor);
  return `<span class="supervision2-level-indicator" aria-hidden="true" style="--supervision2-indicator-color: ${color};"></span>`;
}

function renderCountBadge(bindings) {
  if (!bindings.countBadgeId) {
    return '';
  }

  return `<span class="uk-badge uk-margin-small-left uk-hidden" id="${bindings.countBadgeId}">0</span>`;
}

export function buildSupervisionPanelTitle(panel) {
  const labelParts = [panel?.label, panel?.meta?.subtitle, panel?.meta?.slaLabel].filter(Boolean);
  return labelParts.join(' → ');
}

export function renderSupervisionAccordionItem(panel) {
  if (!panel?.enabled) {
    return '';
  }

  const bindings = getPanelDomBindings(panel.id);
  const openClass = panel.initialOpen ? 'uk-open ' : '';
  const title = escapeHtml(buildSupervisionPanelTitle(panel));

  return `
    <li class="${openClass}supervision2-card supervision2-card--${escapeHtml(panel.id)}">
      <a class="uk-accordion-title supervision2-card__title" href="#">
        ${renderIndicator(panel)}
        <span class="uk-text-truncate" title="${title}" uk-tooltip>${title}</span>
        ${renderCountBadge(bindings)}
      </a>
      <div class="uk-accordion-content uk-margin-small-top">
        <span class="uk-badge supervision2-pending-badge supervision2-pending-badge--inactive">
          Pendientes:
          <span id="${bindings.pendingId}" class="supervision2-pending-total">0</span>
        </span>
        <div id="${bindings.listId}" class="supervision2-users-container"></div>
      </div>
    </li>
  `;
}
