import { ThemeManager } from './src/modules/ThemeManager.js';
import { WebviewManager } from './src/modules/WebviewManager.js';
import { TabManager } from './src/modules/TabManager.js';
import { NavigationManager } from './src/modules/NavigationManager.js';

let themeManager;
let webviewManager;
let tabManager;
let navigationManager;

document.addEventListener('DOMContentLoaded', async () => {
  await initializeBrowser();
});

async function initializeBrowser() {
  themeManager = new ThemeManager();
  await themeManager.initialize();

  webviewManager = new WebviewManager(null, themeManager);
  tabManager = new TabManager(webviewManager, themeManager);
  navigationManager = new NavigationManager(tabManager, webviewManager);

  webviewManager.tabManager = tabManager;

  tabManager.initialize();
  await webviewManager.initialize();
  navigationManager.initialize();

  tabManager.updateUrlBar();
}
