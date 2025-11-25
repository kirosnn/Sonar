import { SuggestionsManager } from './SuggestionsManager.js';

export class NavigationManager {
  constructor(tabManager, webviewManager) {
    this.tabManager = tabManager;
    this.webviewManager = webviewManager;
    this.urlBar = null;
    this.fullUrl = '';
    this.pageTitle = '';
    this.suggestionsManager = new SuggestionsManager();
    this.suggestionsDropdown = null;
    this.selectedSuggestionIndex = -1;
    this.currentSuggestions = [];
    this.debounceTimer = null;
  }

  initialize() {
    this.urlBar = document.getElementById('url-bar');
    this.suggestionsDropdown = document.getElementById('suggestions-dropdown');

    document.getElementById('back-btn').addEventListener('click', () => this.goBack());
    document.getElementById('forward-btn').addEventListener('click', () => this.goForward());
    document.getElementById('reload-btn').addEventListener('click', () => this.reload());
    this.urlBar.addEventListener('keydown', (e) => this.handleUrlBarKeydown(e));
    this.urlBar.addEventListener('input', (e) => this.handleUrlBarInput(e));
    this.urlBar.addEventListener('focus', () => this.handleUrlBarFocus());
    this.urlBar.addEventListener('blur', () => this.handleUrlBarBlur());

    document.addEventListener('click', (e) => {
      if (!this.urlBar.contains(e.target) && !this.suggestionsDropdown.contains(e.target)) {
        this.hideSuggestions();
      }
    });

    const addTabBtn = document.getElementById('add-tab-btn');
    if (addTabBtn) {
      addTabBtn.addEventListener('click', () => this.tabManager.createNewTab());
    }
  }

  handleUrlBarFocus() {
    if (this.fullUrl) {
      this.urlBar.value = this.fullUrl;
      this.urlBar.select();
    }
  }

  handleUrlBarBlur() {
    setTimeout(() => {
      if (this.fullUrl) {
        this.urlBar.value = this.formatUrlForDisplay(this.fullUrl, this.pageTitle);
      }
      this.hideSuggestions();
    }, 200);
  }

  async handleUrlBarInput(e) {
    const query = e.target.value;

    clearTimeout(this.debounceTimer);

    if (!query || query.length < 2) {
      this.hideSuggestions();
      return;
    }

    this.debounceTimer = setTimeout(async () => {
      const suggestions = await this.suggestionsManager.getSuggestions(query);
      if (suggestions.length > 0) {
        this.showSuggestions(suggestions);
      } else {
        this.hideSuggestions();
      }
    }, 150);
  }

  handleUrlBarKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.selectedSuggestionIndex >= 0 && this.currentSuggestions[this.selectedSuggestionIndex]) {
        this.navigateToUrl(this.currentSuggestions[this.selectedSuggestionIndex]);
      } else {
        const url = e.target.value;
        this.navigateToUrl(url);
      }
      this.urlBar.blur();
      this.hideSuggestions();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectNextSuggestion();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectPreviousSuggestion();
    } else if (e.key === 'Escape') {
      this.hideSuggestions();
      this.urlBar.blur();
    }
  }

  showSuggestions(suggestions) {
    this.currentSuggestions = suggestions;
    this.selectedSuggestionIndex = -1;

    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.suggestionsDropdown.innerHTML = '';

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = suggestion;
      item.addEventListener('click', () => {
        this.navigateToUrl(suggestion);
        this.hideSuggestions();
      });
      this.suggestionsDropdown.appendChild(item);
    });

    requestAnimationFrame(() => {
      this.suggestionsDropdown.classList.remove('hidden');
      this.urlBar.classList.add('has-suggestions');
    });
  }

  hideSuggestions() {
    this.suggestionsDropdown.classList.add('hidden');
    this.urlBar.classList.remove('has-suggestions');
    this.selectedSuggestionIndex = -1;
    this.currentSuggestions = [];
  }

  selectNextSuggestion() {
    const items = this.suggestionsDropdown.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    if (this.selectedSuggestionIndex >= 0) {
      items[this.selectedSuggestionIndex].classList.remove('selected');
    }

    this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % items.length;
    items[this.selectedSuggestionIndex].classList.add('selected');
    this.urlBar.value = this.currentSuggestions[this.selectedSuggestionIndex];
  }

  selectPreviousSuggestion() {
    const items = this.suggestionsDropdown.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    if (this.selectedSuggestionIndex >= 0) {
      items[this.selectedSuggestionIndex].classList.remove('selected');
    }

    this.selectedSuggestionIndex = this.selectedSuggestionIndex <= 0
      ? items.length - 1
      : this.selectedSuggestionIndex - 1;

    items[this.selectedSuggestionIndex].classList.add('selected');
    this.urlBar.value = this.currentSuggestions[this.selectedSuggestionIndex];
  }

  extractDomain(url) {
    if (!url || url === 'new-tab' || url.includes('new-tab.html') || url.startsWith('sonar://new-tab')) {
      return '';
    }

    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      domain = domain.replace(/^www\./, '');
      return domain;
    } catch (e) {
      return '';
    }
  }

  formatUrlForDisplay(url, title) {
    if (!url || url === 'new-tab' || url.includes('new-tab.html') || url.startsWith('sonar://new-tab')) {
      return '';
    }

    const domain = this.extractDomain(url);

    if (title && title !== 'New Tab' && title !== domain) {
      return `${domain} / ${title}`;
    }

    return domain;
  }

  setUrlBarValue(url, title = '') {
    this.fullUrl = url;
    this.pageTitle = title;
    if (document.activeElement !== this.urlBar) {
      this.urlBar.value = this.formatUrlForDisplay(url, title);
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
