from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

class BookmarkFolder(BaseModel):
    id: Optional[int] = None
    user_id: int
    name: str
    parent_id: Optional[int] = None
    full_path: str
    created_time: datetime = datetime.now(tz=timezone.utc)
    modified_time: datetime = datetime.now(tz=timezone.utc)

class BookmarkFolderCreate(BaseModel):
    name: str
    parent_path: Optional[str] = None  # e.g., "/tech" or "/tech/javascript"

class BookmarkFolderTree(BaseModel):
    id: int
    name: str
    full_path: str
    children: list['BookmarkFolderTree'] = []
    bookmark_count: int = 0
