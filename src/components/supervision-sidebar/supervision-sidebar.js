import { renderSupervisionAccordionItem } from './supervision-accordion-item.js';
import { renderSupervisionQueryPanel } from './supervision-query-panel.js';

function renderPanels(panels) {
  return (panels || [])
    .filter((panel) => panel?.enabled)
    .map((panel) => renderSupervisionAccordionItem(panel))
    .join('');
}

export function renderSupervisionSidebar(config) {
  const multipleOpen = config?.accordion?.multipleOpen ? 'true' : 'false';

  return `
    <ul class="uk-accordion" uk-accordion="multiple: ${multipleOpen}">
      ${renderSupervisionQueryPanel(config?.queryPanel)}
      ${renderPanels(config?.panels)}
    </ul>
  `;
}
