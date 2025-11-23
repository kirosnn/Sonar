export class WebviewManager {
  constructor(tabManager, themeManager) {
    this.tabManager = tabManager;
    this.themeManager = themeManager;
    this.newTabPath = 'sonar://new-tab';
  }

  async initialize() {
    const initialWebview = document.getElementById('webview-1');
    if (initialWebview) {
      this.setupWebviewListeners(initialWebview);
    }
  }

  async createWebview(tabId) {
    const contentArea = document.querySelector('.content-area');
    const newWebview = document.createElement('webview');
    newWebview.id = `webview-${tabId}`;
    newWebview.className = 'webview';
    newWebview.setAttribute('partition', 'persist:sonar');
    newWebview.setAttribute('src', this.newTabPath);

    const bgColor = this.themeManager.getBackgroundColor();
    newWebview.style.backgroundColor = bgColor;

    contentArea.appendChild(newWebview);
    this.setupWebviewListeners(newWebview);
  }

  setupWebviewListeners(webview) {
    webview.addEventListener('did-start-loading', () => {
      if (!webview.parentNode) return;
      const tabId = parseInt(webview.id.split('-')[1]);
      console.log(`Webview ${tabId} started loading`);
      this.tabManager.updateTabLoadingState(tabId, true);
    });

    webview.addEventListener('did-stop-loading', () => {
      if (!webview.parentNode) return;
      const tabId = parseInt(webview.id.split('-')[1]);
      console.log(`Webview ${tabId} stopped loading`);
      this.tabManager.updateTabLoadingState(tabId, false);
    });

    webview.addEventListener('did-fail-load', (e) => {
      if (!webview.parentNode) return;
      const tabId = parseInt(webview.id.split('-')[1]);
      console.error(`Webview ${tabId} failed to load:`, e.errorDescription, e.errorCode);
    });

    webview.addEventListener('console-message', (e) => {
      console.log(`Webview console [${e.level}]:`, e.message);
    });

    webview.addEventListener('page-title-updated', (e) => {
      if (!webview.parentNode) return;
      const tabId = parseInt(webview.id.split('-')[1]);
      const title = e.title || 'New Tab';
      this.tabManager.updateTabTitle(tabId, title);
    });

    webview.addEventListener('did-navigate', (e) => {
      if (!webview.parentNode) return;
      const tabId = parseInt(webview.id.split('-')[1]);
      console.log(`Webview ${tabId} navigated to:`, e.url);
      this.tabManager.updateTabUrl(tabId, e.url);
    });

    webview.addEventListener('did-navigate-in-page', (e) => {
      if (!webview.parentNode) return;
      const tabId = parseInt(webview.id.split('-')[1]);
      this.tabManager.updateTabUrl(tabId, e.url);
    });

    webview.addEventListener('will-navigate', (e) => {
    });
  }

  switchWebview(tabId) {
    document.querySelectorAll('.webview').forEach(webview => {
      if (webview && webview.parentNode) {
        webview.classList.remove('active');
        if (webview.id === `webview-${tabId}`) {
          webview.classList.add('active');
        }
      }
    });
  }

  removeWebview(tabId) {
    const webviewElement = document.getElementById(`webview-${tabId}`);
    if (webviewElement) {
      webviewElement.style.display = 'none';
      webviewElement.remove();
    }
  }

  getActiveWebview() {
    return document.querySelector('.webview.active');
  }
}
