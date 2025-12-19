from fastapi import HTTPException, Depends, Header
from services.BookmarkService import BookmarkService
from DTOs.Bookmark import BookmarkCreate, BookmarkMove
from DTOs.BookmarkFolder import BookmarkFolderCreate
from DTOs.CustomResponseMessage import CustomResponseMessage
from fastapi_utils.cbv import cbv
from fastapi_utils.inferring_router import InferringRouter
from services.UserService import UserService
from typing import Optional
from loguru import logger

bookmark_controller_router = InferringRouter()


@cbv(bookmark_controller_router)
class BookmarkController:
    def __init__(self):
        self.bookmarkService = BookmarkService()
        self.userService = UserService()
    
    def _get_user_id_from_token(self, token: str) -> int:
        """Extract user_id from token - simplified version"""
        # In production, decode JWT and get user_id
        # For now, we'll use a simplified approach
        try:
            import jwt
            from decouple import config
            
            payload = jwt.decode(token, config("SECRET_KEY"), algorithms=[config("ALGORITHM")])
            username = payload.get("sub")
            
            # Get user_id from username (you'd need to add this to UserRepository)
            # For now, return a placeholder
            return 1  # TODO: Implement proper user_id lookup
        except Exception as e:
            logger.error(f"Token decode error: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")
    
    # Bookmark operations
    @bookmark_controller_router.post("/bookmarks")
    def create_bookmark(
        self,
        bookmark: BookmarkCreate,
        token: str = Header(None),
        prefer_local_ai: bool = True
    ):
        """Create a new bookmark with optional AI classification"""
        try:
            if token is None:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_id = self._get_user_id_from_token(token)
            
            bookmark_id, suggested_path = self.bookmarkService.create_bookmark_with_classification(
                user_id=user_id,
                bookmark_create=bookmark,
                prefer_local=prefer_local_ai
            )
            
            if bookmark_id > 0:
                response_data = {
                    "bookmark_id": bookmark_id,
                    "message": "Bookmark created successfully"
                }
                
                if suggested_path:
                    response_data["suggested_folder"] = suggested_path
                
                return response_data
            else:
                raise HTTPException(status_code=400, detail="Failed to create bookmark")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Create bookmark error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @bookmark_controller_router.get("/bookmarks")
    def get_bookmarks(
        self,
        token: str = Header(None),
        folder_path: Optional[str] = None
    ):
        """Get all bookmarks, optionally filtered by folder path"""
        try:
            if token is None:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_id = self._get_user_id_from_token(token)
            
            if folder_path:
                bookmarks = self.bookmarkService.get_bookmarks_in_folder(user_id, folder_path)
            else:
                bookmarks = self.bookmarkService.get_all_bookmarks(user_id)
            
            return {"bookmarks": [b.dict() for b in bookmarks]}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Get bookmarks error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @bookmark_controller_router.get("/bookmarks/search")
    def search_bookmarks(
        self,
        query: str,
        token: str = Header(None)
    ):
        """Search bookmarks by title, description, or URL"""
        try:
            if token is None:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_id = self._get_user_id_from_token(token)
            bookmarks = self.bookmarkService.search_bookmarks(user_id, query)
            
            return {"bookmarks": [b.dict() for b in bookmarks]}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Search bookmarks error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @bookmark_controller_router.put("/bookmarks/{bookmark_id}/move")
    def move_bookmark(
        self,
        bookmark_id: int,
        move_data: BookmarkMove,
        token: str = Header(None)
    ):
        """Move a bookmark to a different folder"""
        try:
            if token is None:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_id = self._get_user_id_from_token(token)
            
            success = self.bookmarkService.move_bookmark(
                bookmark_id=bookmark_id,
                folder_path=move_data.folder_path,
                user_id=user_id
            )
            
            if success:
                return CustomResponseMessage(
                    status_code=200,
                    message=f"Bookmark moved to {move_data.folder_path}"
                )
            else:
                raise HTTPException(status_code=400, detail="Failed to move bookmark")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Move bookmark error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @bookmark_controller_router.delete("/bookmarks/{bookmark_id}")
    def delete_bookmark(
        self,
        bookmark_id: int,
        token: str = Header(None)
    ):
        """Delete a bookmark"""
        try:
            if token is None:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            success = self.bookmarkService.delete_bookmark(bookmark_id)
            
            if success:
                return CustomResponseMessage(status_code=200, message="Bookmark deleted")
            else:
                raise HTTPException(status_code=404, detail="Bookmark not found")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Delete bookmark error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # Folder operations
    @bookmark_controller_router.post("/folders")
    def create_folder(
        self,
        folder: BookmarkFolderCreate,
        token: str = Header(None)
    ):
        """Create a new folder"""
        try:
            if token is None:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_id = self._get_user_id_from_token(token)
            
            folder_id = self.bookmarkService.create_folder(user_id, folder)
            
            if folder_id > 0:
                return {"folder_id": folder_id, "message": "Folder created successfully"}
            else:
                raise HTTPException(status_code=400, detail="Failed to create folder")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Create folder error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @bookmark_controller_router.get("/folders")
    def get_folder_tree(self, token: str = Header(None)):
        """Get complete folder tree"""
        try:
            if token is None:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_id = self._get_user_id_from_token(token)
            tree = self.bookmarkService.get_folder_tree(user_id)
            
            return {"folders": [f.dict() for f in tree]}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Get folder tree error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @bookmark_controller_router.get("/folders/{path:path}")
    def get_folder_by_path(
        self,
        path: str,
        token: str = Header(None)
    ):
        """Get folder details by path"""
        try:
            if token is None:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            user_id = self._get_user_id_from_token(token)
            
            # Ensure path starts with /
            if not path.startswith('/'):
                path = f"/{path}"
            
            folder = self.bookmarkService.get_folder_by_path(user_id, path)
            
            if folder:
                return folder.dict()
            else:
                raise HTTPException(status_code=404, detail="Folder not found")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Get folder error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @bookmark_controller_router.delete("/folders/{folder_id}")
    def delete_folder(
        self,
        folder_id: int,
        token: str = Header(None)
    ):
        """Delete a folder and all its contents"""
        try:
            if token is None:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            success = self.bookmarkService.delete_folder(folder_id)
            
            if success:
                return CustomResponseMessage(status_code=200, message="Folder deleted")
            else:
                raise HTTPException(status_code=404, detail="Folder not found")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Delete folder error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
