const PANEL_DOM_BINDINGS = {
  '4': {
    listId: 'user-list-4',
    pendingId: 'pendientes-user-list-4',
    countBadgeId: 'user-count-4'
  },
  critical: {
    listId: 'user-list-4',
    pendingId: 'pendientes-user-list-4',
    countBadgeId: 'user-count-4'
  },
  '3': {
    listId: 'user-list-3',
    pendingId: 'pendientes-user-list-3',
    countBadgeId: 'user-count-3'
  },
  relevant: {
    listId: 'user-list-3',
    pendingId: 'pendientes-user-list-3',
    countBadgeId: 'user-count-3'
  },
  '2': {
    listId: 'user-list-2',
    pendingId: 'pendientes-user-list-2',
    countBadgeId: 'user-count-2'
  },
  important: {
    listId: 'user-list-2',
    pendingId: 'pendientes-user-list-2',
    countBadgeId: 'user-count-2'
  },
  '1': {
    listId: 'user-list-1',
    pendingId: 'pendientes-user-list-1',
    countBadgeId: 'user-count-1'
  },
  operational: {
    listId: 'user-list-1',
    pendingId: 'pendientes-user-list-1',
    countBadgeId: 'user-count-1'
  },
  '0': {
    listId: 'user-list',
    pendingId: 'pendientes-user-list',
    countBadgeId: 'user-count'
  },
  informative: {
    listId: 'user-list',
    pendingId: 'pendientes-user-list',
    countBadgeId: 'user-count'
  }
};

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function getPanelDomBindings(panelId) {
  return PANEL_DOM_BINDINGS[panelId] || {
    listId: `user-list-${escapeHtml(panelId)}`,
    pendingId: `pendientes-${escapeHtml(panelId)}`,
    countBadgeId: `count-${escapeHtml(panelId)}`
  };
}

export function getPanelDomRefs(container, panelId) {
  const bindings = getPanelDomBindings(panelId);

  return {
    bindings,
    listElement: container?.querySelector(`#${bindings.listId}`) || null,
    pendingElement: container?.querySelector(`#${bindings.pendingId}`) || null,
    badgeElement: bindings.countBadgeId
      ? container?.querySelector(`#${bindings.countBadgeId}`) || null
      : null
  };
}

export function getSidebarDomRefs(container, panels = []) {
  return {
    leftPanel: container?.querySelector('.supervision2-panel--left') || null,
    panelLoader: container?.querySelector('#supervisionSidebarLoader') || null,
    dateInput: container?.querySelector('#datePickerMapHot') || null,
    loader: container?.querySelector('#loaderGralSupNiveles') || null,
    weekInfo: container?.querySelector('#weekInfo') || null,
    messageNode: container?.querySelector('#msgContentsPanels') || null,
    selectedUserInput: container?.querySelector('#idSupervisorSeleccionado') || null,
    panels: new Map(
      (panels || []).map((panel) => [String(panel?.id || ''), getPanelDomRefs(container, panel?.id)])
    )
  };
}
