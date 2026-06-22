class FormThemesService {
  static instancia = null;

  constructor() {
    if (FormThemesService.instancia) {
      return FormThemesService.instancia;
    }

    this.themesMap = new Map();
    this.lastLoadAt = 0;
    FormThemesService.instancia = this;
  }

  async getThemesMap({ forceReload = false } = {}) {
    if (!forceReload && this.themesMap.size > 0) {
      return this.themesMap;
    }

    try {
      const response = await fetch('/config/form-themes.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      this.themesMap = this.normalizeThemes(payload);
      this.lastLoadAt = Date.now();
      return this.themesMap;
    } catch (error) {
      console.warn('[form-themes] No fue posible cargar /config/form-themes.json:', error);
      this.themesMap = new Map();
      return this.themesMap;
    }
  }

  getThemeById(idTema) {
    const normalizedId = this.normalizeThemeId(idTema);
    if (!normalizedId) {
      return null;
    }

    return this.themesMap.get(normalizedId) || null;
  }

  normalizeThemes(payload) {
    const list = Array.isArray(payload?.temas) ? payload.temas : [];
    const map = new Map();

    for (const item of list) {
      const normalizedId = this.normalizeThemeId(item?.ID_TEMA);
      const barra = this.normalizeColor(item?.BARRA);
      const letra = this.normalizeColor(item?.LETRA);
      if (!normalizedId || !barra || !letra) {
        continue;
      }

      map.set(normalizedId, {
        ID_TEMA: normalizedId,
        NOMBRE: String(item?.NOMBRE || ''),
        BARRA: barra,
        LETRA: letra,
        GRADIENTE: this.normalizeGradient(item?.GRADIENTE)
      });
    }

    return map;
  }

  normalizeThemeId(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return String(value).trim();
  }

  normalizeColor(value) {
    if (value === null || value === undefined) {
      return null;
    }

    const color = String(value).trim();
    const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    return hexColorPattern.test(color) ? color : null;
  }

  normalizeGradient(value) {
    if (value === null || value === undefined) {
      return null;
    }

    const gradient = String(value).trim();
    if (!gradient) {
      return null;
    }

    return gradient.startsWith('linear-gradient(') ? gradient : null;
  }
}

const formThemesService = new FormThemesService();
export default formThemesService;
