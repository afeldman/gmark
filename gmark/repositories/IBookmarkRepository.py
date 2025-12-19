from abc import ABC, abstractmethod
from typing import List, Optional
from DTOs.Bookmark import Bookmark, BookmarkCreate
from DTOs.BookmarkFolder import BookmarkFolder, BookmarkFolderTree

class IBookmarkRepository(ABC):
    """Interface for bookmark repository operations"""
    
    @abstractmethod
    def create_bookmark(self, user_id: int, bookmark: BookmarkCreate, folder_id: Optional[int] = None) -> int:
        """Create a new bookmark and return its ID"""
        pass
    
    @abstractmethod
    def get_bookmark(self, bookmark_id: int) -> Optional[Bookmark]:
        """Get a bookmark by ID"""
        pass
    
    @abstractmethod
    def get_user_bookmarks(self, user_id: int, folder_id: Optional[int] = None) -> List[Bookmark]:
        """Get all bookmarks for a user, optionally filtered by folder"""
        pass
    
    @abstractmethod
    def update_bookmark(self, bookmark_id: int, **kwargs) -> bool:
        """Update bookmark fields"""
        pass
    
    @abstractmethod
    def delete_bookmark(self, bookmark_id: int) -> bool:
        """Delete a bookmark"""
        pass
    
    @abstractmethod
    def move_bookmark(self, bookmark_id: int, folder_id: int) -> bool:
        """Move a bookmark to a different folder"""
        pass
    
    @abstractmethod
    def search_bookmarks(self, user_id: int, query: str) -> List[Bookmark]:
        """Search bookmarks by title, description, or URL"""
        pass
    
    # Folder operations
    @abstractmethod
    def create_folder(self, user_id: int, name: str, parent_id: Optional[int] = None) -> int:
        """Create a new folder and return its ID"""
        pass
    
    @abstractmethod
    def get_folder_by_path(self, user_id: int, path: str) -> Optional[BookmarkFolder]:
        """Get a folder by its full path"""
        pass
    
    @abstractmethod
    def get_folder_tree(self, user_id: int, parent_id: Optional[int] = None) -> List[BookmarkFolderTree]:
        """Get folder hierarchy as a tree"""
        pass
    
    @abstractmethod
    def delete_folder(self, folder_id: int) -> bool:
        """Delete a folder"""
        pass
    
    @abstractmethod
    def add_keyword_to_bookmark(self, bookmark_id: int, keyword: str, ranking: int = 1) -> bool:
        """Add a keyword to a bookmark"""
        pass
    
    @abstractmethod
    def get_bookmark_keywords(self, bookmark_id: int) -> List[str]:
        """Get all keywords for a bookmark"""
        pass
