from repositories.BookmarkRepository import BookmarkRepository
from DTOs.Bookmark import Bookmark, BookmarkCreate, BookmarkMove
from DTOs.BookmarkFolder import BookmarkFolder, BookmarkFolderCreate, BookmarkFolderTree
from bookmark import AIClassifier
from util.html import fetch_html, extract_title
from typing import List, Optional, Tuple
from loguru import logger
from decouple import config
import hashlib


class BookmarkService:
    def __init__(self, db_path: str = "gmark.db"):
        self.repository = BookmarkRepository(db_path)
    
    def create_bookmark_with_classification(
        self,
        user_id: int,
        bookmark_create: BookmarkCreate,
        openai_api_key: Optional[str] = None,
        anythingllm_endpoint: Optional[str] = None,
        anythingllm_api_key: Optional[str] = None,
        prefer_local: bool = True
    ) -> Tuple[int, Optional[str]]:
        """
        Create a bookmark with AI classification
        
        Returns: (bookmark_id, suggested_folder_path or None if auto_classify=False)
        """
        # Fetch URL content
        try:
            html_content = fetch_html(bookmark_create.url)
            
            # Extract title if not provided
            if not bookmark_create.title:
                bookmark_create.title = extract_title(html_content) or bookmark_create.url
        except Exception as e:
            logger.warning(f"Could not fetch URL content: {e}")
            html_content = ""
            if not bookmark_create.title:
                bookmark_create.title = bookmark_create.url
        
        suggested_folder_path = None
        keywords = []
        
        # AI Classification if enabled
        if bookmark_create.auto_classify:
            try:
                keywords, summary, suggested_folder_path = AIClassifier.classify(
                    url=bookmark_create.url,
                    title=bookmark_create.title,
                    content=html_content,
                    openai_api_key=openai_api_key or config("OPENAI_API_KEY", default=None),
                    anythingllm_endpoint=anythingllm_endpoint or config("ANYTHINGLLM_ENDPOINT", default="http://localhost:3001/api/chat"),
                    anythingllm_api_key=anythingllm_api_key or config("ANYTHINGLLM_API_KEY", default=None),
                    prefer_local=prefer_local
                )
                
                # Use AI summary if no description provided
                if not bookmark_create.description and summary:
                    bookmark_create.description = summary
                
                logger.info(f"AI classified bookmark: keywords={keywords}, folder={suggested_folder_path}")
                
            except Exception as e:
                logger.error(f"AI classification failed: {e}")
                suggested_folder_path = "/unsorted"
        
        # Get or create folder
        folder_id = None
        folder_path = bookmark_create.folder_path or suggested_folder_path or "/unsorted"
        
        folder = self.repository.get_folder_by_path(user_id, folder_path)
        if not folder:
            # Create folder hierarchy
            folder_id = self._create_folder_hierarchy(user_id, folder_path)
        else:
            folder_id = folder.id
        
        # Create bookmark
        bookmark_id = self.repository.create_bookmark(user_id, bookmark_create, folder_id)
        
        if bookmark_id > 0:
            # Add keywords
            for idx, keyword in enumerate(keywords[:5], start=1):
                self.repository.add_keyword_to_bookmark(bookmark_id, keyword, ranking=6-idx)
        
        return bookmark_id, suggested_folder_path
    
    def _create_folder_hierarchy(self, user_id: int, path: str) -> int:
        """
        Create folder hierarchy from path like /tech/javascript/frameworks
        Returns the ID of the deepest folder
        """
        if not path or path == "/":
            return None
        
        parts = [p for p in path.split('/') if p]
        
        parent_id = None
        current_path = ""
        
        for part in parts:
            current_path += f"/{part}"
            
            # Check if folder exists
            folder = self.repository.get_folder_by_path(user_id, current_path)
            
            if folder:
                parent_id = folder.id
            else:
                # Create folder
                parent_id = self.repository.create_folder(user_id, part, parent_id)
        
        return parent_id
    
    def create_folder(self, user_id: int, folder_create: BookmarkFolderCreate) -> int:
        """Create a new folder"""
        # Parse parent path to get parent_id
        parent_id = None
        
        if folder_create.parent_path:
            parent_folder = self.repository.get_folder_by_path(user_id, folder_create.parent_path)
            if parent_folder:
                parent_id = parent_folder.id
            else:
                # Create parent hierarchy
                parent_id = self._create_folder_hierarchy(user_id, folder_create.parent_path)
        
        return self.repository.create_folder(user_id, folder_create.name, parent_id)
    
    def get_folder_tree(self, user_id: int) -> List[BookmarkFolderTree]:
        """Get complete folder tree for user"""
        return self.repository.get_folder_tree(user_id)
    
    def get_folder_by_path(self, user_id: int, path: str) -> Optional[BookmarkFolder]:
        """Get folder by path"""
        return self.repository.get_folder_by_path(user_id, path)
    
    def move_bookmark(self, bookmark_id: int, folder_path: str, user_id: int) -> bool:
        """Move bookmark to a different folder"""
        folder = self.repository.get_folder_by_path(user_id, folder_path)
        
        if not folder:
            # Create folder if it doesn't exist
            folder_id = self._create_folder_hierarchy(user_id, folder_path)
        else:
            folder_id = folder.id
        
        return self.repository.move_bookmark(bookmark_id, folder_id)
    
    def get_bookmarks_in_folder(self, user_id: int, folder_path: str) -> List[Bookmark]:
        """Get all bookmarks in a specific folder"""
        folder = self.repository.get_folder_by_path(user_id, folder_path)
        
        if not folder:
            return []
        
        return self.repository.get_user_bookmarks(user_id, folder.id)
    
    def get_all_bookmarks(self, user_id: int) -> List[Bookmark]:
        """Get all bookmarks for a user"""
        return self.repository.get_user_bookmarks(user_id)
    
    def search_bookmarks(self, user_id: int, query: str) -> List[Bookmark]:
        """Search bookmarks"""
        return self.repository.search_bookmarks(user_id, query)
    
    def delete_bookmark(self, bookmark_id: int) -> bool:
        """Delete a bookmark"""
        return self.repository.delete_bookmark(bookmark_id)
    
    def delete_folder(self, folder_id: int) -> bool:
        """Delete a folder"""
        return self.repository.delete_folder(folder_id)
    
    def update_bookmark(self, bookmark_id: int, **kwargs) -> bool:
        """Update bookmark fields"""
        return self.repository.update_bookmark(bookmark_id, **kwargs)
    
    def generate_bookmark_hash(self, url: str) -> str:
        """Generate a hash for duplicate detection"""
        return hashlib.sha256(url.encode()).hexdigest()
