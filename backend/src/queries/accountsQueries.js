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
WHERE id = ?
`;

function getAccountById(db, id) {
  return db.prepare(SELECT_BY_ID).get(id);
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
};
