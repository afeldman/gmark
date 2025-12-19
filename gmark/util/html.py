from typing import Generator, List
from bs4 import BeautifulSoup
import httpx 
from loguru import logger
    
def response_fn(data: httpx.Response):

    match data.status_code:
        case 200:
            logger.debug(f'Fetched {data.url}')
            return str(data.content), str(data.url), data.status_code
        case 301 | 302 | 307 | 308: # redirection
            logger.debug(f'Redirect {data.url}')
            return str(data.history[-1]), str(data.url), data.status_code
        case 429: # too many requests
            logger.debug(f'to many requests {data.url}')
            return '', str(data.url), data.status_code
        case _:
            logger.debug(f'Error fetching {data.url}')
            return None

def fetch_html(url: str) -> tuple[str, str, int]:
    """Fetch HTML content from a single URL"""
    try:
        request = httpx.get(url, follow_redirects=True, timeout=10)
        response = response_fn(request)
        if response:
            return response
        return '', url, 500
    except Exception as e:
        logger.debug(f'Error fetching {url}: {e}')
        return '', url, 500

def fetch_htmls_sync(urls: List[str]) -> Generator[tuple[str, str, int], None, None]:
    """Fetch HTML content from multiple URLs synchronously"""
    for url in urls:
        try:
            request = httpx.get(url, follow_redirects=True, timeout=10)
            response = response_fn(request)
            if response:
                yield response
        except Exception:
            logger.debug(f'Error fetching {url}')
            continue

def extract_title(content: str) -> str:
    """Extract title from HTML content"""
    try:
        soup = BeautifulSoup(content, 'html.parser')
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.text.strip()
        return "Untitled"
    except Exception as e:
        logger.debug(f'Error extracting title: {e}')
        return "Untitled"

def get_title(content: str) -> str:
    """Alias for extract_title"""
    return extract_title(content)

def get_hyperlink(content: str) -> Generator[str, None, None]:
    """Extract all hyperlinks from HTML content"""
    try:
        soup = BeautifulSoup(content, 'html.parser')
        a_tags = soup.find_all('a')
        for hyperlink in a_tags:
            href = hyperlink.get('href')
            if href:
                yield href
    except Exception as e:
        logger.debug(f'Error extracting hyperlinks: {e}')

if __name__ == "__main__":
    with open(r'd:/code/gmark/assets/favorites_19.11.24.html', 'r', encoding='utf-8', errors='ignore') as file:
        soup = BeautifulSoup(file, 'html.parser')
    
    links = list( fetch_htmls_sync(list(get_hyperlink(soup.prettify()))))

    contents = asyncio.run(fetch_htmls(links))
    pass
    