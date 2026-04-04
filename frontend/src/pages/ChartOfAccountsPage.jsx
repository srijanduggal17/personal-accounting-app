import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'

/** Ordered list of { category, subtype, roots } for chart display (roots only). */
function buildGroupedAccountSections(roots, accountTypesMap) {
  if (!roots?.length) return []

  const byCat = new Map()
  for (const r of roots) {
    const cat = r.category
    const sub = r.subtype
    if (!byCat.has(cat)) byCat.set(cat, new Map())
    const sm = byCat.get(cat)
    if (!sm.has(sub)) sm.set(sub, [])
    sm.get(sub).push(r)
  }

  const categoriesPresent = new Set(roots.map((r) => r.category))
  let categoryOrder
  if (accountTypesMap) {
    const fromMap = Object.keys(accountTypesMap)
      .sort()
      .filter((c) => categoriesPresent.has(c))
    const extras = [...categoriesPresent].filter((c) => !fromMap.includes(c)).sort()
    categoryOrder = [...fromMap, ...extras]
  } else {
    categoryOrder = [...categoriesPresent].sort()
  }

  const sections = []
  for (const cat of categoryOrder) {
    const subMap = byCat.get(cat)
    if (!subMap) continue

    const used = new Set()
    const orderedSubtypes = []
    if (accountTypesMap?.[cat]) {
      for (const sub of accountTypesMap[cat]) {
        const list = subMap.get(sub)
        if (list?.length) {
          orderedSubtypes.push(sub)
          used.add(sub)
        }
      }
    }
    for (const sub of [...subMap.keys()].sort()) {
      if (!used.has(sub) && subMap.get(sub).length) {
        orderedSubtypes.push(sub)
      }
    }

    for (const sub of orderedSubtypes) {
      const list = [...subMap.get(sub)].sort((a, b) => a.id - b.id)
      sections.push({ category: cat, subtype: sub, roots: list })
    }
  }
  return sections
}

function flattenAccountsForParent(accounts, depth = 0) {
  const out = []
  if (!accounts) return out
  for (const a of accounts) {
    out.push({ id: a.id, name: a.name, depth })
    if (a.children?.length) {
      out.push(...flattenAccountsForParent(a.children, depth + 1))
    }
  }
  return out
}

function buildAccountIdIndex(accounts, acc = new Map()) {
  for (const node of accounts || []) {
    acc.set(node.id, node)
    if (node.children?.length) {
      buildAccountIdIndex(node.children, acc)
    }
  }
  return acc
}

function parentDisplayLabel(account, accountById) {
  if (account.parent_account_id == null) {
    return 'None'
  }
  const p = accountById.get(account.parent_account_id)
  return p?.name ?? `#${account.parent_account_id}`
}

