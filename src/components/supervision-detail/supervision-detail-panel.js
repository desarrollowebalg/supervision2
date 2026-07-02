function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
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

  function showSelection({ userId, userName, selectedDate }) {
    clearLoader();

    const dateMarkup = selectedDate
      ? `<p class="uk-margin-small-top uk-margin-remove-bottom uk-text-meta">Fecha: ${escapeHtml(selectedDate)}</p>`
      : '';

    renderContent(`
      <div class="uk-alert-primary uk-border-rounded" uk-alert>
        <strong>${escapeHtml(userName)}</strong> (${Number(userId || 0)})
        ${dateMarkup}
      </div>
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
