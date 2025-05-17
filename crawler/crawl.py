import time
import json
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup  # Beautiful Soup for HTML parsing :contentReference[oaicite:6]{index=6}

def crawl_gcash_help(start_url, max_pages=500, delay=1.0):
    domain = urlparse(start_url).netloc
    visited = set()
    queue = [start_url]
    results = []

    while queue and len(results) < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        # Fetch page
        resp = requests.get(url)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")  # parse with default HTML parser :contentReference[oaicite:7]{index=7}

        # Extract title
        title_tag = soup.find("h1")
        title = title_tag.get_text(strip=True) if title_tag else "No title"

        # Extract article body paragraphs
        body = soup.find("div", class_="article-body")
        paragraphs = body.find_all("p") if body else []
        content = "\n".join(p.get_text(strip=True) for p in paragraphs)

        # Extract Related Articles links
        related = []
        rel_sec = soup.find("section", class_="related-articles")
        if rel_sec:
            for a in rel_sec.find_all("a", href=True):
                related.append(urljoin(start_url, a["href"]))

        # Record this page
        results.append({
            "page_number": len(results) + 1,
            "url": url,
            "title": title,
            "content": content,
            "related_links": related
        })

        # Enqueue new article links under the same domain
        for a in soup.find_all("a", href=True):
            href = urljoin(start_url, a["href"])
            parsed = urlparse(href)
            if parsed.netloc == domain and "/hc/en-us/articles/" in parsed.path and href not in visited:
                queue.append(href)

        time.sleep(delay)  # polite 1 s delay between requests :contentReference[oaicite:8]{index=8}

    return results

if __name__ == "__main__":
    seed = "https://help.gcash.com/"
    data = crawl_gcash_help(seed)
    with open("gcash_help_articles.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Crawled {len(data)} pages.")
