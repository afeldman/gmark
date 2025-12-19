from pydantic import BaseModel

class CustomResponseMessage(BaseModel):
    status_code: int
    message: str
