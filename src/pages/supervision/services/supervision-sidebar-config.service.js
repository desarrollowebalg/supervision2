import { storageService } from '../../../core/services/storage.service.js';
import {
  DEFAULT_SUPERVISION_SIDEBAR_CONFIG,
  DEFAULT_SUPERVISION_SIDEBAR_FALLBACK_CONFIG
} from '../config/supervision-sidebar.defaults.js';
import { normalizeSupervisionSidebarConfig } from './supervision-sidebar-config.normalizer.js';

const DEFAULT_WORKSPACE_ID = '1';
const DEFAULT_FILE_NAME = 'supervision-sidebar.json';

function decodeWorkspaceId(encodedWorkspaceId) {
  const safeValue = String(encodedWorkspaceId || '').trim();
  if (!safeValue) {
    return '';
  }

  try {
    return String(window.atob(safeValue)).trim();
  } catch (error) {
    console.warn('Supervision sidebar config invalid ci value', {
      encodedWorkspaceId: safeValue,
      error
    });
    return '';
  }
}

function resolveWorkspaceId(explicitWorkspaceId) {
  const safeWorkspaceId = String(explicitWorkspaceId || '').trim();
  if (safeWorkspaceId) {
    return safeWorkspaceId;
  }

  const encodedWorkspaceId = storageService.getSessionItem('ci');
  const decodedWorkspaceId = decodeWorkspaceId(encodedWorkspaceId);

  return decodedWorkspaceId || DEFAULT_WORKSPACE_ID;
}

function buildConfigPath(workspaceId) {
  return `/doctosSupervision/${workspaceId}/${DEFAULT_FILE_NAME}`;
}

export async function loadSupervisionSidebarConfig(workspaceId = '') {
  const resolvedWorkspaceId = resolveWorkspaceId(workspaceId);
  const configPath = buildConfigPath(resolvedWorkspaceId);

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
      workspaceId: resolvedWorkspaceId,
      configPath,
      error
    });

    return normalizeSupervisionSidebarConfig({
      ...DEFAULT_SUPERVISION_SIDEBAR_FALLBACK_CONFIG,
      workspaceId: resolvedWorkspaceId || DEFAULT_SUPERVISION_SIDEBAR_CONFIG.workspaceId
    });
  }
}
