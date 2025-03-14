from pydantic import BaseModel

import openai

class Bookmark(BaseModel):
    @staticmethod
    def sort_bookmarks_by_relevance(api_key, bookmarks):
        openai.api_key = api_key

        # Kombiniere URLs und Titel
        inputs = [f"URL: {b[3]} Title: {b[4]}" for b in bookmarks]

        response = openai.Completion.create(
            model="text-davinci-003",
            prompt="Sort the following bookmarks by relevance:\n" + "\n".join(inputs),
            max_tokens=500
        )

        sorted_indices = response.choices[0].text.strip().split('\n')
        sorted_bookmarks = [bookmarks[int(idx)] for idx in sorted_indices if idx.isdigit()]
        return sorted_bookmarks

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
    