import { fetchIncidenciasByDate } from '../../core/services/apis-me/incidencias.service.js';
import { syncClientUsers } from '../../core/services/apis-me/usuarios.service.js';
import {
  buildSidebarPanelsViewModel,
  buildUsersByIdMap,
  enrichIncidenciasWithUsers,
  getDefaultSupervisionDateValue
} from '../../pages/supervision/services/supervision-sidebar.viewmodel.js';
import { getSidebarDomRefs } from './supervision-sidebar.dom.js';
import { renderSupervisionUserSummaryCard } from './supervision-user-summary-card.js';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function createSupervisionSidebarController({
  container,
  config,
  onDateChange = null,
  onUserSelect = null
}) {
  let domRefs = null;

  const panelConfig = Array.isArray(config?.panels) ? config.panels : [];

  function updateWeekInfo(selectedDate) {
    if (!domRefs?.weekInfo) {
      return;
    }

    domRefs.weekInfo.textContent = `Fecha seleccionada: ${selectedDate}`;
    domRefs.weekInfo.classList.add('uk-hidden');
  }

  function setMessage(message) {
    if (!domRefs?.messageNode) {
      return;
    }

    if (!message) {
      domRefs.messageNode.innerHTML = '';
      return;
    }

    domRefs.messageNode.innerHTML = `
      <div class="uk-alert-warning uk-border-rounded uk-margin-small-top" uk-alert>
        ${escapeHtml(message)}
      </div>
    `;
  }

  function setLoading(isLoading) {
    if (domRefs?.panelLoader) {
      domRefs.panelLoader.classList.toggle('uk-hidden', !isLoading);
      domRefs.panelLoader.setAttribute('aria-hidden', String(!isLoading));
    }

    if (domRefs?.leftPanel) {
      domRefs.leftPanel.classList.toggle('supervision2-panel--loading', isLoading);
    }

    if (domRefs?.loader) {
      domRefs.loader.innerHTML = '';
    }
  }

  function resetPanels() {
    domRefs?.panels?.forEach((panelRefs) => {
      if (panelRefs.listElement) {
        panelRefs.listElement.innerHTML = '';
      }

      if (panelRefs.pendingElement) {
        panelRefs.pendingElement.textContent = '0';
      }

      if (panelRefs.badgeElement) {
        panelRefs.badgeElement.textContent = '0';
        panelRefs.badgeElement.classList.add('uk-hidden');
      }
    });
  }

  function updatePanels(viewModel) {
    (viewModel || []).forEach((panelView) => {
      const panelRefs = domRefs?.panels?.get(String(panelView?.panelId || ''));
      if (!panelRefs) {
        return;
      }

      if (panelRefs.listElement) {
        panelRefs.listElement.innerHTML = (panelView.records || [])
          .map((record) => renderSupervisionUserSummaryCard(record))
          .join('');
      }

      if (panelRefs.pendingElement) {
        panelRefs.pendingElement.textContent = String(panelView.pendingTotal || 0);
      }

      if (panelRefs.badgeElement) {
        panelRefs.badgeElement.textContent = String(panelView.count || 0);
        panelRefs.badgeElement.classList.toggle('uk-hidden', Number(panelView.count || 0) === 0);
      }
    });
  }

  async function refreshAll({ selectedDate } = {}) {
    const safeDate = String(selectedDate || domRefs?.dateInput?.value || '').trim();
    if (!safeDate) {
      return [];
    }

    if (domRefs?.dateInput && domRefs.dateInput.value !== safeDate) {
      domRefs.dateInput.value = safeDate;
    }

    setLoading(true);
    updateWeekInfo(safeDate);
    resetPanels();

    try {
      const [incidenciasResult, usersCatalogResult] = await Promise.allSettled([
        fetchIncidenciasByDate(safeDate),
        syncClientUsers()
      ]);

      if (incidenciasResult.status !== 'fulfilled') {
        throw incidenciasResult.reason;
      }

      const usersById = buildUsersByIdMap(
        usersCatalogResult.status === 'fulfilled' ? usersCatalogResult.value : { data: [] }
      );
      const enrichedRecords = enrichIncidenciasWithUsers(incidenciasResult.value, usersById);
      const viewModel = buildSidebarPanelsViewModel(enrichedRecords, panelConfig);

      updatePanels(viewModel);
      setMessage('');
      return viewModel;
    } catch (error) {
      console.error('[supervision] error loading incidencias', error);
      setMessage('No se pudo cargar la lista de incidencias para la fecha seleccionada.');
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function handleDateChange(event) {
    const selectedDate = String(event?.target?.value || '').trim();
    onDateChange?.({
      selectedDate
    });
    await refreshAll({
      selectedDate
    });
  }

  function handleUserSelection(event) {
    const trigger = event.target?.closest('[data-supervision-user-id]');
    if (!trigger) {
      return;
    }

    const selection = {
      userId: Number(trigger.getAttribute('data-supervision-user-id') || 0),
      userName: trigger.getAttribute('data-supervision-user-name') || '',
      selectedDate: domRefs?.dateInput?.value || '',
      panelId: trigger.getAttribute('data-supervision-panel-id') || '',
      detailSlot: trigger.getAttribute('data-supervision-detail-slot') || ''
    };

    if (domRefs?.selectedUserInput) {
      domRefs.selectedUserInput.value = String(selection.userId);
    }

    onUserSelect?.(selection);
  }

  async function init() {
    domRefs = getSidebarDomRefs(container, panelConfig);
    if (!domRefs?.dateInput) {
      return api;
    }

    if (!domRefs.dateInput.value) {
      domRefs.dateInput.value = getDefaultSupervisionDateValue();
    }

    domRefs.dateInput.removeEventListener('change', handleDateChange);
    if (config?.queryPanel?.behavior?.fetchOnChange) {
      domRefs.dateInput.addEventListener('change', handleDateChange);
    }

    domRefs.leftPanel?.removeEventListener('click', handleUserSelection);
    domRefs.leftPanel?.addEventListener('click', handleUserSelection);

    if (config?.queryPanel?.behavior?.fetchOnInitialLoad) {
      await refreshAll({
        selectedDate: domRefs.dateInput.value
      });
    }

    return api;
  }

  function destroy() {
    domRefs?.dateInput?.removeEventListener('change', handleDateChange);
    domRefs?.leftPanel?.removeEventListener('click', handleUserSelection);
  }

  const api = {
    init,
    refreshAll,
    updatePanels,
    setLoading,
    setMessage,
    destroy
  };

  return api;
}
