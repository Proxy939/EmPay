// src/pages/Settings.jsx — User Settings (Admin only)
// Admin can view all users and update their roles
import { useState, useEffect } from 'react'
import { Shield, Users, ToggleLeft, ToggleRight, ChevronDown, RefreshCw } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'

const ROLES = ['EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'ADMIN']

const ROLE_COLORS = {
  ADMIN:           'bg-purple-500/15 text-purple-400 border-purple-500/30',
  HR_OFFICER:      'bg-sky-500/15 text-sky-400 border-sky-500/30',
  PAYROLL_OFFICER: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  EMPLOYEE:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

const ROLE_LABELS = {
  ADMIN:           'Admin',
  HR_OFFICER:      'HR Officer',
  PAYROLL_OFFICER: 'Payroll Officer',
  EMPLOYEE:        'Employee',
}

function RoleTag({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${ROLE_COLORS[role] || ''}`}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

function UserRow({ user, currentUserId, onRoleChange, onToggleActive }) {
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [saved, setSaved] = useState(false)
  const isSelf = user.id === currentUserId
  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??'

  const handleRoleChange = async (newRole) => {
    setSelectedRole(newRole)
    if (newRole === user.role) return
    setSaving(true); setSaved(false)
    try {
      await onRoleChange(user.id, newRole)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSelectedRole(user.role) // revert on error
    }
    setSaving(false)
  }

  const handleToggle = async () => {
    setToggling(true)
    await onToggleActive(user.id, user.isActive)
    setToggling(false)
  }

  return (
    <tr className={`border-b border-border/40 transition-colors hover:bg-muted/20 ${!user.isActive ? 'opacity-50' : ''}`}>
      {/* User */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">
              {user.name}
              {isSelf && <span className="ml-1.5 text-[10px] text-primary font-semibold">(You)</span>}
            </p>
            <p className="text-[11px] text-muted-foreground">{user.employee?.designation || user.employee?.department || '—'}</p>
          </div>
        </div>
      </td>

      {/* Login ID */}
      <td className="px-5 py-3.5">
        <p className="text-xs font-mono text-muted-foreground">{user.loginId}</p>
      </td>

      {/* Email */}
      <td className="px-5 py-3.5">
        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
      </td>

      {/* Role — dropdown, disabled for self */}
      <td className="px-5 py-3.5">
        {isSelf ? (
          <RoleTag role={user.role} />
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedRole}
                onChange={e => handleRoleChange(e.target.value)}
                disabled={saving || isSelf}
                className="appearance-none text-xs font-medium pl-3 pr-8 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 cursor-pointer"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            </div>
            {saving && <div className="size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
            {saved  && <span className="text-[10px] text-emerald-500 font-semibold">✓ Saved</span>}
          </div>
        )}
      </td>

      {/* Active toggle */}
      <td className="px-5 py-3.5">
        <button
          onClick={handleToggle}
          disabled={toggling || isSelf}
          title={user.isActive ? 'Deactivate user' : 'Activate user'}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {toggling
            ? <div className="size-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            : user.isActive
              ? <ToggleRight className="size-5 text-emerald-500" />
              : <ToggleLeft  className="size-5 text-muted-foreground" />}
          <span>{user.isActive ? 'Active' : 'Inactive'}</span>
        </button>
      </td>
    </tr>
  )
}

export default function Settings() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('ALL')

  const me = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchUsers = () => {
    setLoading(true)
    api.get('/users')
      .then(r => setUsers(r.data.users))
      .catch(() => setError('Failed to load users. Make sure you are an Admin.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleRoleChange = async (userId, newRole) => {
    await api.patch(`/users/${userId}/role`, { role: newRole })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  const handleToggleActive = async (userId, currentActive) => {
    await api.patch(`/users/${userId}/toggle-active`)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentActive } : u))
  }

  // Filter + search
  const visible = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.loginId?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || u.role === filter
    return matchSearch && matchFilter
  })

  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length
    return acc
  }, {})

  return (
    <AppLayout title="User Settings">
      <div className="max-w-6xl mx-auto space-y-5 anim-fade-up">

        {/* ── Header info card ─────────────────────────────────────── */}
        <div className="rounded-xl border border-border/50 bg-card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">User Access Control</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign roles to control what each user can access.
                Role changes take effect on their next login.
              </p>
            </div>
          </div>
          {/* Role legend */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {ROLES.map(r => (
              <span key={r} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[r]}`}>
                {ROLE_LABELS[r]} · {counts[r] || 0}
              </span>
            ))}
          </div>
        </div>

        {/* ── Filters row ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or login ID…"
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-2 flex-wrap">
            {['ALL', ...ROLES].map(r => (
              <button key={r}
                onClick={() => setFilter(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors
                  ${filter === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
                {r === 'ALL' ? `All (${users.length})` : `${ROLE_LABELS[r]} (${counts[r] || 0})`}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={fetchUsers}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button className="mt-4" onClick={fetchUsers}>Retry</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Login ID</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-sm text-muted-foreground">
                        <Users className="size-8 mx-auto mb-2 opacity-30" />
                        No users found
                      </td>
                    </tr>
                  ) : visible.map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      currentUserId={me.id}
                      onRoleChange={handleRoleChange}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer note ──────────────────────────────────────────── */}
        <p className="text-[11px] text-muted-foreground text-center pb-2">
          You cannot change your own role · Role changes are effective on next login · Total: <span className="font-semibold text-foreground">{users.length}</span> users
        </p>

      </div>
    </AppLayout>
  )
}
