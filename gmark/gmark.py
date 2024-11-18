from bs4 import BeautifulSoup
import sqlite3
from typing import Generator
import requests
from gmark.bookmark import Bookmark

class GMark:
    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()

    def close(self):
        self.coursor.close()
        self.conn.close()

    @staticmethod
    def mozilla(filepath: str) -> Generator[Bookmark, None, None] | None:
        soup = None
        with open(filepath, 'r', encoding='utf-8') as file:
            soup = BeautifulSoup(file, 'html.parser')

        if soup is None:
            return None
        
        bookmarks = soup.find_all('a')
        for bookmark in bookmarks:
            gmark = Bookmark.get(bookmark.get('href'))
            if gmark is None:
                continue
            
            yield gmark

    def sync_to_server(self, local_db_path, server_url):
 
        self.cursor.execute("SELECT * FROM bookmarks")
        bookmarks = self.cursor.fetchall()

        response = requests.post(f"{server_url}/sync", json={"bookmarks": bookmarks})
        if response.status_code == 200:
            print("Sync erfolgreich!")
