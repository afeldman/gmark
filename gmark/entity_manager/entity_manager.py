import sqlite3
import os

# Get SQLite path from environment variables
db_path = os.getenv("DATABASE_PATH", "gmark.db")

# Create a SQLite connection
client = sqlite3.connect(db_path, check_same_thread=False)

# Create the entity manager
class EntityManager:
    def __init__(self, client):
        self.client = client
        self.db = db_path
        self._init_tables()

    def _init_tables(self):
        """Initialize database tables if they don't exist"""
        cursor = self.client.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Bookmark folders table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookmark_folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                parent_id INTEGER,
                full_path TEXT NOT NULL,
                created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                modified_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, full_path),
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        # Bookmarks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                url TEXT NOT NULL,
                title TEXT,
                description TEXT,
                folder_id INTEGER,
                created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                modified_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(folder_id) REFERENCES bookmark_folders(id) ON DELETE SET NULL
            )
        ''')
        
        # Active sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS active_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        self.client.commit()

    def get_collection(self, collection_name):
        """For compatibility - returns a table cursor wrapper"""
        class SQLiteTable:
            def __init__(self, conn, table_name):
                self.conn = conn
                self.table_name = table_name
            
            def insert_one(self, data):
                cols = ', '.join(data.keys())
                vals = ', '.join(['?' for _ in data])
                query = f"INSERT INTO {self.table_name} ({cols}) VALUES ({vals})"
                cursor = self.conn.cursor()
                cursor.execute(query, list(data.values()))
                self.conn.commit()
                return cursor.lastrowid
            
            def find_one(self, query):
                # Simple key=value query support
                where = ' AND '.join([f"{k}=?" for k in query.keys()])
                sql = f"SELECT * FROM {self.table_name} WHERE {where}"
                cursor = self.conn.cursor()
                cursor.execute(sql, list(query.values()))
                row = cursor.fetchone()
                if row:
                    cols = [desc[0] for desc in cursor.description]
                    return dict(zip(cols, row))
                return None
            
            def find(self, query):
                where = ' AND '.join([f"{k}=?" for k in query.keys()])
                sql = f"SELECT * FROM {self.table_name} WHERE {where}"
                cursor = self.conn.cursor()
                cursor.execute(sql, list(query.values()))
                cols = [desc[0] for desc in cursor.description]
                for row in cursor.fetchall():
                    yield dict(zip(cols, row))
            
            def update_one(self, query, update):
                where = ' AND '.join([f"{k}=?" for k in query.keys()])
                updates = ', '.join([f"{k}=?" for k in update.keys()])
                sql = f"UPDATE {self.table_name} SET {updates} WHERE {where}"
                cursor = self.conn.cursor()
                cursor.execute(sql, list(update.values()) + list(query.values()))
                self.conn.commit()
            
            def delete_one(self, query):
                where = ' AND '.join([f"{k}=?" for k in query.keys()])
                sql = f"DELETE FROM {self.table_name} WHERE {where}"
                cursor = self.conn.cursor()
                cursor.execute(sql, list(query.values()))
                self.conn.commit()
        
        return SQLiteTable(self.client, collection_name)

# Instantiate the entity manager
entity_manager = EntityManager(client)
