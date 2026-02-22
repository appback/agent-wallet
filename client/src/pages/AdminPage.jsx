import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, getUser } from '../api'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'

const TABS = ['Overview', 'Expenses', 'Users', 'Sponsorship', 'Bonus Policies']

export default function AdminPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState('Overview')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = getUser()
    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true })
      return
    }
    authApi.get('/admin/stats')
      .then(r => setStats(r.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container"><Loading /></div>

  const fmt = n => Number(n).toLocaleString()

  return (
    <div className="container animate-fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>

      {/* Stats cards — always visible */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{fmt(stats.total_users)}</div>
            <div className="stat-label">Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{fmt(stats.total_gem_issued)}</div>
            <div className="stat-label">Gem Issued</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{fmt(stats.total_sponsored)}</div>
            <div className="stat-label">Sponsored (KRW)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{fmt(stats.total_expenses)}</div>
            <div className="stat-label">Expenses (KRW)</div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '6px 14px' }}
            onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab />}
      {tab === 'Expenses' && <ExpensesTab toast={toast} />}
      {tab === 'Users' && <UsersTab toast={toast} />}
      {tab === 'Sponsorship' && <SponsorshipTab />}
      {tab === 'Bonus Policies' && <BonusPoliciesTab toast={toast} />}
    </div>
  )
}

/* ───── Overview ───── */
function OverviewTab() {
  return (
    <section className="section">
      <p className="text-muted">Select a tab above to manage platform data.</p>
    </section>
  )
}

