import { navigate } from '../../core/router.js';
import { getIncidenciasDetalle } from '../../core/services/apis-me/incidencias.service.js';
import { storageService } from '../../core/services/storage.service.js';

const DETAIL_PAGE_SIZE = 30;
const DETAIL_COLUMNS = [
  { key: 'FECHA', label: 'Fecha', sortable: true, searchable: true, visible: true },
  { key: 'HORA', label: 'Hora', sortable: true, searchable: true, visible: true },
  { key: 'PDR', label: 'Punto de revisión', sortable: true, searchable: true, visible: false },
  { key: 'OBS', label: 'Descripción', sortable: true, searchable: true, visible: true },
  { key: 'STT_DESC', label: 'Estado', sortable: true, searchable: true, visible: true },
  { key: 'TURNO', label: 'Turno', sortable: true, searchable: true, visible: true },
  { key: 'ACCIONES', label: 'Acciones', sortable: false, searchable: false, visible: true },
];

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function normalizeSearchValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function truncateText(value, limit = 58) {
  const safeValue = String(value || '').trim();
  if (safeValue.length <= limit) {
    return safeValue;
  }

  return `${safeValue.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
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

function formatIncidenciaDate(rawValue) {
  const safeValue = String(rawValue || '').trim();
  const isoMatch = safeValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year.slice(-2)}`;
  }

  const slashMatch = safeValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${day}/${month}/${year.slice(-2)}`;
  }

  return safeValue;
}

function parseDateForSort(rawValue) {
  const safeValue = String(rawValue || '').trim();
  const isoMatch = safeValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }

  const slashMatch = safeValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }

  return Number.NEGATIVE_INFINITY;
}

function parseHourForSort(rawValue) {
  const safeValue = String(rawValue || '').trim();
  const match = safeValue.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return Number.NEGATIVE_INFINITY;
  }

  const [, hours, minutes, seconds = '0'] = match;
  return (Number(hours) * 3600) + (Number(minutes) * 60) + Number(seconds);
}

function compareValues(left, right, direction = 'asc') {
  if (left === right) {
    return 0;
  }

  const result = left > right ? 1 : -1;
  return direction === 'desc' ? result * -1 : result;
}

function buildPdfUrl(ide) {
  return `https://app.movilizandome.net/modules/rEvidencia/Reporte_pdf.php?id=${encodeURIComponent(String(ide || '').trim())}`;
}

function getDefaultColumnVisibility() {
  return DETAIL_COLUMNS.reduce((accumulator, column) => {
    accumulator[column.key] = Boolean(column.visible);
    return accumulator;
  }, {});
}

function resolveFilterableValue(record, key) {
  switch (key) {
    case 'FECHA':
      return `${record.FECHA} ${formatIncidenciaDate(record.FECHA)}`;
    case 'ACCIONES':
      return '';
    default:
      return record?.[key] ?? '';
  }
}

function resolveSortValue(record, key) {
  switch (key) {
    case 'FECHA':
      return parseDateForSort(record?.FECHA);
    case 'HORA':
      return parseHourForSort(record?.HORA);
    case 'STT_DESC':
      return normalizeSearchValue(record?.STT_DESC);
    case 'TURNO':
      return normalizeSearchValue(record?.TURNO);
    default:
      return normalizeSearchValue(record?.[key]);
  }
}

function getRangeFromSession(selectedDate) {
  const fechaInicio = String(storageService.getSessionItem('fechaInicio') || '').trim();
  const fechaFin = String(storageService.getSessionItem('fechaFin') || '').trim();
  const fallbackDate = String(selectedDate || '').trim();

  return {
    fechaInicio: fechaInicio || fallbackDate,
    fechaFin: fechaFin || fallbackDate
  };
}

