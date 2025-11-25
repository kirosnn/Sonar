import json
import sys
import time
import socket
from typing import Dict, List, Tuple
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from concurrent.futures import ThreadPoolExecutor, as_completed
from colorama import init, Fore, Style

init(autoreset=True)

TIMEOUT = 10
MAX_WORKERS = 20
RETRY_ATTEMPTS = 3

REMOVABLE_STATUS = {404, 410, 451}


def create_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=RETRY_ATTEMPTS,
        connect=3,
        read=3,
        backoff_factor=0.6,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=200, pool_maxsize=200)

    session.mount("http://", adapter)
    session.mount("https://", adapter)

    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        )
    })
    return session


def domain_exists(domain: str) -> bool:
    try:
        socket.gethostbyname(domain)
        return True
    except socket.gaierror:
        return False


def check_site(domain: str, title: str, session: requests.Session) -> Tuple[str, str, bool, str, int, bool]:
    if not domain_exists(domain):
        return (domain, title, False, "DNS Not Found", 0, True)

    protocols = ["https", "http"]
    extra_hosts = ["", "www."]

    for prefix in extra_hosts:
        for protocol in protocols:
            url = f"{protocol}://{prefix}{domain}"
            try:
                response = session.get(url, timeout=TIMEOUT, allow_redirects=True)
                code = response.status_code

                if code in REMOVABLE_STATUS:
                    return (domain, title, False, f"{code} DEAD", code, True)

                if code < 400:
                    return (domain, title, True, f"OK {code}", code, False)

                if protocol == "http":
                    return (domain, title, False, f"HTTP {code}", code, False)

            except Exception as e:
                last_error = type(e).__name__

    return (domain, title, False, last_error, 0, False)


def load_sites(filepath: str) -> List[Dict]:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(Fore.RED + f"Erreur chargement JSON: {e}")
        sys.exit(1)


def print_progress_bar(current: int, total: int, length: int = 50):
    percent = current / total
    filled = int(length * percent)
    bar = "█" * filled + "-" * (length - filled)
    print(f"\r{Fore.CYAN}Progression: |{bar}| {current}/{total} ({percent*100:.1f}%)", end="", flush=True)


def save_json(filepath: str, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def main():
    FILE = "./src/data/popular-sites.json"
    sites = load_sites(FILE)
    session = create_session()

    print(Fore.YELLOW + f"Total sites: {len(sites)}\n")

    new_list = []
    removed = []

    start = time.time()
    completed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(check_site, site["domain"], site["title"], session): site
            for site in sites
        }

        for future in as_completed(futures):
            domain, title, ok, msg, status_code, should_delete = future.result()
            site = futures[future]

            if should_delete:
                removed.append({ "domain": domain, "title": title, "reason": msg })
            else:
                new_list.append(site)

            completed += 1
            print_progress_bar(completed, len(sites))

    print("\n")

    elapsed = time.time() - start
    print(Fore.YELLOW + f"\nAnalyse terminée en {elapsed:.2f}s\n")

    print(Fore.GREEN + f"Sites restants: {len(new_list)}")
    print(Fore.RED + f"Sites supprimés: {len(removed)}\n")

    save_json(FILE, new_list)

    save_json("site_verification_report.json", {
        "removed": removed,
        "remaining_count": len(new_list),
        "removed_count": len(removed),
        "execution_time": elapsed
    })

    print(Fore.CYAN + "Suppression appliquée et rapport enregistré.\n")

    sys.exit(1 if removed else 0)


if __name__ == "__main__":
    main()
