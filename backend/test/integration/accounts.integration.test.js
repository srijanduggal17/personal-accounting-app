const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('node:assert');
const { test } = require('node:test');
const Database = require('better-sqlite3');
const request = require('supertest');
const { loadOpenApiSpec } = require('../../src/openapi/openapiLoader');

const SCHEMA_PATH = path.join(__dirname, '../../../database/schema_v1.sql');

function openFreshDatabase() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'accounts-integration-'));
  const dbPath = path.join(dir, 'test.db');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  return { db, dir };
}

test('accounts API integration flow', async () => {
  await loadOpenApiSpec();
  const { createApp } = require('../../src/app');
  const { db, dir } = openFreshDatabase();
  try {
    const app = createApp(db);
    const agent = request(app);

    {
      const res = await agent.get('/accounts').expect(200);
      assert.deepStrictEqual(res.body, { accounts: [] });
    }

    {
      const res = await agent.get('/accounts/types').expect(200);
      assert.deepStrictEqual(res.body.types.Asset, [
        'Cash + Bank',
        'Depreciation and Amortization',
        'Other Long-Term Asset',
        'Other Short-Term Asset',
        'Property, Plant, Equipment',
      ]);
      assert.deepStrictEqual(res.body.types.Liability, [
        'Credit Card',
        'Loan + Line of Credit',
        'Other Long-Term Liability',
        'Other Short-Term Liability',
      ]);
      assert.deepStrictEqual(res.body.types.Equity, [
        'Owner Contributions/Drawings',
        'Retained Earnings',
      ]);
      assert.deepStrictEqual(res.body.types.Revenue, ['Revenue']);
      assert.deepStrictEqual(res.body.types.Expense, ['Expense']);
    }

    const createBody = {
      name: 'Checking',
      category: 'Asset',
      subtype: 'Cash + Bank',
    };

    const created = await agent.post('/accounts').send(createBody).expect(201);
    const accountId = created.body.id;
    assert.strictEqual(typeof accountId, 'number');
    assert.strictEqual(created.body.name, 'Checking');
    assert.strictEqual(created.body.category, 'Asset');
    assert.strictEqual(created.body.subtype, 'Cash + Bank');

    {
      const res = await agent.get('/accounts').expect(200);
      assert.strictEqual(res.body.accounts.length, 1);
      const row = res.body.accounts[0];
      assert.strictEqual(row.id, accountId);
      assert.strictEqual(row.name, 'Checking');
      assert.strictEqual(row.category, 'Asset');
      assert.strictEqual(row.subtype, 'Cash + Bank');
      assert.strictEqual(row.account_type, 'Ledger');
      assert.strictEqual(row.parent_account_id, null);
      assert.strictEqual(row.is_active, 1);
      assert.strictEqual(row.starting_balance, 0);
      assert.strictEqual(row.starting_balance_date, '2000-01-01');
      assert.ok(Array.isArray(row.children));
      assert.strictEqual(row.children.length, 0);
    }

    await agent
      .patch(`/accounts/${accountId}`)
      .send({ name: 'Savings' })
      .expect(200);

    {
      const res = await agent.get('/accounts').expect(200);
      const row = res.body.accounts[0];
      assert.strictEqual(row.name, 'Savings');
      assert.strictEqual(row.category, 'Asset');
      assert.strictEqual(row.subtype, 'Cash + Bank');
      assert.strictEqual(row.account_type, 'Ledger');
      assert.strictEqual(row.is_active, 1);
      assert.strictEqual(row.starting_balance, 0);
      assert.strictEqual(row.starting_balance_date, '2000-01-01');
    }

    await agent
      .patch(`/accounts/${accountId}`)
      .send({
        is_active: false,
        starting_balance: 100.5,
        starting_balance_date: '2024-06-15',
      })
      .expect(200);

    {
      const res = await agent.get('/accounts').expect(200);
      const row = res.body.accounts[0];
      assert.strictEqual(row.name, 'Savings');
      assert.strictEqual(row.category, 'Asset');
      assert.strictEqual(row.subtype, 'Cash + Bank');
      assert.strictEqual(row.account_type, 'Ledger');
      assert.strictEqual(row.is_active, 0);
      assert.strictEqual(row.starting_balance, 100.5);
      assert.strictEqual(row.starting_balance_date, '2024-06-15');
    }

    await agent.delete(`/accounts/${accountId}`).expect(204);

    {
      const res = await agent.get('/accounts').expect(200);
      assert.deepStrictEqual(res.body, { accounts: [] });
    }
  } finally {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
