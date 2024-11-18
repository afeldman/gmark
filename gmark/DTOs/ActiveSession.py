from datetime import datetime
from pydantic import BaseModel


class ActiveSession(BaseModel):
    username: str
    access_token: str
    expiry_time: datetime
