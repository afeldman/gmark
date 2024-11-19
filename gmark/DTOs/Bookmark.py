from datetime import datetime, timezone
from pydantic import BaseModel

class Bookmark(BaseModel):
    user_id: int = -1
    url: str
    title: str
    description: str
    keywords: list[str]
    access_time: datetime = datetime.now(tz=timezone.utc)
    modified_time: datetime = datetime.now(tz=timezone.utc)
    changed_time: datetime = datetime.now(tz=timezone.utc)
    mode: str='user_mode'
