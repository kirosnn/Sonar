export class SuggestionsManager {
  constructor() {
    this.prioritySuggestions = [
      "dernières actualités",
      "latest news",
      "actualité france",
      "world news",
      "breaking news",
      "actualité internationale",
      "international news",
      "actualité politique",
      "political news",
      "actualité économie",
      "economy news",
      "business news",
      "actualité santé",
      "health news",
      "actualité sport",
      "sports news",
      "actualité culture",
      "culture news",
      "actualité science",
      "science news",
      "actualité technologie",
      "technology news",
      "actualité environnement",
      "environment news",
      "climate news",
      "actualité climat",
      "actualité société",
      "society news",
      "actualité justice",
      "justice news",
      "actualité éducation",
      "education news",
      "financial news",
      "actualité finance",
      "stock market",
      "bourse",
      "crypto news",
      "actualité crypto",
      "bitcoin news",
      "elections",
      "élections",
      "guerre ukraine",
      "ukraine war",
      "middle east news",
      "actualité moyen orient",
      "china news",
      "actualité chine",
      "usa news",
      "actualité usa",
      "europe news",
      "actualité europe",
      "africa news",
      "actualité afrique",
      "asia news",
      "actualité asie",
      "chatgpt",
      "openai",
      "artificial intelligence",
      "intelligence artificielle",
      "ia nouveautés",
      "ai news",
      "ai tools",
      "machine learning",
      "apprentissage automatique",
      "deep learning",
      "neural networks",
      "nouveautés tech",
      "tech news",
      "latest smartphones",
      "nouveaux smartphones",
      "comparatif pc",
      "meilleurs laptops",
      "best laptops",
      "apple news",
      "actualité apple",
      "samsung news",
      "google news",
      "microsoft news",
      "meta news",
      "amazon news",
      "tesla news",
      "actualité tesla",
      "electric cars",
      "voitures électriques",
      "space news",
      "actualité espace",
      "spacex",
      "nasa",
      "sorties cinéma",
      "new movies",
      "films à l'affiche",
      "top movies",
      "meilleurs films",
      "top séries",
      "best series",
      "meilleures séries",
      "netflix nouveautés",
      "netflix new releases",
      "disney plus",
      "prime video",
      "streaming news",
      "actualité streaming",
      "new games",
      "sorties jeux video",
      "nouveaux jeux",
      "gaming news",
      "actualité gaming",
      "playstation",
      "xbox",
      "nintendo",
      "pc gaming",
      "esports",
      "football news",
      "actualité football",
      "basketball news",
      "tennis news",
      "formula 1",
      "formule 1",
      "rugby news",
      "olympics",
      "jeux olympiques",
      "world cup",
      "coupe du monde",
      "champions league",
      "ligue 1",
      "premier league",
      "météo",
      "weather",
      "weather forecast",
      "prévisions météo",
      "convertisseur",
      "converter",
      "traduction",
      "translation",
      "translate",
      "recipes",
      "recettes rapides",
      "quick recipes",
      "recettes faciles",
      "easy recipes",
      "healthy recipes",
      "recettes santé",
      "cooking tips",
      "conseils cuisine",
      "coronavirus",
      "covid news",
      "pandemic news",
      "vaccination",
      "medical research",
      "recherche médicale",
      "job market",
      "marché emploi",
      "remote work",
      "télétravail",
      "real estate",
      "immobilier",
      "housing market",
      "marché immobilier",
      "inflation",
      "interest rates",
      "taux d'intérêt",
      "recession",
      "récession",
      "energy crisis",
      "crise énergétique",
      "renewable energy",
      "énergies renouvelables",
      "solar power",
      "wind power",
      "nuclear energy",
      "énergie nucléaire",
      "cybersecurity",
      "cybersécurité",
      "data privacy",
      "vie privée",
      "quantum computing",
      "informatique quantique",
      "5g network",
      "réseau 5g",
      "autonomous vehicles",
      "véhicules autonomes",
      "robotics",
      "robotique",
      "biotechnology",
      "biotechnologie",
      "gene therapy",
      "thérapie génique",
      "space exploration",
      "exploration spatiale",
      "mars mission",
      "mission mars",
      "satellite news",
      "natural disasters",
      "catastrophes naturelles",
      "earthquake",
      "tremblement de terre",
      "hurricane",
      "ouragan",
      "wildfire",
      "incendie",
      "flooding",
      "inondations",
      "drought",
      "sécheresse",
      "immigration",
      "refugees",
      "réfugiés",
      "human rights",
      "droits de l'homme",
      "social justice",
      "justice sociale",
      "inequality",
      "inégalités",
      "poverty",
      "pauvreté",
      "hunger",
      "faim dans le monde",
      "water crisis",
      "crise de l'eau",
      "biodiversity",
      "biodiversité",
      "endangered species",
      "espèces menacées",
      "deforestation",
      "déforestation",
      "ocean pollution",
      "pollution océans"
    ];

    this.popularSites = [
      "google.com",
      "youtube.com",
      "facebook.com",
      "lemonde.fr",
      "lefigaro.fr",
      "bfmtv.com",
      "franceinfo.fr",
      "ouest-france.fr",
      "20minutes.fr",
      "allocine.fr",
      "senscritique.com",
      "deezer.com",
      "spotify.com",
      "sfr.fr",
      "orange.fr",
      "laposte.fr",
      "impots.gouv.fr",
      "service-public.fr",
      "ameli.fr",
      "sncf.com",
      "reddit.com",
      "twitter.com",
      "x.com",
      "instagram.com",
      "tiktok.com",
      "github.com",
      "stackoverflow.com",
      "wikipedia.org",
      "imdb.com",
      "amazon.com",
      "bing.com",
      "yahoo.com",
      "cnn.com",
      "bbc.com",
      "nytimes.com",
      "washingtonpost.com",
      "bloomberg.com",
      "forbes.com"
    ];

    this.googleCache = new Map();
  }

  async getGoogleSuggestions(query) {
    if (!query) return [];

    if (this.googleCache.has(query)) {
      return this.googleCache.get(query);
    }

    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();
      const suggestions = data[1] || [];

      this.googleCache.set(query, suggestions);

      return suggestions;
    } catch (error) {
      console.error('Error fetching Google suggestions:', error);
      return [];
    }
  }

  hasGoogleResultsForPrefix(query) {
    if (query.length < 2) return false;

    const prefix = query.substring(0, 2).toLowerCase();

    if (this.googleCache.has(prefix)) {
      const results = this.googleCache.get(prefix);
      return results && results.length > 0;
    }

    return false;
  }

  async getSuggestions(query) {
    if (!query || query.length < 2) return [];

    if (query.length === 2) {
      const q = query.toLowerCase();
      const priorityMatches = this.prioritySuggestions.filter(s => s.toLowerCase().includes(q));
      const siteMatches = this.popularSites.filter(s => s.toLowerCase().includes(q));
      const googleSuggestions = await this.getGoogleSuggestions(query);

      const merged = [...priorityMatches, ...siteMatches, ...googleSuggestions];
      const unique = [...new Set(merged)];
      return unique.slice(0, 8);
    }

    if (!this.hasGoogleResultsForPrefix(query)) {
      return [];
    }

    const q = query.toLowerCase();
    const priorityMatches = this.prioritySuggestions.filter(s => s.toLowerCase().includes(q));
    const siteMatches = this.popularSites.filter(s => s.toLowerCase().includes(q));
    const googleSuggestions = await this.getGoogleSuggestions(query);

    const merged = [...priorityMatches, ...siteMatches, ...googleSuggestions];
    const unique = [...new Set(merged)];

    return unique.slice(0, 8);
  }
}
