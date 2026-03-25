CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT,
    note TEXT,
    category TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);
