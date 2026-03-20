const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../finance.db'));

// Migrations — add new ones at the bottom, never edit existing
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id               TEXT PRIMARY KEY,
    date             TEXT,
    "transaction"    TEXT,
    category         TEXT    DEFAULT '',
    sub_category     TEXT    DEFAULT '',
    amount           REAL,
    payment          TEXT,
    notes            TEXT    DEFAULT '',
    recurring_sub    INTEGER DEFAULT 0,
    upstream_category TEXT   DEFAULT '',
    created_at       TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS earnings (
    id          TEXT PRIMARY KEY,
    date        TEXT,
    description TEXT,
    amount      REAL,
    source      TEXT DEFAULT '',
    notes       TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS category_mappings (
    upstream_key TEXT PRIMARY KEY,
    category     TEXT,
    sub_category TEXT,
    updated_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    category     TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    UNIQUE(category, sub_category)
  );

  CREATE INDEX IF NOT EXISTS idx_tx_payment  ON transactions(payment);
  CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
  CREATE INDEX IF NOT EXISTS idx_tx_date     ON transactions(date);
`);

require('./seed')(db);

module.exports = db;
