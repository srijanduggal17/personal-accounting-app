const { insertAccount: insertAccountRow } = require('../queries/accountsQueries');

const CATEGORIES = new Set([
  'Asset',
  'Liability',
  'Equity',
  'Revenue',
  'Expense',
]);

const ACCOUNT_TYPES = new Set(['Group', 'Ledger']);

const DEFAULT_ACCOUNT_TYPE = 'Ledger';
const DEFAULT_IS_ACTIVE = 1;
const DEFAULT_STARTING_BALANCE = 0;
const DEFAULT_STARTING_BALANCE_DATE = '2000-01-01';

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function conflict(res, message) {
  return res.status(409).json({ error: message });
}

function normalizeIsActive(value) {
  if (value === undefined) return DEFAULT_IS_ACTIVE;
  if (value === true) return 1;
  if (value === false) return 0;
  if (value === 0 || value === 1) return value;
  return undefined;
}

function normalizeParentAccountId(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isInteger(n)) return n;
  }
  return undefined;
}

function validateAndBuildRow(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object' };
  }

  const name =
    typeof body.name === 'string' ? body.name.trim() : String(body.name ?? '').trim();
  if (!name) {
    return { error: 'name is required and must be non-empty' };
  }

  const category = body.category;
  if (typeof category !== 'string' || !CATEGORIES.has(category)) {
    return {
      error:
        'category is required and must be one of: Asset, Liability, Equity, Revenue, Expense',
    };
  }

  let accountType = body.account_type;
  if (accountType === undefined) {
    accountType = DEFAULT_ACCOUNT_TYPE;
  } else if (typeof accountType !== 'string' || !ACCOUNT_TYPES.has(accountType)) {
    return { error: 'account_type must be Group or Ledger' };
  }

  const parentAccountId = normalizeParentAccountId(body.parent_account_id);
  if (parentAccountId === undefined && body.parent_account_id !== undefined && body.parent_account_id !== null) {
    return { error: 'parent_account_id must be an integer or null' };
  }

  const isActive = normalizeIsActive(body.is_active);
  if (isActive === undefined) {
    return { error: 'is_active must be 0, 1, true, or false' };
  }

  let startingBalance = body.starting_balance;
  if (startingBalance === undefined) {
    startingBalance = DEFAULT_STARTING_BALANCE;
  } else if (typeof startingBalance !== 'number' || Number.isNaN(startingBalance)) {
    return { error: 'starting_balance must be a number' };
  }

  let startingBalanceDate = body.starting_balance_date;
  if (startingBalanceDate === undefined) {
    startingBalanceDate = DEFAULT_STARTING_BALANCE_DATE;
  } else if (typeof startingBalanceDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startingBalanceDate)) {
    return { error: 'starting_balance_date must be a string in YYYY-MM-DD form' };
  }

  return {
    row: {
      name,
      category,
      account_type: accountType,
      parent_account_id: parentAccountId,
      is_active: isActive,
      starting_balance: startingBalance,
      starting_balance_date: startingBalanceDate,
    },
  };
}

function createInsertAccountHandler(db) {
  return function insertAccountHandler(req, res) {
    const built = validateAndBuildRow(req.body);
    if (built.error) {
      return badRequest(res, built.error);
    }

    try {
      const account = insertAccountRow(db, built.row);
      return res.status(201).json(account);
    } catch (err) {
      if (err && err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return conflict(res, 'parent_account_id does not reference an existing account');
      }
      if (err && String(err.code || '').startsWith('SQLITE_CONSTRAINT')) {
        return conflict(res, err.message || 'Constraint violation');
      }
      throw err;
    }
  };
}

module.exports = {
  createInsertAccountHandler,
};
