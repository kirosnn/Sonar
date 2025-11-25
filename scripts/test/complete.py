import requests

# --------------------------------------------
# 1️⃣ LISTE PRIORITAIRE (intentions intelligentes FR + EN)
# --------------------------------------------
PRIORITY_SUGGESTIONS = [
    # Actu générale
    "dernières actualités",
    "latest news",
    "actualité france",
    "world news",
    "breaking news",

    # IA
    "chatgpt",
    "ia nouveautés",
    "ai news",
    "ai tools",

    # Tech
    "nouveautés tech",
    "tech news",
    "latest smartphones",
    "comparatif pc",
    "meilleurs laptops",

    # Culture / divertissement
    "sorties cinéma",
    "new movies",
    "top séries",
    "netflix nouveautés",
    "new games",
    "sorties jeux video",

    # Pratique
    "météo",
    "weather",
    "convertisseur",
    "traduction",
    "recipes",
    "recettes rapides",
]


# --------------------------------------------
# 2️⃣ LISTE DES SITES (très complète FR + EN)
# --------------------------------------------
POPULAR_SITES = [
    # FR
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

    # EN / global
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
    "forbes.com",
]


# --------------------------------------------
# 3️⃣ GOOGLE SUGGEST
# --------------------------------------------
def get_google_suggestions(query: str):
    if not query:
        return []

    url = "https://suggestqueries.google.com/complete/search"
    params = {
        "client": "firefox",
        "q": query
    }

    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json()

    return data[1] if len(data) > 1 else []


# --------------------------------------------
# 4️⃣ LOGIQUE DE FUSION + LIMITE 8
# --------------------------------------------
def get_suggestions(query: str):
    if not query:
        return []

    q = query.lower()

    # PRIORITAIRES qui matchent
    pri = [s for s in PRIORITY_SUGGESTIONS if q in s.lower()]

    # SITES qui matchent
    site = [s for s in POPULAR_SITES if q in s.lower()]

    # GOOGLE
    google = get_google_suggestions(query)

    # FUSION dans l’ordre
    merged = pri + site + google

    # DÉDUPLICATION en gardant l'ordre
    unique = list(dict.fromkeys(merged))

    # LIMITER À 8
    return unique[:8]


# --------------------------------------------
# 5️⃣ TEST TERMINAL
# --------------------------------------------
if __name__ == "__main__":
    while True:
        q = input("\nRecherche : ")
        for s in get_suggestions(q):
            print(" -", s)
