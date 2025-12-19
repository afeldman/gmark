from pydantic import BaseModel

class User(BaseModel):
    username: str
    password: str
    email: str

class UserRegister(BaseModel):
    username: str
    password: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

class ActiveSession(BaseModel):
    user_id: int
    token: str
    expires_at: int