/* ───── Expenses ───── */
function ExpensesTab({ toast }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expForm, setExpForm] = useState({ category: 'server', amount: '', description: '', expense_date: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    authApi.get('/sponsorship/public/expenses', { limit: 100 })
      .then(r => setExpenses(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmt = n => Number(n).toLocaleString()

  async function handleAdd(e) {
    e.preventDefault()
    if (!expForm.amount) return
    setSubmitting(true)
    try {
      const res = await authApi.post('/sponsorship/admin/expense', {
        category: expForm.category,
        amount: parseInt(expForm.amount),
        description: expForm.description || undefined,
        expense_date: expForm.expense_date || undefined
      })
      setExpenses(prev => [res.data.expense, ...prev])
      setExpForm({ category: 'server', amount: '', description: '', expense_date: '' })
      toast.success('Expense added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return
    try {
      await authApi.delete(`/admin/expenses/${id}`)
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Expense deleted')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  if (loading) return <Loading />

  return (
    <section className="section">
      <h2>Add Platform Expense</h2>
      <form onSubmit={handleAdd} className="card" style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={expForm.category}
              onChange={e => setExpForm(prev => ({ ...prev, category: e.target.value }))}>
              <option value="server">Server</option>
              <option value="domain">Domain</option>
              <option value="service">Service</option>
              <option value="etc">Etc</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (KRW)</label>
            <input className="form-input" type="number" min="1" required
              value={expForm.amount} onChange={e => setExpForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="10000" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" type="text"
              value={expForm.description} onChange={e => setExpForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="AWS EC2 Feb 2026" />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date"
              value={expForm.expense_date} onChange={e => setExpForm(prev => ({ ...prev, expense_date: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Adding...' : 'Add Expense'}
        </button>
      </form>

      {expenses.length > 0 && (
        <div className="table-wrapper" style={{ marginTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Description</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td><span className="badge">{e.category}</span></td>
                  <td style={{ textAlign: 'right' }}>{fmt(e.amount)}</td>
                  <td>{e.description || '-'}</td>
                  <td>{new Date(e.expense_date).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: '2px 8px' }}
                      onClick={() => handleDelete(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/* ───── Users ───── */
function UsersTab({ toast }) {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const currentUser = getUser()

  function load(page = 1, q = search) {
    setLoading(true)
    const params = { page, limit: 20 }
    if (q) params.search = q
    authApi.get('/admin/users', params)
      .then(r => {
        setUsers(r.data.data)
        setPagination(r.data.pagination)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function handleSearch(e) {
    e.preventDefault()
    load(1, search)
  }

  async function toggleRole(user) {
    const newRole = user.role === 'admin' ? 'player' : 'admin'
    if (!confirm(`Change ${user.email} role to ${newRole}?`)) return
    try {
      const res = await authApi.patch(`/admin/users/${user.id}/role`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: res.data.user.role } : u))
      toast.success(`Role updated to ${newRole}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const fmt = n => Number(n).toLocaleString()

  return (
    <section className="section">
      <h2>Users</h2>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="form-input" type="text" placeholder="Search email or name..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      {loading ? <Loading /> : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Display Name</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Gem</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.display_name || '-'}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-live' : ''}`}>{u.role}</span></td>
                    <td style={{ textAlign: 'right' }}>{fmt(u.gem_balance)}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      {u.id !== currentUser?.userId && (
                        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '2px 8px' }}
                          onClick={() => toggleRole(u)}>
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <button className="btn btn-secondary" disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}>Prev</button>
              <span className="text-muted">{pagination.page} / {pagination.totalPages}</span>
              <button className="btn btn-secondary" disabled={pagination.page >= pagination.totalPages}
                onClick={() => load(pagination.page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

/* ───── Sponsorship Orders ───── */
function SponsorshipTab() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  function load(page = 1) {
    setLoading(true)
    const params = { page, limit: 20 }
    if (status) params.status = status
    authApi.get('/admin/sponsorship/orders', params)
      .then(r => {
        setOrders(r.data.data)
        setPagination(r.data.pagination)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [status])

  const fmt = n => Number(n).toLocaleString()

  return (
    <section className="section">
      <h2>Sponsorship Orders</h2>
      <div style={{ marginBottom: 16 }}>
        <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}
          style={{ maxWidth: 200 }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="rewarded">Rewarded</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th style={{ textAlign: 'right' }}>Amount (KRW)</th>
                  <th style={{ textAlign: 'right' }}>Gem</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center' }}>No orders</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id}>
                    <td>{o.display_name || o.email}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(o.amount)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(o.gem_reward)}</td>
                    <td><span className={`badge ${o.status === 'rewarded' ? 'badge-live' : ''}`}>{o.status}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <button className="btn btn-secondary" disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}>Prev</button>
              <span className="text-muted">{pagination.page} / {pagination.totalPages}</span>
              <button className="btn btn-secondary" disabled={pagination.page >= pagination.totalPages}
                onClick={() => load(pagination.page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

/* ───── Bonus Policies ───── */
function BonusPoliciesTab({ toast }) {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState({})

  useEffect(() => {
    authApi.get('/admin/bonus-policies')
      .then(r => setPolicies(r.data.policies))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function startEdit(p) {
    setEditing(prev => ({ ...prev, [p.id]: { amount: p.amount, is_active: p.is_active } }))
  }

  function cancelEdit(id) {
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  async function saveEdit(id) {
    const ed = editing[id]
    if (!ed) return
    try {
      const res = await authApi.patch(`/admin/bonus-policies/${id}`, {
        amount: parseInt(ed.amount),
        is_active: ed.is_active
      })
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, ...res.data.policy } : p))
      cancelEdit(id)
      toast.success('Policy updated')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    }
  }

  const fmt = n => Number(n).toLocaleString()

  if (loading) return <Loading />

  return (
    <section className="section">
      <h2>Bonus Policies</h2>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Cooldown</th>
              <th>Max Claims</th>
              <th style={{ textAlign: 'right' }}>Claims</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {policies.map(p => {
              const ed = editing[p.id]
              return (
                <tr key={p.id}>
                  <td>{p.code}</td>
                  <td style={{ textAlign: 'right' }}>
                    {ed ? (
                      <input className="form-input" type="number" min="1"
                        value={ed.amount} style={{ width: 80, textAlign: 'right' }}
                        onChange={e => setEditing(prev => ({ ...prev, [p.id]: { ...prev[p.id], amount: e.target.value } }))} />
                    ) : fmt(p.amount)}
                  </td>
                  <td>{p.cooldown_seconds ? `${Math.round(p.cooldown_seconds / 3600)}h` : 'One-time'}</td>
                  <td>{p.max_claims ?? 'Unlimited'}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(p.claim_count)}</td>
                  <td>
                    {ed ? (
                      <input type="checkbox" checked={ed.is_active}
                        onChange={e => setEditing(prev => ({ ...prev, [p.id]: { ...prev[p.id], is_active: e.target.checked } }))} />
                    ) : (
                      <span className={`badge ${p.is_active ? 'badge-live' : 'badge-inactive'}`}>
                        {p.is_active ? 'Yes' : 'No'}
                      </span>
                    )}
                  </td>
                  <td>
                    {ed ? (
                      <span style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-primary" style={{ fontSize: 12, padding: '2px 8px' }}
                          onClick={() => saveEdit(p.id)}>Save</button>
                        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '2px 8px' }}
                          onClick={() => cancelEdit(p.id)}>Cancel</button>
                      </span>
                    ) : (
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '2px 8px' }}
                        onClick={() => startEdit(p)}>Edit</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
