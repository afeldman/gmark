from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

class Bookmark(BaseModel):
    user_id: int = -1
    folder_id: Optional[int] = None
    url: str
    title: str
    description: str
    keywords: list[str]
    access_time: datetime = datetime.now(tz=timezone.utc)
    modified_time: datetime = datetime.now(tz=timezone.utc)
    changed_time: datetime = datetime.now(tz=timezone.utc)
    mode: str='user_mode'

class BookmarkCreate(BaseModel):
    url: str
    folder_path: Optional[str] = "/unsorted"  # Default to /unsorted folder
    title: Optional[str] = None
    description: Optional[str] = None
    auto_classify: bool = True  # Automatically classify with AI

class BookmarkMove(BaseModel):
    folder_path: str
