function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderUserPhoto({ userName, photoUrl }) {
  return `
    <user-avatar-enhanced
      url="${escapeHtml(photoUrl)}"
      nombre="${escapeHtml(userName)}"
      size="84px"
      shape="circle"
    ></user-avatar-enhanced>
  `;
}

function formatSelectionDate(rawValue) {
  const safeValue = String(rawValue || '').trim();
  const match = safeValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return escapeHtml(safeValue);
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year.slice(-2)}`;
}

export function renderSupervisionDetailPanel() {
  return `
    <div class="supervision2-detail-panel">
      <span id="loaderDetalleIncidencias"></span>
      <section id="panelDerechoListIncidencias"></section>
    </div>
  `;
}

export function createSupervisionDetailPanel({ container }) {
  let contentElement = null;
  let loaderElement = null;

  function renderContent(html) {
    if (contentElement) {
      contentElement.innerHTML = html;
    }
  }

  function clearLoader() {
    if (loaderElement) {
      loaderElement.innerHTML = '';
    }
  }

  function showEmptyState() {
    clearLoader();
    renderContent(`
      <p class="supervision2-empty-detail">
        Da clic en un usuario con incidencias para mostrar el detalle de las mismas.
      </p>
    `);
  }

  function showLoading() {
    if (loaderElement) {
      loaderElement.innerHTML = '<span uk-spinner="ratio: 0.9"></span>';
    }
  }

  function showSelection({
    userId,
    userName,
    selectedDate,
    panelTitle = '',
    photoUrl = ''
  }) {
    clearLoader();

    const dateMarkup = selectedDate
      ? `<p class="uk-margin-small-top uk-margin-remove-bottom uk-text-meta">Fecha: ${formatSelectionDate(selectedDate)}</p>`
      : '';
    const originMarkup = panelTitle
      ? `
        <div class="uk-alert-muted uk-border-rounded uk-margin-small-bottom supervision2-detail-origin">
          <span class="supervision2-level-indicator supervision2-level-indicator--detail" aria-hidden="true"></span>
          <strong class="uk-text-small">Origen:</strong>
          <span class="uk-text-small">${escapeHtml(panelTitle)}</span>
        </div>
      `
      : '';

    renderContent(`
      ${originMarkup}
      <section class="uk-card uk-card-default uk-card-body supervision2-detail-user-card">
        <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
          <div class="uk-width-auto">
            ${renderUserPhoto({ userName, photoUrl })}
          </div>
          <div class="uk-width-expand">
            <h2 class="uk-card-title uk-margin-remove-bottom supervision2-detail-user-card__title">
              ${escapeHtml(userName)}
            </h2>
            ${dateMarkup}
          </div>
        </div>
      </section>
    `);
  }

  function init() {
    contentElement = container?.querySelector('#panelDerechoListIncidencias') || null;
    loaderElement = container?.querySelector('#loaderDetalleIncidencias') || null;
    showEmptyState();
    return api;
  }

  function destroy() {
    clearLoader();
    contentElement = null;
    loaderElement = null;
  }

  const api = {
    init,
    showEmptyState,
    showLoading,
    showSelection,
    destroy
  };

  return api;
}
