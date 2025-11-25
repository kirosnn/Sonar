export class TabManager {
  constructor(webviewManager, themeManager) {
    this.tabs = [];
    this.activeTabId = 1;
    this.tabCounter = 1;
    this.webviewManager = webviewManager;
    this.themeManager = themeManager;
  }

  initialize() {
    this.tabs.push({
      id: 1,
      url: 'new-tab',
      title: 'New Tab'
    });

    const initialTab = document.querySelector('.tab[data-tab-id="1"]');
    if (initialTab) {
      this.setupTabListeners(initialTab);
    }

    this.positionAddTabButton();
  }

  async createNewTab() {
    this.tabCounter++;
    const newTabId = this.tabCounter;

    this.tabs.push({
      id: newTabId,
      url: 'new-tab',
      title: 'New Tab'
    });

    const tabsContainer = document.getElementById('tabs-container');
    const addBtn = document.getElementById('add-tab-btn');
    const newTabElement = document.createElement('div');
    newTabElement.className = 'tab';
    newTabElement.setAttribute('data-tab-id', newTabId);
    newTabElement.innerHTML = `
      <span class="tab-title">New Tab</span>
      <button class="tab-close">×</button>
    `;

    if (tabsContainer) {
      if (addBtn) {
        tabsContainer.insertBefore(newTabElement, addBtn);
      } else {
        tabsContainer.appendChild(newTabElement);
      }
    }

    this.setupTabListeners(newTabElement);
    await this.webviewManager.createWebview(newTabId);
    this.switchToTab(newTabId);
  }

  setupTabListeners(tabElement) {
    tabElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        const tabId = parseInt(tabElement.getAttribute('data-tab-id'));
        this.switchToTab(tabId);
      }
    });

    const closeBtn = tabElement.querySelector('.tab-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabId = parseInt(tabElement.getAttribute('data-tab-id'));
      this.closeTab(tabId);
    });
  }

  switchToTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
      if (parseInt(tab.getAttribute('data-tab-id')) === tabId) {
        tab.classList.add('active');
      }
    });

    this.webviewManager.switchWebview(tabId);
    this.activeTabId = tabId;
    this.updateUrlBar();
    this.positionAddTabButton();
  }

  closeTab(tabId) {
    if (this.tabs.length === 1) {
      if (window.electronAPI && window.electronAPI.closeApp) {
        window.electronAPI.closeApp();
      } else {
        window.close();
      }
      return;
    }

    const tabIndex = this.tabs.findIndex(t => t.id === tabId);
    this.webviewManager.removeWebview(tabId);
    this.tabs.splice(tabIndex, 1);

    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);

    if (this.activeTabId === tabId) {
      const newActiveTab = this.tabs[Math.max(0, tabIndex - 1)];
      this.switchToTab(newActiveTab.id);
    }

    if (tabElement) tabElement.remove();
    this.positionAddTabButton();
  }

  updateTabTitle(tabId, title) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.title = title;
    }

    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (tabElement) {
      const titleSpan = tabElement.querySelector('.tab-title');
      if (titleSpan) {
        titleSpan.textContent = title;
      }
    }
  }

  updateTabLoadingState(tabId, isLoading) {
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (tabElement) {
      if (isLoading) {
        tabElement.classList.add('loading');
      } else {
        tabElement.classList.remove('loading');
      }
    }
  }

  updateTabUrl(tabId, url) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.url = url;
      if (tabId === this.activeTabId) {
        this.updateUrlBar();
      }
    }
  }

  updateUrlBar() {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    const urlBar = document.getElementById('url-bar');
    if (tab && urlBar) {
      if (tab.url === 'new-tab' || tab.url.includes('new-tab.html') || tab.url.startsWith('sonar://new-tab')) {
        urlBar.value = '';
      } else {
        const url = tab.url || '';
        const title = tab.title || '';
        const navigationManager = this.getNavigationManager();
        if (navigationManager) {
          navigationManager.setUrlBarValue(url, title);
        } else {
          urlBar.value = url;
        }
      }
    }
  }

  getNavigationManager() {
    return this.navigationManager;
  }

  setNavigationManager(navigationManager) {
    this.navigationManager = navigationManager;
  }

  positionAddTabButton() {
    const tabsContainer = document.getElementById('tabs-container');
    const addBtn = document.getElementById('add-tab-btn');
    if (tabsContainer && addBtn) {
      tabsContainer.appendChild(addBtn);
    }
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId);
  }
}