function renderStatistics(stats = []) {
  if (!Array.isArray(stats) || stats.length === 0) {
    return `
      <div class="uk-alert-muted uk-border-rounded uk-margin-small-bottom">
        <p class="uk-margin-remove uk-text-small">No hay estadística disponible para este usuario.</p>
      </div>
    `;
  }

  const visibleStats = stats.filter((entry) => Number(entry?.total ?? 0) > 0);
  const totalIncidencias = stats.reduce((accumulator, entry) => (
    accumulator + Number(entry?.total ?? 0)
  ), 0);
  const statsToRender = [
    {
      code: 'ALL',
      label: 'Todas',
      total: totalIncidencias
    },
    ...visibleStats
  ];

  return `
    <div class="supervision2-detail-stats uk-margin-small-bottom">
      ${statsToRender.map((entry) => `
        <div class="uk-card uk-card-default uk-card-small uk-card-body supervision2-detail-stat">
          <p class="uk-text-meta uk-margin-remove-bottom">${escapeHtml(entry?.label || entry?.code || 'Estatus')}</p>
          <p class="uk-margin-small-top uk-margin-remove-bottom supervision2-detail-stat__total">${Number(entry?.total ?? 0)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCacheNotice(message) {
  if (!message) {
    return '';
  }

  return `
    <div class="uk-alert-primary uk-border-rounded uk-margin-small-bottom" uk-alert>
      <p class="uk-margin-remove uk-text-small">${escapeHtml(message)}</p>
    </div>
  `;
}

function renderColumnVisibilityMenu(columnVisibility) {
  return `
    <div uk-dropdown="mode: click; offset: 8">
      <div class="uk-card uk-card-default uk-card-body uk-padding-small supervision2-detail-dropdown">
        <p class="uk-text-meta uk-margin-small-bottom">Columnas visibles</p>
        <div class="uk-grid-small uk-child-width-1-1" uk-grid>
          ${DETAIL_COLUMNS.filter((column) => column.key !== 'ACCIONES').map((column) => `
            <label class="uk-flex uk-flex-middle uk-gap-small">
              <input
                class="uk-checkbox"
                type="checkbox"
                data-column-toggle="${escapeHtml(column.key)}"
                ${columnVisibility[column.key] ? 'checked' : ''}
              >
              <span class="uk-text-small">${escapeHtml(column.label)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTableShell({
  selection,
  cacheNotice,
  statistics,
  records,
  filters,
  sort,
  columnVisibility,
  page,
  pageSize
}) {
  const activeColumns = DETAIL_COLUMNS.filter((column) => columnVisibility[column.key]);
  const normalizedGeneralFilter = normalizeSearchValue(filters.__general__);

  const filteredRecords = (records || []).filter((record) => {
    if (normalizedGeneralFilter) {
      const matchesGeneral = DETAIL_COLUMNS
        .filter((column) => column.searchable)
        .some((column) => normalizeSearchValue(resolveFilterableValue(record, column.key)).includes(normalizedGeneralFilter));

      if (!matchesGeneral) {
        return false;
      }
    }

    return DETAIL_COLUMNS
      .filter((column) => column.searchable && column.key !== 'ACCIONES')
      .every((column) => {
        const normalizedFilter = normalizeSearchValue(filters[column.key]);
        if (!normalizedFilter) {
          return true;
        }

        return normalizeSearchValue(resolveFilterableValue(record, column.key)).includes(normalizedFilter);
      });
  });

  const sortedRecords = [...filteredRecords];
  if (sort.key) {
    sortedRecords.sort((leftRecord, rightRecord) => {
      const comparison = compareValues(
        resolveSortValue(leftRecord, sort.key),
        resolveSortValue(rightRecord, sort.key),
        sort.direction
      );

      if (comparison !== 0) {
        return comparison;
      }

      return compareValues(
        normalizeSearchValue(leftRecord?.IDE),
        normalizeSearchValue(rightRecord?.IDE),
        'asc'
      );
    });
  }

  const totalRecords = sortedRecords.length;
  const safePage = Math.min(Math.max(page, 1), Math.max(Math.ceil(totalRecords / pageSize), 1));
  const startIndex = totalRecords === 0 ? 0 : ((safePage - 1) * pageSize);
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + pageSize);
  const rangeStart = totalRecords === 0 ? 0 : startIndex + 1;
  const rangeEnd = totalRecords === 0 ? 0 : startIndex + paginatedRecords.length;
  const totalPages = Math.max(Math.ceil(totalRecords / pageSize), 1);

  const dateMarkup = selection?.selectedDate
    ? `<p class="uk-margin-small-top uk-margin-remove-bottom uk-text-meta">Fecha: ${formatSelectionDate(selection.selectedDate)}</p>`
    : '';
  const originMarkup = selection?.panelTitle
    ? `
      <div class="uk-alert-muted uk-border-rounded uk-margin-small-bottom supervision2-detail-origin">
        <span class="supervision2-level-indicator supervision2-level-indicator--detail" aria-hidden="true"></span>
        <strong class="uk-text-small">Origen:</strong>
        <span class="uk-text-small">${escapeHtml(selection.panelTitle)}</span>
      </div>
    `
    : '';

  return `
    ${originMarkup}
    <section class="uk-card uk-card-default uk-card-body supervision2-detail-user-card uk-margin-small-bottom uk-padding-remove-top uk-padding-remove-bottom uk-border-rounded">
      <div class="uk-flex uk-flex-middle uk-grid-small" uk-grid>
        <div class="uk-width-auto">
          ${renderUserPhoto({ userName: selection?.userName || '', photoUrl: selection?.photoUrl || '' })}
        </div>
        <div class="uk-width-expand">
          <h2 class="uk-card-title uk-margin-remove-bottom supervision2-detail-user-card__title">
            ${escapeHtml(selection?.userName || 'Usuario')}
          </h2>
          ${dateMarkup}
        </div>
      </div>
    </section>

    ${renderStatistics(statistics)}
    ${renderCacheNotice(cacheNotice)}

    <section class="uk-card uk-card-default uk-card-body supervision2-detail-table-card">
      <div class="uk-flex uk-flex-between uk-flex-middle uk-flex-wrap uk-gap-small uk-margin-small-bottom">
        <div>
          <h3 class="uk-card-title uk-margin-remove-bottom">Detalle de incidencias</h3>
          <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">
            Registros: ${rangeStart}-${rangeEnd} / ${totalRecords}
          </p>
        </div>
        <div class="uk-flex uk-flex-middle uk-flex-wrap uk-gap-small">
          <label class="uk-form-icon uk-form-icon-flip supervision2-detail-search">
            <span uk-icon="search"></span>
            <input
              class="uk-input uk-form-small uk-border-rounded"
              type="search"
              placeholder="Buscar en todo"
              value="${escapeHtml(filters.__general__ || '')}"
              data-filter-key="__general__"
            >
          </label>
          <div class="uk-inline">
            <button class="uk-button uk-button-default uk-button-small uk-border-rounded" type="button">
              Columnas
            </button>
            ${renderColumnVisibilityMenu(columnVisibility)}
          </div>
          <button
            class="uk-button uk-button-default uk-button-small uk-border-rounded"
            type="button"
            data-clear-filters="true"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div class="supervision2-detail-filter-grid uk-margin-small-bottom">
        ${DETAIL_COLUMNS
          .filter((column) => column.searchable && columnVisibility[column.key])
          .map((column) => `
            <label>
              <span class="uk-form-label uk-text-meta">${escapeHtml(column.label)}</span>
              <input
                class="uk-input uk-form-small uk-border-rounded"
                type="search"
                placeholder="Buscar ${escapeHtml(column.label.toLowerCase())}"
                value="${escapeHtml(filters[column.key] || '')}"
                data-filter-key="${escapeHtml(column.key)}"
              >
            </label>
          `).join('')}
      </div>

      <div class="uk-overflow-auto">
        <table class="uk-table uk-table-divider uk-table-hover uk-table-small supervision2-detail-table">
          <thead>
            <tr>
              ${activeColumns.map((column) => {
                if (!column.sortable) {
                  return `<th>${escapeHtml(column.label)}</th>`;
                }

                const isActiveSort = sort.key === column.key;
                const sortIndicator = isActiveSort
                  ? (sort.direction === 'asc' ? 'arrow-up' : 'arrow-down')
                  : 'list';

                return `
                  <th>
                    <button
                      class="uk-button uk-button-text supervision2-detail-sort-button ${isActiveSort ? 'is-active' : ''}"
                      type="button"
                      data-sort-key="${escapeHtml(column.key)}"
                    >
                      <span>${escapeHtml(column.label)}</span>
                      <span uk-icon="icon: ${sortIndicator}; ratio: 0.75"></span>
                    </button>
                  </th>
                `;
              }).join('')}
            </tr>
          </thead>
          <tbody>
            ${paginatedRecords.length === 0 ? `
              <tr>
                <td colspan="${activeColumns.length}" class="uk-text-center uk-text-meta uk-padding">
                  No hay incidencias que coincidan con los filtros aplicados.
                </td>
              </tr>
            ` : paginatedRecords.map((record) => `
              <tr>
                ${activeColumns.map((column) => {
                  switch (column.key) {
                    case 'FECHA':
                      return `<td>${escapeHtml(formatIncidenciaDate(record.FECHA))}</td>`;
                    case 'HORA':
                      return `<td>${escapeHtml(record.HORA)}</td>`;
                    case 'PDR':
                      return `
                        <td title="${escapeHtml(record.PDR)}">
                          <span class="uk-text-truncate supervision2-detail-truncate">${escapeHtml(truncateText(record.PDR, 36))}</span>
                        </td>
                      `;
                    case 'OBS':
                      return `
                        <td title="${escapeHtml(record.OBS)}">
                          <span class="supervision2-detail-description">${escapeHtml(truncateText(record.OBS, 110))}</span>
                        </td>
                      `;
                    case 'STT_DESC':
                      return `
                        <td>
                          <span class="uk-label supervision2-detail-status-badge">${escapeHtml(record.STT_DESC || 'Sin estado')}</span>
                        </td>
                      `;
                    case 'TURNO':
                      return `<td>${escapeHtml(record.TURNO)}</td>`;
                    case 'ACCIONES':
                      return `
                        <td>
                          <div class="uk-flex uk-flex-middle uk-flex-wrap uk-gap-small">
                            <button
                              class="uk-button uk-button-default uk-button-small uk-border-rounded"
                              type="button"
                              data-open-detail-page="${escapeHtml(record.IDE)}"
                            >
                              <span uk-icon="icon: file-text; ratio: 0.85"></span>
                              Ver detalle
                            </button>
                            <a
                              class="uk-icon-button"
                              href="${escapeHtml(buildPdfUrl(record.IDE))}"
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Descargar PDF ${escapeHtml(record.IDE)}"
                              title="Descargar PDF"
                            >
                              <span uk-icon="icon: file-pdf; ratio: 0.9"></span>
                            </a>
                          </div>
                        </td>
                      `;
                    default:
                      return `<td>${escapeHtml(record?.[column.key] || '')}</td>`;
                  }
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="uk-flex uk-flex-between uk-flex-middle uk-flex-wrap uk-gap-small uk-margin-small-top">
        <p class="uk-text-meta uk-margin-remove">Registros: ${rangeStart}-${rangeEnd} / ${totalRecords}</p>
        <ul class="uk-pagination uk-flex-middle uk-margin-remove">
          <li class="${safePage <= 1 ? 'uk-disabled' : ''}">
            <button
              class="uk-button uk-button-text"
              type="button"
              data-page="${safePage - 1}"
              ${safePage <= 1 ? 'disabled' : ''}
            >
              Anterior
            </button>
          </li>
          ${Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((pageNumber) => (
              pageNumber === 1
              || pageNumber === totalPages
              || Math.abs(pageNumber - safePage) <= 1
            ))
            .map((pageNumber, index, filteredPages) => {
              const previousPage = filteredPages[index - 1];
              const ellipsis = previousPage && pageNumber - previousPage > 1
                ? '<li class="uk-disabled"><span>…</span></li>'
                : '';

              return `
                ${ellipsis}
                <li class="${pageNumber === safePage ? 'uk-active' : ''}">
                  <button
                    class="uk-button uk-button-text"
                    type="button"
                    data-page="${pageNumber}"
                  >
                    ${pageNumber}
                  </button>
                </li>
              `;
            }).join('')}
          <li class="${safePage >= totalPages ? 'uk-disabled' : ''}">
            <button
              class="uk-button uk-button-text"
              type="button"
              data-page="${safePage + 1}"
              ${safePage >= totalPages ? 'disabled' : ''}
            >
              Siguiente
            </button>
          </li>
        </ul>
      </div>
    </section>
  `;
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
  let currentSelection = null;
  let currentStatistics = [];
  let currentRecords = [];
  let currentCacheNotice = null;
  let currentPage = 1;
  let currentSort = {
    key: '',
    direction: 'asc'
  };
  let columnVisibility = getDefaultColumnVisibility();
  let filters = {
    __general__: '',
    FECHA: '',
    HORA: '',
    PDR: '',
    OBS: '',
    STT_DESC: '',
    TURNO: ''
  };

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

  function renderCurrentView() {
    renderContent(renderTableShell({
      selection: currentSelection,
      cacheNotice: currentCacheNotice,
      statistics: currentStatistics,
      records: currentRecords,
      filters,
      sort: currentSort,
      columnVisibility,
      page: currentPage,
      pageSize: DETAIL_PAGE_SIZE
    }));
  }

  function showEmptyState() {
    clearLoader();
    currentSelection = null;
    currentStatistics = [];
    currentRecords = [];
    currentCacheNotice = null;
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

  function showError(message) {
    clearLoader();
    const baseContent = currentSelection
      ? renderTableShell({
          selection: currentSelection,
          cacheNotice: null,
          statistics: [],
          records: [],
          filters,
          sort: currentSort,
          columnVisibility,
          page: 1,
          pageSize: DETAIL_PAGE_SIZE
        })
      : '';

    renderContent(`
      ${baseContent}
      <div class="uk-alert-danger uk-border-rounded uk-margin-small-top" uk-alert>
        <p class="uk-margin-remove">${escapeHtml(message)}</p>
      </div>
    `);
  }

  async function loadSelectionDetail(selection) {
    const { fechaInicio, fechaFin } = getRangeFromSession(selection?.selectedDate);
    if (!fechaInicio || !fechaFin || !selection?.userId) {
      showError('No fue posible resolver el rango semanal o el usuario seleccionado.');
      return;
    }

    showLoading();

    try {
      const result = await getIncidenciasDetalle({
        fechaInicio,
        fechaFin,
        usuario: selection.userId,
        selectedDate: selection?.selectedDate || ''
      });

      currentStatistics = Array.isArray(result?.estadistica) ? result.estadistica : [];
      currentRecords = Array.isArray(result?.incidencias) ? result.incidencias : [];
      currentCacheNotice = result?.cacheNotice || null;
      currentPage = 1;
      renderCurrentView();
    } catch (error) {
      console.error('[supervision] error loading incidencias detail', error);
      showError('No se pudo cargar el detalle de incidencias del usuario seleccionado.');
    } finally {
      clearLoader();
    }
  }

  async function showSelection(selection) {
    currentSelection = selection;
    currentStatistics = [];
    currentRecords = [];
    currentCacheNotice = null;
    currentPage = 1;
    currentSort = {
      key: '',
      direction: 'asc'
    };
    filters = {
      __general__: '',
      FECHA: '',
      HORA: '',
      PDR: '',
      OBS: '',
      STT_DESC: '',
      TURNO: ''
    };
    columnVisibility = getDefaultColumnVisibility();

    renderCurrentView();
    await loadSelectionDetail(selection);
  }

  function notifyOpenDetailPage() {
    const message = 'Se abrirá una nueva página con el detalle de la incidencia.';
    if (window.UIkit?.notification) {
      window.UIkit.notification({
        message,
        status: 'primary',
        pos: 'top-center',
        timeout: 2200
      });
      return;
    }

    window.alert(message);
  }

  function handlePanelClick(event) {
    const sortTrigger = event.target?.closest('[data-sort-key]');
    if (sortTrigger) {
      const sortKey = sortTrigger.getAttribute('data-sort-key') || '';
      if (currentSort.key === sortKey) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.key = sortKey;
        currentSort.direction = 'asc';
      }

      currentPage = 1;
      renderCurrentView();
      return;
    }

    const pageTrigger = event.target?.closest('[data-page]');
    if (pageTrigger) {
      const nextPage = Number(pageTrigger.getAttribute('data-page') || 1);
      if (Number.isFinite(nextPage) && nextPage > 0) {
        currentPage = nextPage;
        renderCurrentView();
      }
      return;
    }

    const clearTrigger = event.target?.closest('[data-clear-filters]');
    if (clearTrigger) {
      filters = {
        __general__: '',
        FECHA: '',
        HORA: '',
        PDR: '',
        OBS: '',
        STT_DESC: '',
        TURNO: ''
      };
      currentPage = 1;
      renderCurrentView();
      return;
    }

    const openDetailTrigger = event.target?.closest('[data-open-detail-page]');
    if (openDetailTrigger) {
      const ide = openDetailTrigger.getAttribute('data-open-detail-page') || '';
      notifyOpenDetailPage();
      navigate(`/detalle-incidencia/${encodeURIComponent(ide)}`);
    }
  }

  function handlePanelInput(event) {
    const filterKey = event.target?.getAttribute('data-filter-key');
    if (!filterKey) {
      return;
    }

    filters[filterKey] = event.target.value || '';
    currentPage = 1;
    renderCurrentView();
  }

  function handlePanelChange(event) {
    const columnKey = event.target?.getAttribute('data-column-toggle');
    if (!columnKey) {
      return;
    }

    columnVisibility[columnKey] = Boolean(event.target.checked);
    currentPage = 1;
    renderCurrentView();
  }

  function init() {
    contentElement = container?.querySelector('#panelDerechoListIncidencias') || null;
    loaderElement = container?.querySelector('#loaderDetalleIncidencias') || null;
    contentElement?.removeEventListener('click', handlePanelClick);
    contentElement?.removeEventListener('input', handlePanelInput);
    contentElement?.removeEventListener('change', handlePanelChange);
    contentElement?.addEventListener('click', handlePanelClick);
    contentElement?.addEventListener('input', handlePanelInput);
    contentElement?.addEventListener('change', handlePanelChange);
    showEmptyState();
    return api;
  }

  function destroy() {
    clearLoader();
    contentElement?.removeEventListener('click', handlePanelClick);
    contentElement?.removeEventListener('input', handlePanelInput);
    contentElement?.removeEventListener('change', handlePanelChange);
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
