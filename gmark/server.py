from fastapi import FastAPI, Depends
import sqlite3
from fastapi.middleware.cors import CORSMiddleware

from controllers.UserController import user_controller_router
import uvicorn


app = FastAPI()

tags_metadata = [
    {"name": "Users", "description": "Operations related to user management"}
]

# Include the routers from controller modules
app.include_router(user_controller_router, prefix="/users", tags=["Users"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect("gmark.db")
    try:
        yield conn
    finally:
        conn.close()

@app.get("/bookmarks")
def get_bookmarks(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM bookmarks WHERE user_id = ?", (user_id,))
    return cursor.fetchall()

@app.post("/bookmarks")
def add_bookmark(user_id: int, url: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("INSERT INTO bookmarks (user_id, url, mode) VALUES (?, ?, ?)", (user_id, url, "user_mode"))
    db.commit()
    return {"message": "Bookmark hinzugefügt"}

if __name__ == '__main__':
    uvicorn.run("app:app",host=os.environ.get("HOST"), port=int(os.environ.get("PORT")), reload=True)