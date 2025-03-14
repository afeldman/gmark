from typing import Generator, List
from bs4 import BeautifulSoup
import asyncio
import httpx 
from unparallel import up
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

async def fetch_htmls(urls: List[str]) -> List[str]:
    return await up(urls=urls, response_fn=lambda response: response_fn(response))

def fetch_htmls_sync(urls: List[str]) -> Generator[httpx.Response, None, None]:
    for url in urls:
        try:
            request = httpx.get(url,follow_redirects=True, timeout=10)
            response = response_fn(request)
            if response:
                yield response
        except Exception:
            logger.debug(f'Error fetching {url}')
            continue

def get_title(content: str) -> str:
    soup = BeautifulSoup(content, 'html.parser')
    title_tag = soup.find('title')
    return title_tag.text

def get_hyperlink(content: str) -> Generator[str, None, None]:
    soup = BeautifulSoup(content, 'html.parser')
    a_tags = soup.find_all('a')
    for hyperlink in a_tags:
        yield hyperlink.get('href')

if __name__ == "__main__":
    with open(r'd:/code/gmark/assets/favorites_19.11.24.html', 'r', encoding='utf-8', errors='ignore') as file:
        soup = BeautifulSoup(file, 'html.parser')
    
    links = list( fetch_htmls_sync(list(get_hyperlink(soup.prettify()))))

    contents = asyncio.run(fetch_htmls(links))
    pass
    