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
      url: 'sonar://new-tab',
      title: 'New Tab'
    });

    const initialTab = document.querySelector('.tab[data-tab-id="1"]');
    if (initialTab) {
      this.setupTabListeners(initialTab);
    }

    this.updateTabFavicon(1, 'sonar://new-tab');
    this.positionAddTabButton();

    window.addEventListener('resize', () => {
      requestAnimationFrame(() => this.updateTabsLayout());
    });
  }

  async createNewTab() {
    this.tabCounter++;
    const newTabId = this.tabCounter;

    this.tabs.push({
      id: newTabId,
      url: 'sonar://new-tab',
      title: 'New Tab'
    });

    const tabsContainer = document.getElementById('tabs-container');
    const addBtn = document.getElementById('add-tab-btn');
    const newTabElement = document.createElement('div');
    newTabElement.className = 'tab';
    newTabElement.setAttribute('data-tab-id', newTabId);
    newTabElement.innerHTML = `
      <img class="tab-favicon" src="" alt="">
      <span class="tab-title">New Tab</span>
      <button class="tab-close">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    if (tabsContainer) {
      if (addBtn) {
        tabsContainer.insertBefore(newTabElement, addBtn);
      } else {
        tabsContainer.appendChild(newTabElement);
      }
    }

    this.setupTabListeners(newTabElement);
    this.updateTabFavicon(newTabId, 'sonar://new-tab');
    await this.webviewManager.createWebview(newTabId);
    this.switchToTab(newTabId);
    this.updateTabsLayout();
  }

  setupTabListeners(tabElement) {
    tabElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        const tabId = parseInt(tabElement.getAttribute('data-tab-id'));
        this.switchToTab(tabId);
      }
    });

    tabElement.addEventListener('mousedown', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        const tabId = parseInt(tabElement.getAttribute('data-tab-id'));
        this.closeTab(tabId);
      }
    });

    tabElement.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        e.preventDefault();
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
    requestAnimationFrame(() => {
      document.querySelectorAll('.tab').forEach(tab => {
        const isActive = parseInt(tab.getAttribute('data-tab-id')) === tabId;
        if (isActive) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    });

    this.webviewManager.switchWebview(tabId);
    this.activeTabId = tabId;
    this.updateUrlBar();
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
    this.updateTabsLayout();
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

  updateTabFavicon(tabId, url) {
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (!tabElement) return;

    const favicon = tabElement.querySelector('.tab-favicon');
    if (!favicon) return;

    console.log('updateTabFavicon called with URL:', url);

    if (!url || url === 'new-tab' || url.includes('new-tab.html') || url.startsWith('sonar://new-tab')) {
      const isDark = this.themeManager.isDarkTheme();
      const faviconName = isDark ? 'white.ico' : 'black.ico';
      const newTabFaviconPath = `sonar://new-tab/icons/${faviconName}`;
      console.log('Setting new-tab favicon:', newTabFaviconPath, 'isDark:', isDark);
      favicon.src = newTabFaviconPath;
      favicon.classList.add('visible');

      favicon.onerror = () => {
        console.log('New tab favicon failed to load');
        favicon.classList.remove('visible');
        favicon.src = '';
      };

      favicon.onload = () => {
        console.log('New tab favicon loaded successfully');
      };
      return;
    }

    try {
      const urlObj = new URL(url);
      const faviconUrl = `${urlObj.origin}/favicon.ico`;
      console.log('Setting website favicon:', faviconUrl);

      favicon.src = faviconUrl;
      favicon.classList.add('visible');

      favicon.onerror = () => {
        console.log('Website favicon failed to load:', faviconUrl);
        favicon.classList.remove('visible');
        favicon.src = '';
      };
    } catch (e) {
      console.log('Error parsing URL:', e);
      favicon.classList.remove('visible');
      favicon.src = '';
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
      this.updateTabFavicon(tabId, url);
      if (tabId === this.activeTabId) {
        this.updateUrlBar();
      }
    }
  }

  updateUrlBar() {
    const tab = this.tabs.find(t => t.id === this.activeTabId);
    const urlBar = document.getElementById('url-bar');
    if (tab && urlBar) {
      const url = tab.url || '';
      const title = tab.title || '';
      const navigationManager = this.getNavigationManager();

      if (navigationManager) {
        navigationManager.setUrlBarValue(url, title);
      } else {
        if (tab.url === 'new-tab' || tab.url.includes('new-tab.html') || tab.url.startsWith('sonar://new-tab')) {
          urlBar.value = '';
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

  updateTabsLayout() {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;

    const tabCount = this.tabs.length;
    const containerWidth = tabsContainer.offsetWidth;
    const addBtnWidth = 36;
    const availableWidth = containerWidth - addBtnWidth;
    const tabGap = 4;
    const totalGapWidth = (tabCount - 1) * tabGap;
    const usableWidth = availableWidth - totalGapWidth;

    let idealTabWidth = usableWidth / tabCount;

    const maxTabWidth = 240;
    const minTabWidthWithTitle = 120;
    const minTabWidthIconOnly = 80;
    const minTabWidthFaviconOnly = 40;

    tabsContainer.classList.remove('many-tabs', 'lots-of-tabs', 'very-many-tabs', 'extreme-tabs');

    if (idealTabWidth >= maxTabWidth) {
      return;
    } else if (idealTabWidth >= minTabWidthWithTitle) {
      tabsContainer.classList.add('many-tabs');
    } else if (idealTabWidth >= minTabWidthIconOnly) {
      tabsContainer.classList.add('lots-of-tabs');
    } else if (idealTabWidth >= minTabWidthFaviconOnly) {
      tabsContainer.classList.add('very-many-tabs');
    } else {
      tabsContainer.classList.add('extreme-tabs');
    }
  }

  positionAddTabButton() {
    const tabsContainer = document.getElementById('tabs-container');
    const addBtn = document.getElementById('add-tab-btn');
    if (tabsContainer && addBtn) {
      tabsContainer.appendChild(addBtn);
    }
    this.updateTabsLayout();
  }

  getActiveTab() {
    return this.tabs.find(t => t.id === this.activeTabId);
  }

  refreshAllFavicons() {
    this.tabs.forEach(tab => {
      this.updateTabFavicon(tab.id, tab.url);
    });
  }
}
