import { SuggestionsManager } from './SuggestionsManager.js';

export class NavigationManager {
  constructor(tabManager, webviewManager, themeManager) {
    this.tabManager = tabManager;
    this.webviewManager = webviewManager;
    this.themeManager = themeManager;
    this.urlBar = null;
    this.favicon = null;
    this.fullUrl = '';
    this.pageTitle = '';
    this.suggestionsManager = new SuggestionsManager();
    this.suggestionsDropdown = null;
    this.selectedSuggestionIndex = -1;
    this.currentSuggestions = [];
    this.debounceTimer = null;
    this.voiceActive = false;
  }

  initialize() {
    this.urlBar = document.getElementById('url-bar');
    this.favicon = document.getElementById('site-favicon');
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

    const micBtn = document.getElementById('mic-btn');
    if (micBtn) {
      micBtn.addEventListener('click', () => this.toggleVoiceInput());
    }
  }

  toggleVoiceInput() {
    this.voiceActive = !this.voiceActive;
    const micBtn = document.getElementById('mic-btn');

    if (this.voiceActive) {
      micBtn.classList.add('active');
      this.urlBar.classList.add('voice-active');
      this.hideSuggestions();
    } else {
      micBtn.classList.remove('active');
      this.urlBar.classList.remove('voice-active');
    }
  }

