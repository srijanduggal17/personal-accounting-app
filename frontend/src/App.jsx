import { useState } from 'react'
import BalanceSheetPage from './pages/BalanceSheetPage.jsx'
import ChartOfAccountsPage from './pages/ChartOfAccountsPage.jsx'
import './App.css'

const pages = [
  { id: 'accounts', label: 'Chart of accounts', Component: ChartOfAccountsPage },
  { id: 'balance-sheet', label: 'Balance sheet', Component: BalanceSheetPage },
]

export default function App() {
  const [activePageId, setActivePageId] = useState(pages[0].id)
  const active = pages.find((p) => p.id === activePageId) ?? pages[0]
  const Page = active.Component

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <nav className="app-nav" aria-label="Main">
          <ul className="app-nav-list">
            {pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  className={
                    page.id === activePageId
                      ? 'app-nav-item app-nav-item-active'
                      : 'app-nav-item'
                  }
                  onClick={() => setActivePageId(page.id)}
                  aria-current={page.id === activePageId ? 'page' : undefined}
                >
                  {page.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="app-main">
        <div className="app-main-inner">
          <Page />
        </div>
      </main>
    </div>
  )
}
