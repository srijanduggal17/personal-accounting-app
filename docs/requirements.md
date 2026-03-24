## Functional Requirements

### 1. Account Management
*Derived from: Account Setup*
- Users must be able to create accounts with a category (Asset, Liability, Equity, Revenue, Expenses), name, optional parent account, and a starting balance with date.
- Accounts must support a hierarchical parent-child structure.

### 2. Transaction Import
*Derived from: Importing Transactions*
- Users must be able to import CSV files from external financial institutions.
- Users must be able to map CSV columns to system fields (date, description, amount).
- Users must be able to assign imported transactions to a specific account.

### 3. Transaction Categorization
*Derived from: Categorizing Transactions*
- Users must be able to categorize transactions individually.
- Users must be able to split a single transaction into a debit from one account and credits across multiple accounts.
- Transactions must be sorted newest to oldest by default.
- Users must be able to filter transactions by category (including uncategorized), account, type (deposit/withdrawal), and date, and search by description.
- Users must be able to mark a transaction as a transfer between accounts, with the system surfacing the matching transaction in the other account.

### 4. Journal Entries
*Derived from: Importing Transactions, Categorizing Transactions*
- Users must be able to manually create journal entries with any number of debit/credit line items.
- Journal entries must be accessible from the transaction view.

### 5. Balance Sheet
*Derived from: Balance Sheet, View Account Balances (use case diagram)*
- Users must be able to view a balance sheet summary (total Assets, Liabilities, Equity) for a given date.
- Users must be able to drill down into individual account balances within each category.
- Nested/sub-accounts (e.g., savings buckets within a brokerage account) must display their individual balances.

### 6. Income Statement
*Derived from: Income Statement*
- Users must be able to view total income and expenses for a user-defined date range.
- Users must be able to drill down to see each account's contribution to total income and expenses.
- Users must be able to drill further into a specific account to see its individual transactions, starting balance, and ending balance.

### 7. Investment Returns (XIRR)
*Derived from: Investment Returns*
- Users must be able to perform XIRR analysis on individual investment accounts (e.g., brokerage, 401(k), Roth IRA).
- The system must display calculated investment returns per account.

### 8. Cash Flow Forecasting
*Derived from: Cash Flow Forecast*
- Users must be able to mark income and expense transactions as recurring, with a defined cadence.
- Users must be able to view a projected cash flow based on current recurring transaction dates and frequencies.
- Users must be able to model what-if scenarios by adjusting dates of recurring items and seeing the resulting impact.

### 9. Reconciliation
*Derived from: Reconciliation*
- Users must be able to select an account and initiate reconciliation by entering a statement closing date and balance.
- If balances match, the system must update the reconciliation date for the account.
- If balances do not match, the system must notify the user and display the list of unreconciled transactions between the last reconciliation date and the entered date.

---

## Non-Functional Requirements

### 1. Data Integrity
*Derived from: Importing Transactions, Categorizing Transactions*
- All double-entry journal entries must balance (debits must equal credits) before being committed.
- Transaction splits must fully account for the original transaction amount with no remainder.

### 2. Auditability
*Derived from: Reconciliation, Categorizing Transactions, Journal Entries*
- The system must preserve a complete, immutable ledger history; past entries should be corrected via reversing entries rather than direct deletion.

### 3. Usability & Navigation
*Derived from: Balance Sheet, Income Statement, Categorizing Transactions*
- Drill-down navigation (summary → account → transactions) must be consistent across Balance Sheet and Income Statement views.
- The transaction list must support responsive filtering and search without full page reloads.

### 4. Extensibility / Flexibility of Account Structure
*Derived from: Balance Sheet, Account Setup*
- The account hierarchy must support arbitrary depth to accommodate varied structures (e.g., savings buckets within a brokerage account).

### 5. CSV Import Flexibility
*Derived from: Importing Transactions*
- The import mapping interface must handle variability in CSV formats across different financial institutions (e.g., varying column names, single vs. separate debit/credit columns).

### 6. Calculation Accuracy
*Derived from: Investment Returns, Cash Flow Forecast*
- XIRR calculations must use standard financial computation with appropriate handling of edge cases (e.g., no positive cash flows, single transactions).
- Cash flow forecasts must correctly handle multiple recurrence cadences (weekly, bi-weekly, monthly, etc.) and account for calendar edge cases.

### 7. Performance
*Derived from: Balance Sheet, Income Statement*
- Balance sheet and income statement reports must calculate efficiently even as transaction history grows over multiple years across many accounts.