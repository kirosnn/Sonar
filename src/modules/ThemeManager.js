export class ThemeManager {
  constructor() {
    this.themeColors = null;
    this.themeChangeListeners = [];
  }

  async initialize() {
    if (window.electronAPI && window.electronAPI.getThemeColors) {
      this.themeColors = await window.electronAPI.getThemeColors();
      this.applyTheme(this.themeColors);
    }

    if (window.electronAPI && window.electronAPI.onThemeChanged) {
      window.electronAPI.onThemeChanged((colors) => {
        this.themeColors = colors;
        this.applyTheme(colors);
        this.notifyThemeChange();
      });
    }
  }

  onThemeChange(callback) {
    this.themeChangeListeners.push(callback);
  }

  notifyThemeChange() {
    this.themeChangeListeners.forEach(callback => callback());
  }

  applyTheme(colors) {
    if (!colors) return;

    const root = document.documentElement;

    if (colors.isDark !== undefined) {
      root.style.colorScheme = colors.isDark ? 'dark' : 'light';
    }
  }

  getBackgroundColor() {
    return this.themeColors?.backgroundColor ||
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#191a1a' : '#f3f3f3');
  }

  getThemeColors() {
    return this.themeColors;
  }

  isDarkTheme() {
    if (this.themeColors?.isDark !== undefined) {
      return this.themeColors.isDark;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
