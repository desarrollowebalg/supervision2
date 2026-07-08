import { buildSupervisionPanelTitle } from '../../../components/supervision-sidebar/supervision-accordion-item.js';

function parseIncidenciaDate(rawValue) {
  const safeValue = String(rawValue || '').trim();
  const match = safeValue.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);

  if (!match) {
    return 0;
  }

  const [, day, month, year, hours = '00', minutes = '00', seconds = '00'] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  ).getTime();
}

function compareIncidenciasByFechaDesc(left, right) {
  return parseIncidenciaDate(right?.FECHA) - parseIncidenciaDate(left?.FECHA);
}

function resolvePanelIdFromLevel(level, panels) {
  const normalizedLevel = String(Number(level ?? 0));
  const hasNumericPanel = (panels || []).some((panel) => String(panel?.id || '') === normalizedLevel);
  if (hasNumericPanel) {
    return normalizedLevel;
  }

  const legacyMap = {
    '4': 'critical',
    '3': 'relevant',
    '2': 'important',
    '1': 'operational',
    '0': 'informative'
  };

  return legacyMap[normalizedLevel] || '0';
}

export function getDefaultSupervisionDateValue() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function buildUsersByIdMap(usersCatalog) {
  return new Map(
    (Array.isArray(usersCatalog?.data) ? usersCatalog.data : []).map((user) => [
      Number(user?.ID_USUARIO ?? 0),
      user
    ])
  );
}

export function enrichIncidenciasWithUsers(records, usersById) {
  return (Array.isArray(records) ? records : []).map((item) => ({
    ...item,
    URL_FOTO_PERFIL: usersById.get(Number(item?.ID_USUARIO ?? 0))?.URL_FOTO_PERFIL || ''
  }));
}

export function groupIncidenciasByPanel(records, panels) {
  const recordsByLevel = new Map();
  const normalizedRecords = Array.isArray(records)
    ? [...records].sort(compareIncidenciasByFechaDesc)
    : [];

  normalizedRecords.forEach((record) => {
    const levelKey = resolvePanelIdFromLevel(record?.NIVEL, panels);
    if (!recordsByLevel.has(levelKey)) {
      recordsByLevel.set(levelKey, []);
    }

    recordsByLevel.get(levelKey).push(record);
  });

  return recordsByLevel;
}

export function buildSidebarPanelsViewModel(records, panels) {
  const recordsByLevel = groupIncidenciasByPanel(records, panels);

  return (Array.isArray(panels) ? panels : []).map((panel) => {
    const panelId = String(panel?.id || '');
    const panelRecords = recordsByLevel.get(panelId) || [];

    return {
      panelId,
      detailSlot: panel?.detailSlot || '',
      count: panelRecords.length,
      pendingTotal: panelRecords.reduce((sum, item) => sum + Number(item?.NO_LEIDOS ?? 0), 0),
      records: panelRecords.map((record) => ({
        ...record,
        PANEL_ID: panelId,
        DETAIL_SLOT: panel?.detailSlot || '',
        PANEL_TITLE: buildSupervisionPanelTitle(panel)
      }))
    };
  });
}
