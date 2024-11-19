import sqlite3
import requests

class GMark:
    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()

    def close(self):
        self.coursor.close()
        self.conn.close()


    def sync_to_server(self, local_db_path, server_url):
 
        self.cursor.execute("SELECT * FROM bookmarks")
        bookmarks = self.cursor.fetchall()

        response = requests.post(f"{server_url}/sync", json={"bookmarks": bookmarks})
        if response.status_code == 200:
            print("Sync erfolgreich!")
