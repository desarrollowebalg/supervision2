import { storageService } from './storage.service.js';

const THEME_STORAGE_KEY = 'appThemePreference';
const VALID_THEME_PREFERENCES = new Set(['system', 'light', 'dark']);

class ThemeService {
  static instancia = null;

  constructor() {
    if (ThemeService.instancia) {
      return ThemeService.instancia;
    }

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
    this.isInitialized = false;

    ThemeService.instancia = this;
  }

  inicializar() {
    if (this.isInitialized) {
      this.applyTheme();
      return this;
    }

    if (typeof this.mediaQuery?.addEventListener === 'function') {
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    } else if (typeof this.mediaQuery?.addListener === 'function') {
      this.mediaQuery.addListener(this.handleSystemThemeChange);
    }

    this.applyTheme();
    this.isInitialized = true;
    return this;
  }

  getPreference() {
    const storedPreference = storageService.getItem(THEME_STORAGE_KEY);
    return VALID_THEME_PREFERENCES.has(storedPreference) ? storedPreference : 'system';
  }

  getSystemTheme() {
    return this.mediaQuery?.matches ? 'dark' : 'light';
  }

  getEffectiveTheme() {
    const preference = this.getPreference();
    return preference === 'system' ? this.getSystemTheme() : preference;
  }

  setPreference(preference = 'system') {
    const normalizedPreference = VALID_THEME_PREFERENCES.has(preference) ? preference : 'system';

    if (normalizedPreference === 'system') {
      storageService.removeItem(THEME_STORAGE_KEY);
    } else {
      storageService.setItem(THEME_STORAGE_KEY, normalizedPreference);
    }

    this.applyTheme();
  }

  clearStoredPreference() {
    storageService.removeItem(THEME_STORAGE_KEY);
    this.applyTheme();
  }

  toggleTheme() {
    const nextTheme = this.getEffectiveTheme() === 'dark' ? 'light' : 'dark';
    this.setPreference(nextTheme);
    return nextTheme;
  }

  applyTheme() {
    const preference = this.getPreference();
    const effectiveTheme = this.getEffectiveTheme();
    const root = document.documentElement;

    root.dataset.theme = effectiveTheme;
    root.style.colorScheme = effectiveTheme;

    window.dispatchEvent(new CustomEvent('app-theme-changed', {
      detail: {
        preference,
        effectiveTheme,
        systemTheme: this.getSystemTheme()
      }
    }));
  }

  handleSystemThemeChange() {
    if (this.getPreference() !== 'system') {
      return;
    }

    this.applyTheme();
  }
}

export const themeService = new ThemeService();
export { THEME_STORAGE_KEY };
