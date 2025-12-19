from repositories.IBookmarkRepository import IBookmarkRepository
from DTOs.Bookmark import Bookmark, BookmarkCreate
from DTOs.BookmarkFolder import BookmarkFolder, BookmarkFolderTree
from typing import List, Optional
import sqlite3
from datetime import datetime, timezone
from loguru import logger


class BookmarkRepository(IBookmarkRepository):
    def __init__(self, db_path: str = "gmark.db"):
        self.db_path = db_path
    
    def _get_connection(self):
        """Get a database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def create_bookmark(self, user_id: int, bookmark: BookmarkCreate, folder_id: Optional[int] = None) -> int:
        """Create a new bookmark and return its ID"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            now = datetime.now(tz=timezone.utc)
            
            cursor.execute('''
                INSERT INTO bookmarks (user_id, folder_id, url, title, description, 
                                      access_time, modified_time, changed_time, mode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, folder_id, bookmark.url, bookmark.title or "", 
                  bookmark.description or "", now, now, now, 'user_mode'))
            
            bookmark_id = cursor.lastrowid
            conn.commit()
            return bookmark_id
            
        except sqlite3.IntegrityError as e:
            logger.error(f"Failed to create bookmark: {e}")
            conn.rollback()
            return -1
        finally:
            conn.close()
    
    def get_bookmark(self, bookmark_id: int) -> Optional[Bookmark]:
        """Get a bookmark by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM bookmarks WHERE id = ?', (bookmark_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            keywords = self.get_bookmark_keywords(bookmark_id)
            return Bookmark(
                user_id=row['user_id'],
                folder_id=row['folder_id'],
                url=row['url'],
                title=row['title'],
                description=row['description'],
                keywords=keywords,
                access_time=datetime.fromisoformat(row['access_time']),
                modified_time=datetime.fromisoformat(row['modified_time']),
                changed_time=datetime.fromisoformat(row['changed_time']),
                mode=row['mode']
            )
        return None
    
    def get_user_bookmarks(self, user_id: int, folder_id: Optional[int] = None) -> List[Bookmark]:
        """Get all bookmarks for a user, optionally filtered by folder"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        if folder_id is not None:
            cursor.execute('SELECT * FROM bookmarks WHERE user_id = ? AND folder_id = ?', 
                          (user_id, folder_id))
        else:
            cursor.execute('SELECT * FROM bookmarks WHERE user_id = ?', (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        bookmarks = []
        for row in rows:
            keywords = self.get_bookmark_keywords(row['id'])
            bookmarks.append(Bookmark(
                user_id=row['user_id'],
                folder_id=row['folder_id'],
                url=row['url'],
                title=row['title'],
                description=row['description'],
                keywords=keywords,
                access_time=datetime.fromisoformat(row['access_time']) if row['access_time'] else datetime.now(tz=timezone.utc),
                modified_time=datetime.fromisoformat(row['modified_time']) if row['modified_time'] else datetime.now(tz=timezone.utc),
                changed_time=datetime.fromisoformat(row['changed_time']) if row['changed_time'] else datetime.now(tz=timezone.utc),
                mode=row['mode']
            ))
        
        return bookmarks
    
    def update_bookmark(self, bookmark_id: int, **kwargs) -> bool:
        """Update bookmark fields"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        allowed_fields = ['title', 'description', 'folder_id', 'mode']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return False
        
        updates['modified_time'] = datetime.now(tz=timezone.utc)
        
        set_clause = ', '.join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [bookmark_id]
        
        cursor.execute(f'UPDATE bookmarks SET {set_clause} WHERE id = ?', values)
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def delete_bookmark(self, bookmark_id: int) -> bool:
        """Delete a bookmark"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Delete associated keywords first
        cursor.execute('DELETE FROM bookmark_keywords WHERE bookmark_id = ?', (bookmark_id,))
        cursor.execute('DELETE FROM bookmarks WHERE id = ?', (bookmark_id,))
        
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def move_bookmark(self, bookmark_id: int, folder_id: int) -> bool:
        """Move a bookmark to a different folder"""
        return self.update_bookmark(bookmark_id, folder_id=folder_id)
    
    def search_bookmarks(self, user_id: int, query: str) -> List[Bookmark]:
        """Search bookmarks by title, description, or URL"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        search_pattern = f'%{query}%'
        cursor.execute('''
            SELECT * FROM bookmarks 
            WHERE user_id = ? AND (
                title LIKE ? OR 
                description LIKE ? OR 
                url LIKE ?
            )
        ''', (user_id, search_pattern, search_pattern, search_pattern))
        
        rows = cursor.fetchall()
        conn.close()
        
        bookmarks = []
        for row in rows:
            keywords = self.get_bookmark_keywords(row['id'])
            bookmarks.append(Bookmark(
                user_id=row['user_id'],
                folder_id=row['folder_id'],
                url=row['url'],
                title=row['title'],
                description=row['description'],
                keywords=keywords,
                access_time=datetime.fromisoformat(row['access_time']) if row['access_time'] else datetime.now(tz=timezone.utc),
                modified_time=datetime.fromisoformat(row['modified_time']) if row['modified_time'] else datetime.now(tz=timezone.utc),
                changed_time=datetime.fromisoformat(row['changed_time']) if row['changed_time'] else datetime.now(tz=timezone.utc),
                mode=row['mode']
            ))
        
        return bookmarks
    
    # Folder operations
    def create_folder(self, user_id: int, name: str, parent_id: Optional[int] = None) -> int:
        """Create a new folder and return its ID"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Calculate full path
        if parent_id:
            cursor.execute('SELECT full_path FROM bookmark_folders WHERE id = ?', (parent_id,))
            parent_row = cursor.fetchone()
            if parent_row:
                full_path = f"{parent_row['full_path']}/{name}"
            else:
                conn.close()
                return -1
        else:
            full_path = f"/{name}"
        
        try:
            now = datetime.now(tz=timezone.utc)
            cursor.execute('''
                INSERT INTO bookmark_folders (user_id, name, parent_id, full_path, created_time, modified_time)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, name, parent_id, full_path, now, now))
            
            folder_id = cursor.lastrowid
            conn.commit()
            return folder_id
            
        except sqlite3.IntegrityError as e:
            logger.error(f"Failed to create folder: {e}")
            conn.rollback()
            return -1
        finally:
            conn.close()
    
    def get_folder_by_path(self, user_id: int, path: str) -> Optional[BookmarkFolder]:
        """Get a folder by its full path"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM bookmark_folders WHERE user_id = ? AND full_path = ?', 
                      (user_id, path))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return BookmarkFolder(
                id=row['id'],
                user_id=row['user_id'],
                name=row['name'],
                parent_id=row['parent_id'],
                full_path=row['full_path'],
                created_time=datetime.fromisoformat(row['created_time']),
                modified_time=datetime.fromisoformat(row['modified_time'])
            )
        return None
    
    def get_folder_tree(self, user_id: int, parent_id: Optional[int] = None) -> List[BookmarkFolderTree]:
        """Get folder hierarchy as a tree"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        if parent_id is None:
            cursor.execute('SELECT * FROM bookmark_folders WHERE user_id = ? AND parent_id IS NULL', (user_id,))
        else:
            cursor.execute('SELECT * FROM bookmark_folders WHERE user_id = ? AND parent_id = ?', 
                          (user_id, parent_id))
        
        rows = cursor.fetchall()
        
        tree = []
        for row in rows:
            # Count bookmarks in this folder
            cursor.execute('SELECT COUNT(*) as count FROM bookmarks WHERE folder_id = ?', (row['id'],))
            count_row = cursor.fetchone()
            bookmark_count = count_row['count'] if count_row else 0
            
            # Recursively get children
            children = self.get_folder_tree(user_id, row['id'])
            
            tree.append(BookmarkFolderTree(
                id=row['id'],
                name=row['name'],
                full_path=row['full_path'],
                children=children,
                bookmark_count=bookmark_count
            ))
        
        conn.close()
        return tree
    
    def delete_folder(self, folder_id: int) -> bool:
        """Delete a folder (CASCADE will handle children)"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM bookmark_folders WHERE id = ?', (folder_id,))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        
        return success
    
    def add_keyword_to_bookmark(self, bookmark_id: int, keyword: str, ranking: int = 1) -> bool:
        """Add a keyword to a bookmark"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Get or create keyword
        cursor.execute('SELECT id FROM keywords WHERE keyword = ?', (keyword,))
        keyword_row = cursor.fetchone()
        
        if keyword_row:
            keyword_id = keyword_row['id']
        else:
            cursor.execute('INSERT INTO keywords (keyword) VALUES (?)', (keyword,))
            keyword_id = cursor.lastrowid
        
        # Add to bookmark_keywords
        try:
            cursor.execute('''
                INSERT INTO bookmark_keywords (bookmark_id, keyword_id, ranking)
                VALUES (?, ?, ?)
            ''', (bookmark_id, keyword_id, ranking))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            conn.rollback()
            return False
        finally:
            conn.close()
    
    def get_bookmark_keywords(self, bookmark_id: int) -> List[str]:
        """Get all keywords for a bookmark"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT k.keyword FROM keywords k
            JOIN bookmark_keywords bk ON k.id = bk.keyword_id
            WHERE bk.bookmark_id = ?
            ORDER BY bk.ranking DESC
        ''', (bookmark_id,))
        
        keywords = [row['keyword'] for row in cursor.fetchall()]
        conn.close()
        
        return keywords
