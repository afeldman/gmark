from pydantic import BaseModel
from bs4 import BeautifulSoup
import requests
from decouple import config

import openai
from datetime import datetime, timezone

class Bookmark(BaseModel):
    user_id: int = -1
    url: str
    title: str
    description: str
    keywords: list[str]
    access_time: datetime = datetime.now(tz=timezone.utc)
    modified_time: datetime = datetime.now(tz=timezone.utc)
    changed_time: datetime = datetime.now(tz=timezone.utc)
    mode: str='user_mode'


    @staticmethod
    def get(url: str, api_key:str = config('OPENAI_KEY', '')) -> 'Bookmark' | None:
        response = requests.get(url)
        if response.status_code == 200:
            content = response.text

            if api_key != '':
                keywords, summary = Bookmark.classify(api_key=api_key, url=url) 

            return Bookmark(
                url=url,
                title=Bookmark.get_title(content),
                keywords=keywords or [],
                description=summary or ''
            )
        else:
            return None

    @staticmethod
    def get_title(content: str) -> str:
        soup = BeautifulSoup(content, 'html.parser')
        title_tag = soup.find('title')
        return title_tag.text
    
    @staticmethod
    def classify(api_key: str, url: str) -> str:
        openai.api_key = api_key
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=f"Classify this URL into 5 keywords and summarize it: {url}",
            max_tokens=150
        )
        keywords = response.choices[0].text.strip().split(',')
        return keywords[:5], "Summary: " + response.choices[0].text.strip()
    