  handleUrlBarFocus() {
    if (this.fullUrl && !this.fullUrl.startsWith('sonar://new-tab') && this.fullUrl !== 'new-tab' && !this.fullUrl.includes('new-tab.html')) {
      this.urlBar.value = this.fullUrl;
      this.urlBar.select();
    } else {
      this.urlBar.value = '';
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

    if (this.voiceActive) {
      return;
    }

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
        const suggestion = this.currentSuggestions[this.selectedSuggestionIndex];
        const navigationText = typeof suggestion === 'object' ? suggestion.text : suggestion;
        this.navigateToUrl(navigationText);
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

  highlightMatches(text, query) {
    if (!query || !text) return text;

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return `${before}<span class="highlight">${match}</span>${after}`;
  }

  showSuggestions(suggestions) {
    this.currentSuggestions = suggestions;
    this.selectedSuggestionIndex = -1;

    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.suggestionsDropdown.innerHTML = '';

    const query = this.urlBar.value;

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';

      const displayText = typeof suggestion === 'object' ? suggestion.display : suggestion;
      const navigationText = typeof suggestion === 'object' ? suggestion.text : suggestion;
      const type = typeof suggestion === 'object' ? suggestion.type : 'search';

      if (type === 'site') {
        const favicon = document.createElement('img');
        favicon.className = 'suggestion-favicon';
        const domain = navigationText;
        try {
          const faviconUrl = domain.startsWith('http')
            ? `${new URL(domain).origin}/favicon.ico`
            : `https://${domain}/favicon.ico`;
          favicon.src = faviconUrl;
          favicon.onerror = () => {
            favicon.style.display = 'none';
            const searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            searchIcon.setAttribute('class', 'suggestion-icon');
            searchIcon.setAttribute('width', '16');
            searchIcon.setAttribute('height', '16');
            searchIcon.setAttribute('viewBox', '0 0 16 16');
            searchIcon.setAttribute('fill', 'none');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z');
            path.setAttribute('stroke', 'currentColor');
            path.setAttribute('stroke-width', '1.5');
            const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path2.setAttribute('d', 'M10.5 10.5L14 14');
            path2.setAttribute('stroke', 'currentColor');
            path2.setAttribute('stroke-width', '1.5');
            path2.setAttribute('stroke-linecap', 'round');
            searchIcon.appendChild(path);
            searchIcon.appendChild(path2);
            item.insertBefore(searchIcon, item.firstChild);
          };
          favicon.onload = () => {
            favicon.classList.add('visible');
          };
          item.appendChild(favicon);
        } catch (e) {
          const searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          searchIcon.setAttribute('class', 'suggestion-icon');
          searchIcon.setAttribute('width', '16');
          searchIcon.setAttribute('height', '16');
          searchIcon.setAttribute('viewBox', '0 0 16 16');
          searchIcon.setAttribute('fill', 'none');
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z');
          path.setAttribute('stroke', 'currentColor');
          path.setAttribute('stroke-width', '1.5');
          const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path2.setAttribute('d', 'M10.5 10.5L14 14');
          path2.setAttribute('stroke', 'currentColor');
          path2.setAttribute('stroke-width', '1.5');
          path2.setAttribute('stroke-linecap', 'round');
          searchIcon.appendChild(path);
          searchIcon.appendChild(path2);
          item.appendChild(searchIcon);
        }
      } else {
        const searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        searchIcon.setAttribute('class', 'suggestion-icon');
        searchIcon.setAttribute('width', '16');
        searchIcon.setAttribute('height', '16');
        searchIcon.setAttribute('viewBox', '0 0 16 16');
        searchIcon.setAttribute('fill', 'none');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '1.5');
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path2.setAttribute('d', 'M10.5 10.5L14 14');
        path2.setAttribute('stroke', 'currentColor');
        path2.setAttribute('stroke-width', '1.5');
        path2.setAttribute('stroke-linecap', 'round');
        searchIcon.appendChild(path);
        searchIcon.appendChild(path2);
        item.appendChild(searchIcon);
      }

      const textSpan = document.createElement('span');
      textSpan.className = 'suggestion-text';
      textSpan.innerHTML = this.highlightMatches(displayText, query);
      item.appendChild(textSpan);

      item.addEventListener('click', () => {
        this.navigateToUrl(navigationText);
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

    const suggestion = this.currentSuggestions[this.selectedSuggestionIndex];
    this.urlBar.value = typeof suggestion === 'object' ? suggestion.text : suggestion;
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

    const suggestion = this.currentSuggestions[this.selectedSuggestionIndex];
    this.urlBar.value = typeof suggestion === 'object' ? suggestion.text : suggestion;
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

  updateFavicon(url) {
    console.log('NavigationManager updateFavicon called with URL:', url);

    if (!url || url === 'new-tab' || url.includes('new-tab.html') || url.startsWith('sonar://new-tab')) {
      const isDark = this.themeManager.isDarkTheme();
      const faviconName = isDark ? 'white.ico' : 'black.ico';
      const newTabFaviconPath = `sonar://new-tab/icons/${faviconName}`;
      console.log('Setting new-tab favicon in URL bar:', newTabFaviconPath, 'isDark:', isDark);
      this.favicon.src = newTabFaviconPath;
      this.favicon.classList.add('visible');
      this.urlBar.classList.add('has-favicon');

      this.favicon.onerror = () => {
        console.log('New tab favicon failed to load in URL bar');
        this.favicon.classList.remove('visible');
        this.urlBar.classList.remove('has-favicon');
      };

      this.favicon.onload = () => {
        console.log('New tab favicon loaded successfully in URL bar');
      };
      return;
    }

    try {
      const urlObj = new URL(url);
      const faviconUrl = `${urlObj.origin}/favicon.ico`;
      console.log('Setting website favicon in URL bar:', faviconUrl);

      this.favicon.src = faviconUrl;
      this.favicon.classList.add('visible');
      this.urlBar.classList.add('has-favicon');

      this.favicon.onerror = () => {
        console.log('Website favicon failed to load in URL bar:', faviconUrl);
        this.favicon.classList.remove('visible');
        this.urlBar.classList.remove('has-favicon');
      };
    } catch (e) {
      console.log('Error parsing URL in updateFavicon:', e);
      this.favicon.classList.remove('visible');
      this.urlBar.classList.remove('has-favicon');
    }
  }

  setUrlBarValue(url, title = '') {
    this.fullUrl = url;
    this.pageTitle = title;
    this.updateFavicon(url);
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
