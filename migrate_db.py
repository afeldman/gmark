#!/usr/bin/env python3
"""
Database migration script for GMARK bookmark folders feature.
Run this to add the bookmark_folders table to an existing database.
"""

import sqlite3
import sys
from pathlib import Path


def migrate_database(db_path: str = "gmark.db"):
    """Add bookmark_folders table and update bookmarks table"""
    
    print(f"🔄 Migrating database: {db_path}")
    
    if not Path(db_path).exists():
        print(f"❌ Database not found: {db_path}")
        print("Creating new database from schema...")
        create_fresh_db(db_path)
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if migration is needed
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmark_folders'")
        if cursor.fetchone():
            print("✅ bookmark_folders table already exists. No migration needed.")
            conn.close()
            return
        
        print("📝 Creating bookmark_folders table...")
        cursor.execute('''
            CREATE TABLE bookmark_folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                parent_id INTEGER,
                full_path TEXT NOT NULL,
                created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                modified_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (parent_id) REFERENCES bookmark_folders(id) ON DELETE CASCADE,
                UNIQUE(user_id, full_path)
            )
        ''')
        
        print("📝 Adding folder_id column to bookmarks table...")
        # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        cursor.execute('''
            CREATE TABLE bookmarks_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                folder_id INTEGER,
                url TEXT NOT NULL UNIQUE,
                title TEXT,
                hash TEXT UNIQUE,
                description TEXT,
                access_time DATETIME,
                modified_time DATETIME,
                changed_time DATETIME,
                mode TEXT CHECK(mode IN ("user_mode", "team_mode", "public_mode")),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (folder_id) REFERENCES bookmark_folders(id) ON DELETE SET NULL
            )
        ''')
        
        # Copy data from old table
        print("📦 Migrating existing bookmarks...")
        cursor.execute('''
            INSERT INTO bookmarks_new 
            (id, user_id, url, title, hash, description, access_time, modified_time, changed_time, mode)
            SELECT id, user_id, url, title, hash, description, access_time, modified_time, changed_time, mode
            FROM bookmarks
        ''')
        
        # Drop old table and rename new one
        cursor.execute('DROP TABLE bookmarks')
        cursor.execute('ALTER TABLE bookmarks_new RENAME TO bookmarks')
        
        print("📂 Creating default folders...")
        # Get all users
        cursor.execute('SELECT DISTINCT id FROM users')
        users = cursor.fetchall()
        
        for (user_id,) in users:
            # Create default folders for each user
            default_folders = [
                (user_id, "tech", None, "/tech"),
                (user_id, "personal", None, "/personal"),
                (user_id, "work", None, "/work"),
                (user_id, "unsorted", None, "/unsorted")
            ]
            
            cursor.executemany('''
                INSERT INTO bookmark_folders (user_id, name, parent_id, full_path)
                VALUES (?, ?, ?, ?)
            ''', default_folders)
            
            print(f"  ✅ Created default folders for user {user_id}")
        
        # Move all existing bookmarks to /unsorted
        cursor.execute('''
            UPDATE bookmarks 
            SET folder_id = (
                SELECT id FROM bookmark_folders 
                WHERE full_path = '/unsorted' AND user_id = bookmarks.user_id
                LIMIT 1
            )
        ''')
        
        conn.commit()
        print("✅ Migration completed successfully!")
        print(f"📊 Bookmarks moved to /unsorted folder for manual organization")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        sys.exit(1)
    finally:
        conn.close()


def create_fresh_db(db_path: str):
    """Create a fresh database from schema file"""
    schema_path = Path(__file__).parent / "assets" / "data.sql"
    
    if not schema_path.exists():
        print(f"❌ Schema file not found: {schema_path}")
        sys.exit(1)
    
    print(f"📝 Creating database from {schema_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    with open(schema_path, 'r') as f:
        schema_sql = f.read()
        cursor.executescript(schema_sql)
    
    conn.commit()
    conn.close()
    
    print("✅ Database created successfully!")


if __name__ == "__main__":
    db_path = sys.argv[1] if len(sys.argv) > 1 else "gmark.db"
    migrate_database(db_path)
