export class NavigationManager {
  constructor(tabManager, webviewManager) {
    this.tabManager = tabManager;
    this.webviewManager = webviewManager;
  }

  initialize() {
    document.getElementById('back-btn').addEventListener('click', () => this.goBack());
    document.getElementById('forward-btn').addEventListener('click', () => this.goForward());
    document.getElementById('reload-btn').addEventListener('click', () => this.reload());
    document.getElementById('url-bar').addEventListener('keypress', (e) => this.handleUrlBarKeypress(e));

    const addTabBtn = document.getElementById('add-tab-btn');
    if (addTabBtn) {
      addTabBtn.addEventListener('click', () => this.tabManager.createNewTab());
    }
  }

  handleUrlBarKeypress(e) {
    if (e.key === 'Enter') {
      const url = e.target.value;
      this.navigateToUrl(url);
    }
  }

  navigateToUrl(input) {
    let url = input.trim();

    if (url.startsWith('sonar://')) {
      this.loadUrl(url);
    } else if (url.includes('.') && !url.includes(' ')) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      this.loadUrl(url);
    } else {
      url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
      this.loadUrl(url);
    }
  }

  loadUrl(url) {
    const activeWebview = this.webviewManager.getActiveWebview();
    if (activeWebview) {
      activeWebview.src = url;
      const tab = this.tabManager.getActiveTab();
      if (tab) {
        tab.url = url;
      }
    }
  }

  goBack() {
    const activeWebview = this.webviewManager.getActiveWebview();
    if (activeWebview && activeWebview.canGoBack()) {
      activeWebview.goBack();
    }
  }

  goForward() {
    const activeWebview = this.webviewManager.getActiveWebview();
    if (activeWebview && activeWebview.canGoForward()) {
      activeWebview.goForward();
    }
  }

  reload() {
    const activeWebview = this.webviewManager.getActiveWebview();
    if (activeWebview) {
      activeWebview.reload();
    }
  }
}
