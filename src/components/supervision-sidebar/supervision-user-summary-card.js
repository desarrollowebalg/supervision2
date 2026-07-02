function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildInitials(name) {
  const normalized = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return normalized || '?';
}

export function renderSupervisionUserSummaryCard(userSummary) {
  const userId = Number(userSummary?.ID_USUARIO ?? 0);
  const userName = escapeHtml(userSummary?.USUARIO || 'Sin nombre');
  const pending = Number(userSummary?.NO_LEIDOS ?? 0);
  const unread = Number(userSummary?.NO_LEIDOS ?? 0);
  const read = Number(userSummary?.LEIDOS ?? 0);
  const panelId = escapeHtml(userSummary?.PANEL_ID || '');
  const detailSlot = escapeHtml(userSummary?.DETAIL_SLOT || '');
  const photoUrl = String(userSummary?.URL_FOTO_PERFIL || '').trim();
  const initials = escapeHtml(buildInitials(userSummary?.USUARIO));
  const photoMarkup = photoUrl
    ? `<img class="supervision2-user-summary__photo" src="${escapeHtml(photoUrl)}" alt="${userName}" loading="lazy">`
    : `<span class="supervision2-user-summary__photo-fallback" aria-hidden="true">${initials}</span>`;

  return `
    <button
      type="button"
      class="supervision2-user-summary uk-button uk-button-default uk-text-left"
      data-supervision-user-id="${userId}"
      data-supervision-user-name="${userName}"
      data-supervision-panel-id="${panelId}"
      data-supervision-detail-slot="${detailSlot}"
    >
      <span class="supervision2-user-summary__avatar">
        ${photoMarkup}
      </span>
      <span class="supervision2-user-summary__body">
        <span class="supervision2-user-summary__name uk-text-small">${userName}</span>
        <span class="supervision2-user-summary__meta uk-text-meta">
          ${pending} pendientes - (${unread} no leidos, ${read} leidos)
        </span>
      </span>
    </button>
  `;
}
