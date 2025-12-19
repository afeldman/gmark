from fastapi import FastAPI, Depends
import sqlite3
from fastapi.middleware.cors import CORSMiddleware

from controllers.UserController import user_controller_router
from controllers.BookmarkController import bookmark_controller_router
import uvicorn


app = FastAPI()

tags_metadata = [
    {"name": "Users", "description": "Operations related to user management"},
    {"name": "Bookmarks", "description": "Operations for bookmark management with AI classification"},
    {"name": "Folders", "description": "Filesystem-like folder hierarchy for bookmarks"}
]

# Include the routers from controller modules
app.include_router(user_controller_router, prefix="/users", tags=["Users"])
app.include_router(bookmark_controller_router, prefix="/api", tags=["Bookmarks", "Folders"])

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

@app.get("/search")
def search_bookmarks(
    user_id: int,
    keyword: str = None,
    start_time: str = None,
    end_time: str = None,
    db: sqlite3.Connection = Depends(get_db)
):
    query = "SELECT * FROM bookmarks WHERE user_id = ?"
    params = [user_id]

    if keyword:
        query += " AND keywords LIKE ?"
        params.append(f"%{keyword}%")
    if start_time:
        query += " AND access_time >= ?"
        params.append(start_time)
    if end_time:
        query += " AND access_time <= ?"
        params.append(end_time)

    cursor = db.cursor()
    cursor.execute(query, params)
    return cursor.fetchall()

@app.post("/teams")
def create_team(name: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("INSERT INTO teams (name) VALUES (?)", (name,))
    db.commit()
    return {"message": "Team erstellt"}

@app.post("/teams/{team_id}/add_user")
def add_user_to_team(team_id: int, user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("INSERT INTO team_users (team_id, user_id) VALUES (?, ?)", (team_id, user_id))
    db.commit()
    return {"message": "Benutzer hinzugefügt"}

@app.get("/teams/{team_id}/bookmarks")
def get_team_bookmarks(team_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    query = '''
        SELECT b.* FROM bookmarks b
        INNER JOIN team_users tu ON b.user_id = tu.user_id
        WHERE tu.team_id = ?
    '''
    cursor.execute(query, (team_id,))
    return cursor.fetchall()

@app.post("/bookmarks/sort")
def sort_bookmarks(api_key: str, user_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM bookmarks WHERE user_id = ?", (user_id,))
    bookmarks = cursor.fetchall()

    sorted_bookmarks = sort_bookmarks_by_relevance(api_key, bookmarks)
    return {"sorted_bookmarks": sorted_bookmarks}

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