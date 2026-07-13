import { getCurrentPath, navigate } from '../../core/router.js';
import { getIncidenciasDetalle } from '../../core/services/apis-me/incidencias.service.js';
import { storageService } from '../../core/services/storage.service.js';

const DETAIL_PAGE_SIZE = 30;
const DETAIL_FILTER_MODAL_ID = 'supervision2-detail-filter-modal';
const DETAIL_COLUMNS = [
  { key: 'FECHA', label: 'Fecha', sortable: true, searchable: true, visible: true },
  { key: 'HORA', label: 'Hora', sortable: true, searchable: true, visible: true },
  { key: 'PDR', label: 'Punto de revisión', sortable: true, searchable: true, visible: false },
  { key: 'OBS', label: 'Descripción', sortable: true, searchable: true, visible: true },
  { key: 'STT_DESC', label: 'Estado', sortable: true, searchable: true, visible: true },
  { key: 'TURNO', label: 'Turno', sortable: true, searchable: true, visible: true },
  { key: 'ACCIONES', label: 'Acciones', sortable: false, searchable: false, visible: true },
];
const ALL_STATUS_FILTER = 'ALL';
const STATUS_COLOR_MAP = {
  ALL: '#1e87f0',
  NL: '#ff9800',
  NL_NVL: '#ff9800',
  L: '#9e9e9e',
  A: '#009688',
  AP: '#4caf50',
  C: '#78909c',
  R: '#f44336',
  RE: '#9c27b0',
  X: '#1e87f0'
};
const MULTI_SELECT_FILTER_KEYS = new Set(['STT_DESC', 'TURNO']);

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

