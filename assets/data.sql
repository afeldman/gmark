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
);

CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE team_users (
    team_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE
);

CREATE TABLE bookmark_keywords (
    bookmark_id INTEGER,
    keyword_id INTEGER,
    ranking INTEGER,
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id),
    FOREIGN KEY (keyword_id) REFERENCES keywords(id)
);

CREATE TABLE bookmark_folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    parent_id INTEGER,
    full_path TEXT NOT NULL,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES bookmark_folders(id) ON DELETE CASCADE,
    UNIQUE(user_id, full_path)
);

CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    folder_id INTEGER,
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    hash TEXT UNIQUE,
    description TEXT,
    access_time DATETIME,
    modified_time DATETIME,
    changed_time DATETIME,
    mode TEXT CHECK(mode IN ("user_mode", "team_mode", "public_mode")),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (folder_id) REFERENCES bookmark_folders(id) ON DELETE SET NULL
);

INSERT INTO keywords (keyword) VALUES ("javascript"),
                                        ("video"),
                                        ("fitness"),
                                        ("lifestyle"),
                                        ("mode"),
                                        ("heart"),
                                        ("reinforcementlearning"),
                                        ("som"),
                                        ("nutrission"),
                                        ("cnn"),
                                        ("programming"),
                                        ("c++"),
                                        ("python"),
                                        ("java"),
                                        ("ruby"),
                                        ("php"),
                                        ("html"),
                                        ("css"),
                                        ("nodejs"),
                                        ("react"),
                                        ("angular"),
                                        ("vuejs"),
                                        ("jquery"),
                                        ("bootstrap"),
                                        ("materialize"),
                                        ("bulma"),
                                        ("tailwindcss"),
                                        ("sass"),
                                        ("less"),
                                        ("stylus"),
                                        ("express"),
                                        ("koa"),
                                        ("django"),
                                        ("flask"),
                                        ("laravel"),
                                        ("symfony"),
                                        ("spring"),
                                        ("hibernate"),
                                        ("jpa"),
                                        ("sql"),
                                        ("mybatis"),
                                        ("sqlalchemy"),
                                        ("sequelize"),
                                        ("knex"),
                                        ("rust");

-- Create default root folders for common categories
INSERT INTO bookmark_folders (user_id, name, parent_id, full_path) VALUES 
    (1, "tech", NULL, "/tech"),
    (1, "personal", NULL, "/personal"),
    (1, "work", NULL, "/work"),
    (1, "unsorted", NULL, "/unsorted");

