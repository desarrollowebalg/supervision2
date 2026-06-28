import { DEFAULT_SUPERVISION_SIDEBAR_CONFIG } from '../config/supervision-sidebar.defaults.js';
import { normalizeSupervisionSidebarConfig } from './supervision-sidebar-config.normalizer.js';

const DEFAULT_WORKSPACE_ID = '1';
const DEFAULT_FILE_NAME = 'supervision-sidebar.json';

function buildConfigPath(workspaceId) {
  return `/doctosSupervision/${workspaceId}/${DEFAULT_FILE_NAME}`;
}

export async function loadSupervisionSidebarConfig(workspaceId = DEFAULT_WORKSPACE_ID) {
  const configPath = buildConfigPath(workspaceId);

  try {
    const response = await fetch(configPath, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`No se pudo cargar la configuración (${response.status})`);
    }

    const rawConfig = await response.json();
    return normalizeSupervisionSidebarConfig(rawConfig);
  } catch (error) {
    console.warn('Supervision sidebar config fallback', {
      workspaceId,
      configPath,
      error
    });

    return normalizeSupervisionSidebarConfig(DEFAULT_SUPERVISION_SIDEBAR_CONFIG);
  }
}
