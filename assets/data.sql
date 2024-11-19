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

CREATE TABLE bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    hash TEXT UNIQUE,
    description TEXT,
    access_time DATETIME,
    modified_time DATETIME,
    changed_time DATETIME,
    mode TEXT CHECK(mode IN ("user_mode", "team_mode", "public_mode")),
    FOREIGN KEY (user_id) REFERENCES users(id)
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

