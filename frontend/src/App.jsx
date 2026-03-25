import { useEffect, useState } from 'react'
import './App.css'

function AccountNode({ account }) {
  const hasChildren = account.children?.length > 0

  return (
    <li>
      <div className="account-row">
        <span className="account-name">{account.name}</span>
        <span className="account-meta">
          {account.category} · {account.account_type}
          {account.is_active ? '' : ' · inactive'}
        </span>
        <span className="account-balance">
          {account.starting_balance} ({account.starting_balance_date})
        </span>
      </div>
      {hasChildren && (
        <ul className="account-children">
          {account.children.map((child) => (
            <AccountNode key={child.id} account={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

function App() {
  const [accounts, setAccounts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/accounts')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setAccounts(Array.isArray(data.accounts) ? data.accounts : [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load accounts')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Chart of Accounts</h1>
      </header>

      <main className="app-main">
        {loading && <p className="status">Loading…</p>}
        {error && (
          <p className="status status-error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && accounts?.length === 0 && (
          <p className="status">No accounts yet.</p>
        )}
        {!loading && !error && accounts?.length > 0 && (
          <ul className="account-tree">
            {accounts.map((account) => (
              <AccountNode key={account.id} account={account} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

export default App