function AccountNode({ account, accountById, onEdit }) {
  const hasChildren = account.children?.length > 0

  const active = Boolean(account.is_active)

  return (
    <li>
      <div className={`account-row${active ? '' : ' account-row--inactive'}`}>
        <span className="account-name">{account.name}</span>
        <button
          type="button"
          className="app-button-secondary account-row-edit"
          onClick={() => onEdit(account)}
        >
          Edit
        </button>
        <span className="account-meta">
          {account.account_type}
          {!active && (
            <span className="account-inactive-pill" title="This account is inactive">
              Inactive
            </span>
          )}
        </span>
        <span className="account-balance">
          {account.starting_balance} ({account.starting_balance_date})
        </span>
      </div>
      {hasChildren && (
        <ul className="account-children">
          {account.children.map((child) => (
            <AccountNode
              key={child.id}
              account={child}
              accountById={accountById}
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

const DEFAULT_DATE = '2000-01-01'

function getDefaultFormState(accountTypesMap) {
  const categories = accountTypesMap ? Object.keys(accountTypesMap).sort() : []
  const firstCategory = categories[0] || ''
  const subtypes = firstCategory ? accountTypesMap[firstCategory] || [] : []
  const firstSubtype = subtypes[0] || ''
  return {
    name: '',
    category: firstCategory,
    subtype: firstSubtype,
    account_type: 'Ledger',
    parent_account_id: '',
    is_active: true,
    starting_balance: '0',
    starting_balance_date: DEFAULT_DATE,
  }
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accountTypesMap, setAccountTypesMap] = useState(null)
  const [typesError, setTypesError] = useState(null)

  const [form, setForm] = useState(() => getDefaultFormState(null))
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [editForm, setEditForm] = useState(null)
  const [editSubmitError, setEditSubmitError] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  const dialogRef = useRef(null)
  const editDialogRef = useRef(null)

  const loadAccounts = useCallback(() => {
    return fetch('/accounts')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        setAccounts(Array.isArray(data.accounts) ? data.accounts : [])
        setError(null)
      })
  }, [])

  useEffect(() => {
    let cancelled = false

    loadAccounts().catch((err) => {
      if (!cancelled) {
        setError(err.message || 'Failed to load accounts')
      }
    }).finally(() => {
      if (!cancelled) {
        setLoading(false)
      }
    })

    fetch('/accounts/types')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`)
        }
        return res.json()
      })
      .then((data) => {
        if (!cancelled && data.types && typeof data.types === 'object') {
          setAccountTypesMap(data.types)
          setTypesError(null)
        } else if (!cancelled) {
          setTypesError('Invalid account types response')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTypesError(err.message || 'Failed to load account types')
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadAccounts])

  const parentOptions = useMemo(
    () => flattenAccountsForParent(accounts || []),
    [accounts],
  )

  const accountById = useMemo(
    () => buildAccountIdIndex(accounts || []),
    [accounts],
  )

  const sortedCategories = useMemo(() => {
    if (!accountTypesMap) return []
    return Object.keys(accountTypesMap).sort()
  }, [accountTypesMap])

  const subtypeOptions = useMemo(() => {
    if (!accountTypesMap || !form.category) return []
    return accountTypesMap[form.category] || []
  }, [accountTypesMap, form.category])

  const groupedSections = useMemo(
    () => buildGroupedAccountSections(accounts || [], accountTypesMap),
    [accounts, accountTypesMap],
  )

  const openModal = () => {
    setSubmitError(null)
    setForm(getDefaultFormState(accountTypesMap))
    queueMicrotask(() => dialogRef.current?.showModal())
  }

  const closeModal = () => {
    dialogRef.current?.close()
    setSubmitError(null)
  }

  const onDialogClose = () => {
    setSubmitError(null)
  }

  const openEditModal = useCallback(
    (account) => {
      setEditSubmitError(null)
      setEditForm({
        id: account.id,
        name: account.name,
        category: account.category,
        subtype: account.subtype,
        account_type: account.account_type,
        parentLabel: parentDisplayLabel(account, accountById),
        is_active: Boolean(account.is_active),
        starting_balance: String(account.starting_balance),
        starting_balance_date: account.starting_balance_date,
      })
      queueMicrotask(() => editDialogRef.current?.showModal())
    },
    [accountById],
  )

  const closeEditModal = () => {
    editDialogRef.current?.close()
    setEditSubmitError(null)
    setEditForm(null)
  }

  const onEditDialogClose = () => {
    setEditSubmitError(null)
    setEditForm(null)
  }

  const updateEditField = (field, value) => {
    setEditForm((f) => (f ? { ...f, [field]: value } : f))
  }

  const updateField = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'category' && accountTypesMap) {
        const subs = accountTypesMap[value] || []
        next.subtype = subs[0] || ''
      }
      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitError(null)

    const name = form.name.trim()
    if (!name) {
      setSubmitError('Name is required')
      return
    }
    if (!form.category || !form.subtype) {
      setSubmitError('Category and subtype are required')
      return
    }

    const startingBalance = Number(form.starting_balance)
    if (Number.isNaN(startingBalance)) {
      setSubmitError('Starting balance must be a number')
      return
    }

    const body = {
      name,
      category: form.category,
      subtype: form.subtype,
      account_type: form.account_type,
      is_active: form.is_active,
      starting_balance: startingBalance,
      starting_balance_date: form.starting_balance_date || DEFAULT_DATE,
    }
    if (form.parent_account_id === '' || form.parent_account_id == null) {
      body.parent_account_id = null
    } else {
      body.parent_account_id = Number(form.parent_account_id)
    }

    setSubmitting(true)
    fetch('/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (res.status === 201) {
          closeModal()
          await loadAccounts()
          return
        }
        const msg =
          typeof data.error === 'string' ? data.error : `Request failed (${res.status})`
        setSubmitError(msg)
      })
      .catch((err) => {
        setSubmitError(err.message || 'Failed to create account')
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editForm) return
    setEditSubmitError(null)

    const name = editForm.name.trim()
    if (!name) {
      setEditSubmitError('Name is required')
      return
    }

    const startingBalance = Number(editForm.starting_balance)
    if (Number.isNaN(startingBalance)) {
      setEditSubmitError('Starting balance must be a number')
      return
    }

    const body = {
      name,
      is_active: editForm.is_active,
      starting_balance: startingBalance,
      starting_balance_date: editForm.starting_balance_date || DEFAULT_DATE,
    }

    setEditSubmitting(true)
    fetch(`/accounts/${editForm.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          closeEditModal()
          await loadAccounts()
          return
        }
        const msg =
          typeof data.error === 'string' ? data.error : `Request failed (${res.status})`
        setEditSubmitError(msg)
      })
      .catch((err) => {
        setEditSubmitError(err.message || 'Failed to update account')
      })
      .finally(() => {
        setEditSubmitting(false)
      })
  }

  const typesReady = accountTypesMap && !typesError

  return (
    <>
      <header className="app-page-header app-page-header--with-action">
        <h1>Chart of Accounts</h1>
        <div className="app-page-header-actions">
          {typesError && (
            <span className="status status-error app-page-header-hint" role="status">
              {typesError} — new account is unavailable.
            </span>
          )}
          <button
            type="button"
            className="app-button-primary"
            disabled={!typesReady}
            onClick={openModal}
          >
            New account
          </button>
        </div>
      </header>

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
        <div className="account-chart-sections">
          {groupedSections.map((sec, i) => (
            <Fragment key={`${sec.category}::${sec.subtype}`}>
              {(i === 0 || groupedSections[i - 1].category !== sec.category) && (
                <h2 className="account-chart-type-heading">{sec.category}</h2>
              )}
              <div className="account-chart-subtype-block">
                <h3 className="account-chart-subtype-heading">{sec.subtype}</h3>
                <ul className="account-tree">
                  {sec.roots.map((account) => (
                    <AccountNode
                      key={account.id}
                      account={account}
                      accountById={accountById}
                      onEdit={openEditModal}
                    />
                  ))}
                </ul>
              </div>
            </Fragment>
          ))}
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="account-modal"
        onClose={onDialogClose}
        onCancel={(ev) => {
          ev.preventDefault()
          closeModal()
        }}
      >
        <form onSubmit={handleSubmit} className="account-modal-form">
          <h2 className="account-modal-title">New account</h2>

          {submitError && (
            <p className="status status-error account-modal-error" role="alert">
              {submitError}
            </p>
          )}

          <label className="account-modal-field">
            <span className="account-modal-label">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              autoComplete="off"
            />
          </label>

          <label className="account-modal-field">
            <span className="account-modal-label">Category</span>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              required
            >
              {sortedCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="account-modal-field">
            <span className="account-modal-label">Subtype</span>
            <select
              value={form.subtype}
              onChange={(e) => updateField('subtype', e.target.value)}
              required
            >
              {subtypeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="account-modal-field">
            <span className="account-modal-label">Account type</span>
            <select
              value={form.account_type}
              onChange={(e) => updateField('account_type', e.target.value)}
            >
              <option value="Ledger">Ledger</option>
              <option value="Group">Group</option>
            </select>
          </label>

          <label className="account-modal-field">
            <span className="account-modal-label">Parent</span>
            <select
              value={form.parent_account_id}
              onChange={(e) => updateField('parent_account_id', e.target.value)}
            >
              <option value="">None</option>
              {parentOptions.map(({ id, name, depth }) => (
                <option key={id} value={String(id)}>
                  {'\u00a0'.repeat(depth * 2)}
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="account-modal-field account-modal-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateField('is_active', e.target.checked)}
            />
            <span>Active</span>
          </label>

          <label className="account-modal-field">
            <span className="account-modal-label">Starting balance</span>
            <input
              type="number"
              step="any"
              value={form.starting_balance}
              onChange={(e) => updateField('starting_balance', e.target.value)}
            />
          </label>

          <label className="account-modal-field">
            <span className="account-modal-label">Starting balance date</span>
            <input
              type="date"
              value={form.starting_balance_date}
              onChange={(e) => updateField('starting_balance_date', e.target.value)}
            />
          </label>

          <div className="account-modal-actions">
            <button type="button" className="app-button-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="app-button-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={editDialogRef}
        className="account-modal"
        onClose={onEditDialogClose}
        onCancel={(ev) => {
          ev.preventDefault()
          closeEditModal()
        }}
      >
        {editForm && (
          <form onSubmit={handleEditSubmit} className="account-modal-form">
            <h2 className="account-modal-title">Edit account</h2>

            {editSubmitError && (
              <p className="status status-error account-modal-error" role="alert">
                {editSubmitError}
              </p>
            )}

            <label className="account-modal-field">
              <span className="account-modal-label">Name</span>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => updateEditField('name', e.target.value)}
                required
                autoComplete="off"
              />
            </label>

            <div className="account-modal-field">
              <span className="account-modal-label">Category</span>
              <div className="account-modal-readonly-value">{editForm.category}</div>
            </div>

            <div className="account-modal-field">
              <span className="account-modal-label">Subtype</span>
              <div className="account-modal-readonly-value">{editForm.subtype}</div>
            </div>

            <div className="account-modal-field">
              <span className="account-modal-label">Account type</span>
              <div className="account-modal-readonly-value">{editForm.account_type}</div>
            </div>

            <div className="account-modal-field">
              <span className="account-modal-label">Parent</span>
              <div className="account-modal-readonly-value">{editForm.parentLabel}</div>
            </div>

            <label className="account-modal-field account-modal-checkbox">
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => updateEditField('is_active', e.target.checked)}
              />
              <span>Active</span>
            </label>

            <label className="account-modal-field">
              <span className="account-modal-label">Starting balance</span>
              <input
                type="number"
                step="any"
                value={editForm.starting_balance}
                onChange={(e) => updateEditField('starting_balance', e.target.value)}
              />
            </label>

            <label className="account-modal-field">
              <span className="account-modal-label">Starting balance date</span>
              <input
                type="date"
                value={editForm.starting_balance_date}
                onChange={(e) => updateEditField('starting_balance_date', e.target.value)}
              />
            </label>

            <div className="account-modal-actions">
              <button type="button" className="app-button-secondary" onClick={closeEditModal}>
                Cancel
              </button>
              <button type="submit" className="app-button-primary" disabled={editSubmitting}>
                {editSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  )
}