function isMultiSelectFilterKey(key) {
  return MULTI_SELECT_FILTER_KEYS.has(String(key || '').trim());
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

function createInitialFilters() {
  return {
    __general__: '',
    FECHA: '',
    HORA: '',
    PDR: '',
    OBS: '',
    STT_DESC: [],
    TURNO: []
  };
}

function countActiveColumnFilters(filters = {}) {
  return DETAIL_COLUMNS
    .filter((column) => column.searchable && column.key !== 'ACCIONES')
    .reduce((accumulator, column) => {
      const value = filters[column.key];
      if (Array.isArray(value)) {
        return accumulator + (value.length > 0 ? 1 : 0);
      }

      return accumulator + (String(value || '').trim() ? 1 : 0);
    }, 0);
}

function getUniqueFilterOptions(records = [], key) {
  const optionMap = new Map();

  (records || []).forEach((record) => {
    const rawValue = String(record?.[key] || '').trim();
    if (!rawValue) {
      return;
    }

    const normalizedValue = normalizeSearchValue(rawValue);
    if (!optionMap.has(normalizedValue)) {
      optionMap.set(normalizedValue, rawValue);
    }
  });

  return [...optionMap.entries()]
    .sort((leftEntry, rightEntry) => leftEntry[0].localeCompare(rightEntry[0], 'es'))
    .map(([, value]) => value);
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

function resolveStatusFilterKey(value) {
  const normalized = normalizeSearchValue(value)
    .replace(/\*/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

  const aliases = {
    TODAS: ALL_STATUS_FILTER,
    ALL: ALL_STATUS_FILTER,
    NL: 'NL',
    NO_LEIDA: 'NL',
    NO_LEIDAS: 'NL',
    NO_LEIDOS: 'NL',
    L: 'L',
    LEIDA: 'L',
    LEIDAS: 'L',
    A: 'A',
    ATENDIDA: 'A',
    ATENDIDAS: 'A',
    AP: 'AP',
    APROBADA: 'AP',
    APROBADAS: 'AP',
    C: 'C',
    CERRADA: 'C',
    CERRADAS: 'C',
    R: 'R',
    RECHAZADA: 'R',
    RECHAZADAS: 'R',
    RE: 'RE',
    REASIGNADA: 'RE',
    REASIGNADAS: 'RE',
    NL_NVL: 'NL_NVL',
    X: 'X',
    ABIERTA: 'X',
    ABIERTAS: 'X'
  };

  return aliases[normalized] || normalized || ALL_STATUS_FILTER;
}

function resolveStatusColor(filterKey) {
  return STATUS_COLOR_MAP[filterKey] || 'var(--supervision2-primary)';
}

function toStatusModifier(filterKey) {
  return String(filterKey || ALL_STATUS_FILTER).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildStatisticsModel(stats = []) {
  if (!Array.isArray(stats) || stats.length === 0) {
    return [];
  }

  const visibleStats = stats.filter((entry) => Number(entry?.total ?? 0) > 0);
  const totalIncidencias = stats.reduce((accumulator, entry) => (
    accumulator + Number(entry?.total ?? 0)
  ), 0);
  const statsToRender = [
    {
      code: ALL_STATUS_FILTER,
      label: 'Todas',
      total: totalIncidencias
    },
    ...visibleStats
  ];

  return statsToRender.map((entry) => {
    const filterKey = resolveStatusFilterKey(entry?.code || entry?.label || '');
    return {
      ...entry,
      filterKey,
      total: Number(entry?.total ?? 0),
      color: resolveStatusColor(filterKey),
      modifier: toStatusModifier(filterKey)
    };
  });
}

function resolveRecordStatusFilterKey(record = {}) {
  const rawStatus = String(record?.STT ?? '').trim();
  const statusByCode = {
    '-1': 'NL_NVL',
    '0': 'L',
    '1': 'A',
    '2': 'C',
    '3': 'AP',
    '4': 'R',
    '5': 'RE'
  };

  if (statusByCode[rawStatus]) {
    return statusByCode[rawStatus];
  }

  if (rawStatus.toUpperCase() === 'NL') {
    return 'NL';
  }

  return resolveStatusFilterKey(record?.STT_DESC || rawStatus || '');
}

function getStatusBadgeClassName(record = {}) {
  return `supervision2-detail-status-badge--${toStatusModifier(resolveRecordStatusFilterKey(record))}`;
}

function resolveSelectionLevel(selection) {
  const numericLevel = Number(selection?.panelId);
  return Number.isFinite(numericLevel) ? numericLevel : null;
}

function renderStatistics(stats = [], activeStatusFilter = ALL_STATUS_FILTER) {
  const statsToRender = buildStatisticsModel(stats);
  if (statsToRender.length === 0) {
    return `
      <div class="uk-alert-muted uk-border-rounded uk-margin-small-bottom">
        <p class="uk-margin-remove uk-text-small">No hay estadística disponible para este usuario.</p>
      </div>
    `;
  }

  return `
    <div class="supervision2-detail-stats uk-margin-small-bottom">
      ${statsToRender.map((entry) => `
        <button
          type="button"
          class="supervision2-detail-stat supervision2-detail-stat--${escapeHtml(entry.modifier)} ${entry.filterKey === activeStatusFilter ? 'is-active' : ''}"
          data-status-filter="${escapeHtml(entry.filterKey)}"
          aria-pressed="${entry.filterKey === activeStatusFilter ? 'true' : 'false'}"
        >
          <span class="supervision2-detail-stat__label">${escapeHtml(entry?.label || entry?.code || 'Estatus')}</span>
          <span class="supervision2-detail-stat__total">${entry.total}</span>
        </button>
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

function renderFilterField(column, filters, records) {
  if (isMultiSelectFilterKey(column.key)) {
    const options = getUniqueFilterOptions(records, column.key);
    const selectedValues = Array.isArray(filters[column.key]) ? filters[column.key] : [];
    const selectedSet = new Set(selectedValues.map((value) => normalizeSearchValue(value)));

    return `
      <label class="uk-form-stacked">
        <span class="uk-form-label uk-text-meta">${escapeHtml(column.label)}</span>
        <select
          class="uk-select uk-border-rounded supervision2-detail-filter-select"
          name="filter-${escapeHtml(column.key)}"
          multiple
          size="${Math.min(Math.max(options.length, 4), 6)}"
          aria-describedby="filter-help-${escapeHtml(column.key)}"
        >
          ${options.map((value) => `
            <option
              value="${escapeHtml(value)}"
              ${selectedSet.has(normalizeSearchValue(value)) ? 'selected' : ''}
            >
              ${escapeHtml(value)}
            </option>
          `).join('')}
        </select>
        <span id="filter-help-${escapeHtml(column.key)}" class="uk-text-meta supervision2-detail-filter-help">
          Puedes seleccionar más de un elemento en ${escapeHtml(column.label.toLowerCase())}.
        </span>
      </label>
    `;
  }

  return `
    <label class="uk-form-stacked">
      <span class="uk-form-label uk-text-meta">${escapeHtml(column.label)}</span>
      <input
        class="uk-input uk-form-small uk-border-rounded"
        type="search"
        name="filter-${escapeHtml(column.key)}"
        placeholder="Buscar ${escapeHtml(column.label.toLowerCase())}"
        value="${escapeHtml(filters[column.key] || '')}"
      >
    </label>
  `;
}

function renderFilterModal({ filters, records, activeFilterCount }) {
  return `
    <div id="${DETAIL_FILTER_MODAL_ID}" uk-modal>
      <div class="uk-modal-dialog uk-modal-body uk-border-rounded supervision2-detail-filter-modal">
        <button class="uk-modal-close-default" type="button" uk-close aria-label="Cerrar filtros"></button>
        <h4 class="uk-modal-title">Filtrar incidencias</h4>
        <p class="uk-text-meta uk-margin-small-top">
          Ajusta los filtros por columna. Estado y Turno permiten seleccionar más de un valor.
        </p>
        <div data-filter-form="true">
          <div class="supervision2-detail-filter-grid uk-margin-medium-top">
            ${DETAIL_COLUMNS
              .filter((column) => column.searchable)
              .map((column) => renderFilterField(column, filters, records))
              .join('')}
          </div>
          <div class="uk-flex uk-flex-between uk-flex-middle uk-flex-wrap uk-gap-small uk-margin-medium-top">
            <p class="uk-text-meta uk-margin-remove">Filtros activos: ${activeFilterCount}</p>
            <div class="uk-flex uk-flex-middle uk-flex-wrap uk-gap-small">
              <button
                class="uk-button uk-button-default uk-button-small uk-border-rounded"
                type="button"
                data-clear-modal-filters="true"
              >
                Limpiar filtros
              </button>
              <button
                class="uk-button uk-button-primary uk-button-small uk-border-rounded"
                type="button"
                data-apply-modal-filters="true"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function collectFiltersFromForm(formElement, currentFilters) {
  const nextFilters = {
    ...currentFilters
  };

  DETAIL_COLUMNS
    .filter((column) => column.searchable && column.key !== 'ACCIONES')
    .forEach((column) => {
      const fieldName = `filter-${column.key}`;
      const fieldElement = formElement?.querySelector?.(`[name="${fieldName}"]`);

      if (!fieldElement) {
        nextFilters[column.key] = isMultiSelectFilterKey(column.key) ? [] : '';
        return;
      }

      if (isMultiSelectFilterKey(column.key)) {
        nextFilters[column.key] = [...fieldElement.selectedOptions].map((option) => option.value || '');
        return;
      }

      nextFilters[column.key] = fieldElement.value || '';
    });

  return nextFilters;
}

function renderTableShell({
  selection,
  cacheNotice,
  statistics,
  records,
  filters,
  activeStatusFilter,
  sort,
  columnVisibility,
  page,
  pageSize
}) {
  const activeColumns = DETAIL_COLUMNS.filter((column) => columnVisibility[column.key]);
  const normalizedGeneralFilter = normalizeSearchValue(filters.__general__);
  const normalizedActiveStatus = activeStatusFilter === ALL_STATUS_FILTER
    ? ''
    : normalizeSearchValue(activeStatusFilter);
  const activeFilterCount = countActiveColumnFilters(filters);

  const filteredRecords = (records || []).filter((record) => {
    if (normalizedActiveStatus) {
      const recordStatus = resolveRecordStatusFilterKey(record);
      if (normalizeSearchValue(recordStatus) !== normalizedActiveStatus) {
        return false;
      }
    }

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
        const filterValue = filters[column.key];

        if (Array.isArray(filterValue)) {
          if (filterValue.length === 0) {
            return true;
          }

          const normalizedRecordValue = normalizeSearchValue(resolveFilterableValue(record, column.key));
          return filterValue.some((selectedValue) => normalizedRecordValue === normalizeSearchValue(selectedValue));
        }

        const normalizedFilter = normalizeSearchValue(filterValue);
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

    ${renderStatistics(statistics, activeStatusFilter)}
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
            class="uk-button uk-button-default uk-button-small uk-border-rounded supervision2-detail-filter-button"
            type="button"
            uk-toggle="target: #${DETAIL_FILTER_MODAL_ID}"
          >
            Filtrar${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
          <button
            class="uk-button uk-button-default uk-button-small uk-border-rounded"
            type="button"
            data-clear-filters="true"
          >
            Limpiar filtros
          </button>
        </div>
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
                          <span class="uk-label supervision2-detail-status-badge ${escapeHtml(getStatusBadgeClassName(record))}">${escapeHtml(record.STT_DESC || 'Sin estado')}</span>
                        </td>
                      `;
                    case 'TURNO':
                      return `<td>${escapeHtml(record.TURNO)}</td>`;
                    case 'ACCIONES':
                      return `
                        <td>
                          <div class="supervision2-panel-detai-tbl-actions">
                            <button
                              class="uk-icon-button"
                              type="button"
                              data-open-detail-page="${escapeHtml(record.IDE)}"
                              aria-label="Ver detalle ${escapeHtml(record.IDE)}"
                              title="Ver detalle"
                            >
                              <span uk-icon="icon: file-text; ratio: 0.9"></span>
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
      <div id="panelDerechoListIncidenciasModal"></div>
    </div>
  `;
}

export function createSupervisionDetailPanel({ container }) {
  let contentElement = null;
  let loaderElement = null;
  let modalHostElement = null;
  let modalElement = null;
  let currentSelection = null;
  let currentStatistics = [];
  let currentRecords = [];
  let currentCacheNotice = null;
  let currentPage = 1;
  let currentSort = {
    key: '',
    direction: 'asc'
  };
  let activeStatusFilter = ALL_STATUS_FILTER;
  let columnVisibility = getDefaultColumnVisibility();
  let filters = createInitialFilters();

  function renderContent(html) {
    if (contentElement) {
      contentElement.innerHTML = html;
    }
  }

  function renderModal(html) {
    if (modalHostElement) {
      modalHostElement.innerHTML = html;
    }

    bindModalEvents();
  }

  function bindModalEvents() {
    if (modalElement) {
      modalElement.removeEventListener('click', handleModalClick);
    }

    modalElement = document.getElementById(DETAIL_FILTER_MODAL_ID);
    modalElement?.addEventListener('click', handleModalClick);
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
      activeStatusFilter,
      sort: currentSort,
      columnVisibility,
      page: currentPage,
      pageSize: DETAIL_PAGE_SIZE
    }));

    renderModal(renderFilterModal({
      filters,
      records: currentRecords,
      activeFilterCount: countActiveColumnFilters(filters)
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
    renderModal('');
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
          activeStatusFilter,
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

    renderModal(renderFilterModal({
      filters,
      records: currentRecords,
      activeFilterCount: countActiveColumnFilters(filters)
    }));
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
        nivel: resolveSelectionLevel(selection),
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
    activeStatusFilter = ALL_STATUS_FILTER;
    filters = createInitialFilters();
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

    const statusFilterTrigger = event.target?.closest('[data-status-filter]');
    if (statusFilterTrigger) {
      activeStatusFilter = statusFilterTrigger.getAttribute('data-status-filter') || ALL_STATUS_FILTER;
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
      activeStatusFilter = ALL_STATUS_FILTER;
      filters = createInitialFilters();
      currentPage = 1;
      renderCurrentView();
      return;
    }

    const openDetailTrigger = event.target?.closest('[data-open-detail-page]');
    if (openDetailTrigger) {
      const ide = openDetailTrigger.getAttribute('data-open-detail-page') || '';
      notifyOpenDetailPage();
      navigate(`/detalle-incidencia/${encodeURIComponent(ide)}`, {
        state: {
          from: getCurrentPath(),
          previousLabel: currentSelection?.panelTitle || 'Supervisión'
        }
      });
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

  function applyModalFilters(filterForm) {
    if (!filterForm) {
      return;
    }

    filters = collectFiltersFromForm(filterForm, filters);
    currentPage = 1;

    const modalElement = filterForm.closest('.uk-modal');
    if (window.UIkit?.modal && modalElement) {
      window.UIkit.modal(modalElement).hide();
    }

    renderCurrentView();
  }

  function handleModalClick(event) {
    const applyModalTrigger = event.target?.closest('[data-apply-modal-filters]');
    if (applyModalTrigger) {
      const filterForm = applyModalTrigger.closest('[data-filter-form]');
      applyModalFilters(filterForm);
      return;
    }

    const clearModalTrigger = event.target?.closest('[data-clear-modal-filters]');
    if (!clearModalTrigger) {
      return;
    }

    const modalElement = clearModalTrigger.closest('.uk-modal');
    if (window.UIkit?.modal && modalElement) {
      window.UIkit.modal(modalElement).hide();
    }

    activeStatusFilter = ALL_STATUS_FILTER;
    filters = createInitialFilters();
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
    modalHostElement = container?.querySelector('#panelDerechoListIncidenciasModal') || null;
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
    modalElement?.removeEventListener('click', handleModalClick);
    contentElement = null;
    loaderElement = null;
    modalHostElement = null;
    modalElement = null;
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
