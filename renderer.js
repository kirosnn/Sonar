import { ThemeManager } from './src/modules/ThemeManager.js';
import { WebviewManager } from './src/modules/WebviewManager.js';
import { TabManager } from './src/modules/TabManager.js';
import { NavigationManager } from './src/modules/NavigationManager.js';
import { TooltipManager } from './src/modules/TooltipManager.js';

let themeManager;
let webviewManager;
let tabManager;
let navigationManager;
let tooltipManager;

document.addEventListener('DOMContentLoaded', async () => {
  await initializeBrowser();
});

async function initializeBrowser() {
  themeManager = new ThemeManager();
  await themeManager.initialize();

  webviewManager = new WebviewManager(null, themeManager);
  tabManager = new TabManager(webviewManager, themeManager);
  navigationManager = new NavigationManager(tabManager, webviewManager, themeManager);
  tooltipManager = new TooltipManager();

  webviewManager.tabManager = tabManager;
  tabManager.setNavigationManager(navigationManager);

  tabManager.initialize();
  await webviewManager.initialize();
  navigationManager.initialize();
  tooltipManager.initialize();

  themeManager.onThemeChange(() => {
    tabManager.refreshAllFavicons();
    const activeTab = tabManager.getActiveTab();
    if (activeTab) {
      navigationManager.updateFavicon(activeTab.url);
    }
  });

  tabManager.updateUrlBar();
}
