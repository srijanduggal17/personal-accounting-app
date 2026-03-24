## Functional Requirements

### 1. Account Management
*Derived from: Account Setup*
- Users must be able to create accounts with a category (Asset, Liability, Equity, Revenue, Expenses), name, optional parent account, and a starting balance with date.
- Accounts must support a hierarchical parent-child structure. Once created, an account's parent cannot be changed.
- Users must be able to edit an account's name and category.
- Users must be able to deactivate (archive) an account. Deactivated accounts are hidden from active views but their transaction history is preserved.

### 2. Transaction Import
*Derived from: Importing Transactions*
- Users must be able to import CSV files from external financial institutions.
- Users must be able to map CSV columns to system fields (date, description, amount). These mappings should be saved and associated to the account that they are imported to
- Users must be able to specify the sign convention of the amount column (e.g., whether debits are negative or whether separate debit/credit columns are used) at import time.
- Users must be able to assign imported transactions to a specific account.
- The system must detect potential duplicate transactions during import (matching on date, amount, and description) and warn the user, allowing them to skip or proceed with importing the duplicate.

### 3. Transaction Categorization
*Derived from: Categorizing Transactions*
- Users must be able to categorize transactions individually.
- Users must be able to split a single transaction into a debit from one account and credits across multiple accounts.
- Transactions must be sorted newest to oldest by default.
- Users must be able to filter transactions by category (including uncategorized), account, type (deposit/withdrawal), and date, and search by description.
- Users must be able to mark a transaction as a transfer between accounts. The system must surface the matching transaction in the other account if one exists. If no matching transaction exists, the user must be able to create one.
- Users must be able to define categorization rules that automatically assign a category to transactions matching specified criteria (e.g., description contains a keyword). These rules must be applied to newly imported transactions and must be re-applicable to existing uncategorized transactions on demand.

### 4. Journal Entries
*Derived from: Importing Transactions, Categorizing Transactions*
- Users must be able to manually create journal entries with any number of debit/credit line items.
- Journal entries must be viewable within the transactions view alongside regular transactions.
- Users must be able to edit or delete an existing journal entry.

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
- The system must display the calculated annualized return percentage per account.

### 8. Cash Flow Forecasting
*Derived from: Cash Flow Forecast*
- Users must be able to mark income and expense transactions as recurring, with a defined cadence (e.g., weekly, bi-weekly, monthly).
- Users must be able to set an end date on a recurring item, after which it will no longer be projected.
- Users must be able to view a projected cash flow based on recurring item definitions. The forecast is forward-looking only and does not incorporate already-imported historical transactions.
- Users must be able to define a forecast horizon by specifying an end date for the projection.
- Users must be able to model what-if scenarios with the following controls:
  - Adjust the date or cadence of a recurring item.
  - Change the amount of a recurring item.
  - Add a new recurring item to the forecast.
  - Remove a recurring item from the forecast.
  - Set or change the end date of a recurring item.
- Changes made in what-if mode must not affect the saved recurring item definitions.

### 9. Reconciliation
*Derived from: Reconciliation*
- Transactions must carry a reconciliation status of either unreconciled or reconciled.
- Users must be able to select an account and initiate reconciliation by entering a statement closing date and closing balance.
- Reconciliation is all-or-nothing: if the computed account balance as of the closing date matches the entered closing balance, all transactions up to that date are marked as reconciled and the account's last reconciliation date is updated. If the balances do not match, the user is notified and the list of unreconciled transactions between the last reconciliation date and the entered closing date is displayed; no transactions are marked reconciled.

---

## Non-Functional Requirements

### 1. Data Integrity
*Derived from: Importing Transactions, Categorizing Transactions*
- All double-entry journal entries must balance (debits must equal credits) before being committed.
- Transaction splits must fully account for the original transaction amount with no remainder.

### 2. Usability & Navigation
*Derived from: Balance Sheet, Income Statement, Categorizing Transactions*
- Drill-down navigation (summary → account → transactions) must be consistent across Balance Sheet and Income Statement views.
- The transaction list must support responsive filtering and search.

### 3. Extensibility / Flexibility of Account Structure
*Derived from: Balance Sheet, Account Setup*
- The account hierarchy must support arbitrary depth to accommodate varied structures (e.g., savings buckets within a brokerage account).

### 4. CSV Import Flexibility
*Derived from: Importing Transactions*
- The import mapping interface must handle variability in CSV formats across different financial institutions (e.g., varying column names, single vs. separate debit/credit columns).

### 5. Calculation Accuracy
*Derived from: Investment Returns, Cash Flow Forecast*
- XIRR calculations must use standard financial computation with appropriate handling of edge cases (e.g., no positive cash flows, single transactions).
- Cash flow forecasts must correctly handle multiple recurrence cadences (weekly, bi-weekly, monthly, etc.) and account for calendar edge cases (e.g., month-end dates).

### 6. Currency
- The system operates in USD only. Multi-currency support is out of scope.

### 7. Performance
*Derived from: Balance Sheet, Income Statement*
- Balance sheet and income statement reports must calculate efficiently even as transaction history grows over multiple years across many accounts.