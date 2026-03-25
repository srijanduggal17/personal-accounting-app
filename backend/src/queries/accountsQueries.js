const INSERT_ACCOUNT = `
INSERT INTO accounts (name, category, account_type, parent_account_id, is_active, starting_balance, starting_balance_date)
VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const SELECT_BY_ID = `
SELECT
  id,
  name,
  category,
  account_type,
  parent_account_id,
  is_active,
  starting_balance,
  starting_balance_date,
  created_at,
  updated_at
FROM accounts
`;

const SELECT_BY_ID_WHERE = `${SELECT_BY_ID}
WHERE id = ?
`;

const SELECT_ALL = `${SELECT_BY_ID}
ORDER BY id
`;

function getAccountById(db, id) {
  return db.prepare(SELECT_BY_ID_WHERE).get(id);
}

function getAllAccounts(db) {
  return db.prepare(SELECT_ALL).all();
}

function deleteAccountById(db, id) {
  const stmt = db.prepare('DELETE FROM accounts WHERE id = ?');
  return stmt.run(id);
}

const UPDATEABLE_COLUMNS = new Set([
  'name',
  'category',
  'is_active',
  'starting_balance',
  'starting_balance_date',
]);

function updateAccountById(db, id, patch) {
  const keys = Object.keys(patch);
  if (keys.length === 0) {
    return { changes: 0 };
  }
  const sets = keys.map((k) => `${k} = @${k}`);
  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
  const sql = `UPDATE accounts SET ${sets.join(', ')} WHERE id = @id`;
  const params = { ...patch, id };
  return db.prepare(sql).run(params);
}

function insertAccount(db, row) {
  const stmt = db.prepare(INSERT_ACCOUNT);
  const info = stmt.run(
    row.name,
    row.category,
    row.account_type,
    row.parent_account_id,
    row.is_active,
    row.starting_balance,
    row.starting_balance_date
  );
  const id = Number(info.lastInsertRowid);
  return getAccountById(db, id);
}

module.exports = {
  insertAccount,
  getAccountById,
  getAllAccounts,
  deleteAccountById,
  updateAccountById,
  UPDATEABLE_COLUMNS,
};
