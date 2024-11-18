CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

CREATE TABLE active_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    access_tolen TEXT NOT NULL,
    expiry_time DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
)

CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    keywords TEXT, -- JSON format to store dynamic keyword lists
    access_time DATETIME,
    modified_time DATETIME,
    changed_time DATETIME,
    mode TEXT CHECK(mode IN ('user_mode', 'team_mode', 'public_mode')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);