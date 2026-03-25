const {
  insertAccount: insertAccountRow,
  getAllAccounts,
  getAccountById,
  deleteAccountById,
  updateAccountById,
  UPDATEABLE_COLUMNS,
} = require('../queries/accountsQueries');

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

function notFound(res) {
  return res.status(404).json({ error: 'Account not found' });
}

function parseAccountIdParam(req) {
  const raw = req.params.id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    return { error: 'id must be a positive integer' };
  }
  return { id };
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

function buildAccountTree(rows) {
  const byId = new Map();
  for (const row of rows) {
    byId.set(row.id, { ...row, children: [] });
  }
  const roots = [];
  for (const row of rows) {
    const node = byId.get(row.id);
    if (row.parent_account_id == null) {
      roots.push(node);
    } else {
      const parent = byId.get(row.parent_account_id);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }
  function cmp(a, b) {
    return a.id - b.id;
  }
  roots.sort(cmp);
  function sortChildren(node) {
    node.children.sort(cmp);
    for (const c of node.children) sortChildren(c);
  }
  for (const r of roots) sortChildren(r);
  return roots;
}

function createListAccountsHandler(db) {
  return function listAccountsHandler(_req, res) {
    const rows = getAllAccounts(db);
    const accounts = buildAccountTree(rows);
    return res.json({ accounts });
  };
}

function createDeleteAccountHandler(db) {
  return function deleteAccountHandler(req, res) {
    const parsed = parseAccountIdParam(req);
    if (parsed.error) {
      return badRequest(res, parsed.error);
    }
    const { id } = parsed;

    // TODO: Before deleting, check whether this account has any transactions (or related journal
    // lines) and reject or cascade according to product rules once the transactions API exists.

    try {
      const info = deleteAccountById(db, id);
      if (info.changes === 0) {
        return notFound(res);
      }
      return res.status(204).send();
    } catch (err) {
      if (err && err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return conflict(res, 'Cannot delete account: it is still referenced by other rows');
      }
      throw err;
    }
  };
}

function validateUpdatePatch(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object' };
  }
  if (body.parent_account_id !== undefined) {
    return { error: 'parent_account_id cannot be updated via this endpoint' };
  }

  const keys = Object.keys(body).filter((k) => body[k] !== undefined);
  for (const key of keys) {
    if (!UPDATEABLE_COLUMNS.has(key)) {
      return { error: `Unknown or disallowed field: ${key}` };
    }
  }
  if (keys.length === 0) {
    return { error: 'At least one updatable field is required' };
  }

  const patch = {};

  if (body.name !== undefined) {
    const name =
      typeof body.name === 'string' ? body.name.trim() : String(body.name ?? '').trim();
    if (!name) {
      return { error: 'name must be non-empty' };
    }
    patch.name = name;
  }

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !CATEGORIES.has(body.category)) {
      return {
        error:
          'category must be one of: Asset, Liability, Equity, Revenue, Expense',
      };
    }
    patch.category = body.category;
  }

  if (body.account_type !== undefined) {
    if (typeof body.account_type !== 'string' || !ACCOUNT_TYPES.has(body.account_type)) {
      return { error: 'account_type must be Group or Ledger' };
    }
    patch.account_type = body.account_type;
  }

  if (body.is_active !== undefined) {
    const isActive = normalizeIsActive(body.is_active);
    if (isActive === undefined) {
      return { error: 'is_active must be 0, 1, true, or false' };
    }
    patch.is_active = isActive;
  }

  if (body.starting_balance !== undefined) {
    if (typeof body.starting_balance !== 'number' || Number.isNaN(body.starting_balance)) {
      return { error: 'starting_balance must be a number' };
    }
    patch.starting_balance = body.starting_balance;
  }

  if (body.starting_balance_date !== undefined) {
    if (
      typeof body.starting_balance_date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.starting_balance_date)
    ) {
      return { error: 'starting_balance_date must be a string in YYYY-MM-DD form' };
    }
    patch.starting_balance_date = body.starting_balance_date;
  }

  return { patch };
}

function createUpdateAccountHandler(db) {
  return function updateAccountHandler(req, res) {
    const parsed = parseAccountIdParam(req);
    if (parsed.error) {
      return badRequest(res, parsed.error);
    }
    const { id } = parsed;

    const built = validateUpdatePatch(req.body);
    if (built.error) {
      return badRequest(res, built.error);
    }

    try {
      if (!getAccountById(db, id)) {
        return notFound(res);
      }
      updateAccountById(db, id, built.patch);
      const account = getAccountById(db, id);
      return res.json(account);
    } catch (err) {
      if (err && String(err.code || '').startsWith('SQLITE_CONSTRAINT')) {
        return conflict(res, err.message || 'Constraint violation');
      }
      throw err;
    }
  };
}

module.exports = {
  createInsertAccountHandler,
  createListAccountsHandler,
  createDeleteAccountHandler,
  createUpdateAccountHandler,
};
