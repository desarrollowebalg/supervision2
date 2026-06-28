function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function renderSupervisionQueryPanel(queryPanel) {
  if (!queryPanel?.enabled) {
    return '';
  }

  const helperText = escapeHtml(queryPanel.summary?.helperText);
  const label = escapeHtml(queryPanel.label);
  const icon = escapeHtml(queryPanel.icon);
  const openClass = queryPanel.accordion?.initialOpen ? 'uk-open ' : '';
  const minAttr = queryPanel.controls?.date?.min ? ` min="${escapeHtml(queryPanel.controls.date.min)}"` : '';
  const maxAttr = queryPanel.controls?.date?.max ? ` max="${escapeHtml(queryPanel.controls.date.max)}"` : '';
  const requiredAttr = queryPanel.controls?.date?.required ? ' required' : '';

  return `
    <li class="${openClass}supervision2-card supervision2-card--tools">
      <a class="uk-accordion-title supervision2-card__title" href="#">
        <span uk-icon="${icon}"></span>
        <span>${label}</span>
        <span id="loaderGralSupNiveles"></span>
      </a>
      <div class="uk-accordion-content uk-margin-small-top">
        <div class="uk-alert-primary uk-border-rounded supervision2-tools-box" uk-alert>
          <label class="uk-form-label uk-hidden" for="datePickerMapHot">Selecciona una fecha</label>
          <div class="uk-grid-small uk-flex-middle" uk-grid>
            <div class="uk-width-auto@s">
              <input id="datePickerMapHot" class="uk-input uk-form-width-small uk-border-rounded" type="date"${minAttr}${maxAttr}${requiredAttr}>
            </div>
            <div class="uk-width-expand@s">
              <span id="heatmapTitle" class="uk-hidden supervision2-week-title">Sem -- Año --</span>
              <span id="weekInfo" class="uk-text-meta">${helperText}</span>
            </div>
          </div>
        </div>
        <span id="msgContentsPanels"></span>
        <section class="uk-margin-small-top uk-margin-small-bottom uk-hidden">
          <input type="hidden" id="idSupervisorSeleccionado" value="0">
          <div id="contenedorSupervisioresSup_v0" class="uk-margin-small-top uk-margin-small-bottom">
            <div id="user-list-supervisores" class="supervision2-users-container"></div>
          </div>
        </section>
      </div>
    </li>
  `;
}
