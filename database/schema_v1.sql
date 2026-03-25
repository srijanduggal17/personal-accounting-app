CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN (
            'Asset',
            'Liability',
            'Equity',
            'Revenue',
            'Expense'
        )
    ),
    -- TODO: add sub-category in here as well
    -- 'Group' = cannot have transactions, 'Ledger' = can have transactions
    account_type TEXT NOT NULL DEFAULT 'Ledger' CHECK (account_type IN ('Group', 'Ledger')),
    parent_account_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    starting_balance REAL NOT NULL DEFAULT 0,
    starting_balance_date TEXT NOT NULL DEFAULT '2000-01-01',
    -- ISO 8601: YYYY-MM-DD
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);