export class SuggestionsManager {
  constructor() {
    this.prioritySuggestions = [];
    this.popularSites = [];
    this.googleCache = new Map();
    this.pendingRequests = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const [priorityRes, sitesRes] = await Promise.all([
        fetch('sonar://data/priority-suggestions.json'),
        fetch('sonar://data/popular-sites.json')
      ]);

      this.prioritySuggestions = await priorityRes.json();
      this.popularSites = await sitesRes.json();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load suggestions data:', error);
      this.prioritySuggestions = [];
      this.popularSites = [];
    }
  }

  isSiteUrl(text) {
    const urlPattern = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    return urlPattern.test(text) || text.includes('.');
  }

  findSiteInfo(domain) {
    const cleanDomain = domain.toLowerCase().trim();
    return this.popularSites.find(site =>
      site.domain.toLowerCase() === cleanDomain ||
      site.domain.toLowerCase().startsWith(cleanDomain + '.') ||
      cleanDomain === site.domain.toLowerCase().replace(/\.[^.]+$/, '')
    );
  }

  findSiteByPartialMatch(query) {
    if (query.length < 3) return null;

    const q = query.toLowerCase().trim();
    return this.popularSites.find(site => {
      const domainWithoutTld = site.domain.toLowerCase().split('.')[0];
      return domainWithoutTld === q ||
             site.domain.toLowerCase() === q + '.com' ||
             site.domain.toLowerCase() === q + '.fr' ||
             site.domain.toLowerCase() === q + '.org' ||
             site.domain.toLowerCase() === q + '.net';
    });
  }

  async getGoogleSuggestions(query) {
    if (!query || query.length < 2) return [];

    if (this.googleCache.has(query)) {
      return this.googleCache.get(query);
    }

    if (this.pendingRequests.has(query)) {
      return this.pendingRequests.get(query);
    }

    const requestPromise = (async () => {
      try {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        const suggestions = Array.isArray(data[1]) ? data[1] : [];

        this.googleCache.set(query, suggestions);

        if (this.googleCache.size > 100) {
          const firstKey = this.googleCache.keys().next().value;
          this.googleCache.delete(firstKey);
        }

        return suggestions;
      } catch (error) {
        console.error('Error fetching Google suggestions:', error);
        return [];
      } finally {
        this.pendingRequests.delete(query);
      }
    })();

    this.pendingRequests.set(query, requestPromise);
    return requestPromise;
  }

  scoreMatch(text, query) {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    if (textLower === queryLower) return 1000;
    if (textLower.startsWith(queryLower + ' ')) return 900;
    if (textLower.startsWith(queryLower)) return 800;
    if (textLower.split(' ').some(word => word.startsWith(queryLower))) return 700;
    if (textLower.includes(' ' + queryLower)) return 600;
    if (textLower.includes(queryLower)) return 500;
    return 0;
  }

  getLocalMatches(query) {
    if (!query || query.length < 2) return [];

    const q = query.toLowerCase();

    const priorityMatches = this.prioritySuggestions
      .map(text => ({
        text: text,
        score: this.scoreMatch(text, q)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => ({
        type: 'search',
        text: item.text,
        display: item.text
      }));

    const siteMatches = this.popularSites
      .map(site => {
        const domainScore = this.scoreMatch(site.domain, q);
        const titleScore = this.scoreMatch(site.title, q);
        const maxScore = Math.max(domainScore, titleScore);
        return {
          site: site,
          score: maxScore
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => ({
        type: 'site',
        text: item.site.domain,
        display: `${item.site.title} — ${item.site.domain}`
      }));

    const allMatches = [...priorityMatches, ...siteMatches]
      .sort((a, b) => {
        const aScore = this.scoreMatch(a.display, q);
        const bScore = this.scoreMatch(b.display, q);
        return bScore - aScore;
      });

    return allMatches;
  }

  async getSuggestions(query) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!query || query.length < 2) return [];

    const localMatches = this.getLocalMatches(query);

    const partialSiteMatch = this.findSiteByPartialMatch(query);
    if (partialSiteMatch && !localMatches.some(m => m.text === partialSiteMatch.domain)) {
      localMatches.unshift({
        type: 'site',
        text: partialSiteMatch.domain,
        display: `${partialSiteMatch.title} — ${partialSiteMatch.domain}`
      });
    }

    const googleSuggestionsPromise = this.getGoogleSuggestions(query);

    const googleSuggestions = await googleSuggestionsPromise;

    const googleObjects = googleSuggestions.map(text => {
      if (this.isSiteUrl(text)) {
        const siteInfo = this.findSiteInfo(text);
        if (siteInfo) {
          return {
            type: 'site',
            text: siteInfo.domain,
            display: `${siteInfo.title} — ${siteInfo.domain}`
          };
        }
        return {
          type: 'site',
          text: text,
          display: text
        };
      }
      return {
        type: 'search',
        text: text,
        display: text
      };
    });

    const merged = [...localMatches, ...googleObjects];

    const seen = new Set();
    const unique = merged.filter(item => {
      const key = item.text.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return unique.slice(0, 8);
  }
}
