import {
  DEFAULT_SUPERVISION_PANEL,
  DEFAULT_SUPERVISION_QUERY_PANEL,
  DEFAULT_SUPERVISION_SIDEBAR_CONFIG
} from '../config/supervision-sidebar.defaults.js';
import { hasRegisteredSupervisionDetail } from '../config/supervision-detail.registry.js';

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeAccordion(accordion) {
  return {
    multipleOpen: normalizeBoolean(
      accordion?.multipleOpen,
      DEFAULT_SUPERVISION_SIDEBAR_CONFIG.accordion.multipleOpen
    )
  };
}

function normalizeQueryPanel(queryPanel) {
  return {
    id: normalizeString(queryPanel?.id, DEFAULT_SUPERVISION_QUERY_PANEL.id),
    enabled: normalizeBoolean(queryPanel?.enabled, DEFAULT_SUPERVISION_QUERY_PANEL.enabled),
    label: normalizeString(queryPanel?.label, DEFAULT_SUPERVISION_QUERY_PANEL.label),
    icon: normalizeString(queryPanel?.icon, DEFAULT_SUPERVISION_QUERY_PANEL.icon),
    accordion: {
      initialOpen: normalizeBoolean(
        queryPanel?.accordion?.initialOpen,
        DEFAULT_SUPERVISION_QUERY_PANEL.accordion.initialOpen
      )
    },
    controls: {
      date: {
        enabled: normalizeBoolean(
          queryPanel?.controls?.date?.enabled,
          DEFAULT_SUPERVISION_QUERY_PANEL.controls.date.enabled
        ),
        required: normalizeBoolean(
          queryPanel?.controls?.date?.required,
          DEFAULT_SUPERVISION_QUERY_PANEL.controls.date.required
        ),
        defaultStrategy: normalizeString(
          queryPanel?.controls?.date?.defaultStrategy,
          DEFAULT_SUPERVISION_QUERY_PANEL.controls.date.defaultStrategy
        ),
        min: normalizeString(queryPanel?.controls?.date?.min, '') || null,
        max: normalizeString(queryPanel?.controls?.date?.max, '') || null
      }
    },
    behavior: {
      fetchOnInitialLoad: normalizeBoolean(
        queryPanel?.behavior?.fetchOnInitialLoad,
        DEFAULT_SUPERVISION_QUERY_PANEL.behavior.fetchOnInitialLoad
      ),
      fetchOnChange: normalizeBoolean(
        queryPanel?.behavior?.fetchOnChange,
        DEFAULT_SUPERVISION_QUERY_PANEL.behavior.fetchOnChange
      )
    },
    summary: {
      helperText: normalizeString(
        queryPanel?.summary?.helperText,
        DEFAULT_SUPERVISION_QUERY_PANEL.summary.helperText
      )
    }
  };
}

function normalizePanel(panel, index) {
  if (!panel || typeof panel !== 'object') {
    return null;
  }

  const id = normalizeString(panel.id);
  if (!id) {
    return null;
  }

  const detailSlot = normalizeString(panel.detailSlot, DEFAULT_SUPERVISION_PANEL.detailSlot);

  return {
    id,
    label: normalizeString(panel.label, DEFAULT_SUPERVISION_PANEL.label),
    indicatorTone: normalizeString(panel.indicatorTone, DEFAULT_SUPERVISION_PANEL.indicatorTone),
    indicatorColor: normalizeString(panel.indicatorColor, DEFAULT_SUPERVISION_PANEL.indicatorColor),
    order: normalizeNumber(panel.order, (index + 1) * 10),
    enabled: normalizeBoolean(panel.enabled, DEFAULT_SUPERVISION_PANEL.enabled),
    initialOpen: normalizeBoolean(panel.initialOpen, DEFAULT_SUPERVISION_PANEL.initialOpen),
    detailSlot: hasRegisteredSupervisionDetail(detailSlot)
      ? detailSlot
      : DEFAULT_SUPERVISION_PANEL.detailSlot,
    dataSourceKey: normalizeString(panel.dataSourceKey, DEFAULT_SUPERVISION_PANEL.dataSourceKey),
    meta: {
      subtitle: normalizeString(panel.meta?.subtitle, DEFAULT_SUPERVISION_PANEL.meta.subtitle),
      slaLabel: normalizeString(panel.meta?.slaLabel, DEFAULT_SUPERVISION_PANEL.meta.slaLabel)
    }
  };
}

export function normalizeSupervisionSidebarConfig(rawConfig) {
  const baseConfig = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
  const seenIds = new Set();
  const panels = Array.isArray(baseConfig.panels) ? baseConfig.panels : DEFAULT_SUPERVISION_SIDEBAR_CONFIG.panels;

  const normalizedPanels = panels
    .map((panel, index) => normalizePanel(panel, index))
    .filter((panel) => {
      if (!panel || seenIds.has(panel.id)) {
        return false;
      }

      seenIds.add(panel.id);
      return true;
    })
    .sort((left, right) => left.order - right.order);

  return {
    workspaceId: normalizeString(baseConfig.workspaceId, DEFAULT_SUPERVISION_SIDEBAR_CONFIG.workspaceId),
    schemaVersion: normalizeNumber(baseConfig.schemaVersion, DEFAULT_SUPERVISION_SIDEBAR_CONFIG.schemaVersion),
    accordion: normalizeAccordion(baseConfig.accordion),
    queryPanel: normalizeQueryPanel(baseConfig.queryPanel),
    panels: normalizedPanels
  };
}
