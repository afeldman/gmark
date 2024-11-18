from repositories.IUserRepository import IUserRepository
from entity_manager.entity_manager import entity_manager
from DTOs.User import User, ActiveSession
from decouple import config
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
from passlib.context import CryptContext
from datetime import timedelta
from passlib.hash import bcrypt
from datetime import datetime, timezone
import jwt
from jwt import PyJWTError
from fastapi import HTTPException

# CryptContext for hashing passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRepository(IUserRepository):
    def __init__(self):
        self.em = entity_manager.get_collection(config("USER_COLLECTION", 'USER'))
        self.activeSessionsEntityManager = entity_manager.get_collection(config("ACTIVE_SESSIONS_COLLECTION", "ACTIVE_SESSIONS"))
    
    def register(self, user : User):
        usr = self.em.find_one({"username": user.username})

        if usr is None:
            self.em.insert_one(
                {
                    "username": user.username,
                    "password": bcrypt.using(rounds=12).hash(user.password)
                }
            )
            return user
        else:
            return False

    def create_access_token(self, data: dict, expires_delta):
        to_encode = data.copy()
        expire = datetime.now(tz=timezone.utc) + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, config("SECRET_KEY"), algorithm=config("ALGORITHM"))
        return encoded_jwt

    def get_user(self, username: str):
        usr = self.em.find_one({"username": username})

        if usr is not None:
            return User(
                username = usr["username"],
                password = usr["password"]
            )
        
        return None

    def is_password_correct(self, form_data: OAuth2PasswordRequestForm = Depends()) -> bool:
        user = self.get_user(form_data.username)

        if user is None or not pwd_context.verify(form_data.password, user.password):
            return False

        return True

    def get_access_token(self, form_data: OAuth2PasswordRequestForm = Depends()):        
        access_token_expires = timedelta(minutes=int(config("ACCESS_TOKEN_EXPIRE_MINUTES")))
        access_token = self.create_access_token(
            data={"sub": form_data.username}, expires_delta=access_token_expires
        )
        return access_token

    def authenticate(self, token: str):
        try:
            payload = jwt.decode(token, config("SECRET_KEY"), algorithms=[config("ALGORITHM")])
            username: str = payload.get("sub")
            if username is None:
                raise HTTPException(status_code=400, detail="Could not validate credentials, user not found.")

            # Check if the token has expired
            expiry_time = payload.get("exp")
            if expiry_time is None or expiry_time < datetime.now(tz=timezone.utc).timestamp():
                self.activeSessionsEntityManager.delete_many({"username": username})
                raise HTTPException(status_code=401, detail="Authentication failed, invalid or expired token.")
            
            # Check if the username exists in the active sessions
            session = self.activeSessionsEntityManager.find_one({"username": username})
            if not session:
                raise HTTPException(status_code=401, detail="User session not found.")
            
        except PyJWTError:
            raise HTTPException(status_code=401, detail="Authentication failed, invalid or expired token.")

    def register_token_in_session(self, token: str):
        try:
            payload = jwt.decode(token, config("SECRET_KEY"), algorithms=[config("ALGORITHM")])
            user, expiration_time = payload.get("sub"), payload.get("exp")
            expiration_datetime = datetime.fromtimestamp(expiration_time, tz=timezone.utc)

            new_active_session = ActiveSession(
                username=user,
                access_token=token,
                expiry_time=expiration_datetime
            )

            self.activeSessionsEntityManager.insert_one(new_active_session.model_dump())
        except PyJWTError:
            raise HTTPException(status_code=401, detail="Authentication failed, invalid or expired token.")

    def logout(self, token: str):
        self.activeSessionsEntityManager.delete_many({"access_token": token})
    
    def is_session_active(self, username: str):
        # First, check if the user has an active session
        existing_session = self.activeSessionsEntityManager.find_one({"username": username})
        if not existing_session: 
            return False

        # If an active session exists, check if the token is still valid
        try:
            payload = jwt.decode(existing_session["access_token"], config("SECRET_KEY"), algorithms=[config("ALGORITHM")])
            expiry_time = payload.get("exp")
            current_time = datetime.now(tz=timezone.utc).timestamp()

            if expiry_time is None or expiry_time < current_time:
                # Token has expired
                self.activeSessionsEntityManager.delete_many({"username": username})
                return False
        
        except PyJWTError:
            # there was an error in processing the token, delete the session and return false as session is no longer active.
            self.activeSessionsEntityManager.delete_many({"username": username})
            return False

        return True

    def get_access_token_from_active_session(self, username: str):
        existing_session = self.activeSessionsEntityManager.find_one({"username": username})
        if existing_session is not None: 
            return existing_session["access_token"]
        return None