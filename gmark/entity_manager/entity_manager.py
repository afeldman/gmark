import sqlite3
from decouple import config

# Get MongoDB credentials from environment variables
db_uri = config("SQLITE_URI", "gmark.db")
db = config("DATABASE")

# Create a MongoDB client
client = sqlite3.connect(db_uri)

# Create the entity manager
class EntityManager:
    def __init__(self, client, database):
        self.client = client
        self.db = database

    def get_collection(self, collection_name):
        return self.client.get_database(self.db).get_collection(collection_name)

# Instantiate the entity manager
entity_manager = EntityManager(client, db)
