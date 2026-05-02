import { useState, useEffect } from 'react'
import { Search, UserPlus, RefreshCw } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'

// ── Work Status Config ────────────────────────────────────────────────────────
const STATUS = {
  CHECKED_IN:  { color: 'bg-emerald-500',  ring: 'ring-emerald-500/40', label: 'Present'     },
  CHECKED_OUT: { color: 'bg-slate-400',    ring: 'ring-slate-400/40',   label: 'Checked Out' },
  ON_LEAVE:    { color: 'bg-sky-400',      ring: 'ring-sky-400/40',     label: 'On Leave'    },
  ABSENT:      { color: 'bg-amber-400',    ring: 'ring-amber-400/40',   label: 'Absent'      },
}

// ── Employee Card ─────────────────────────────────────────────────────────────
function EmployeeCard({ employee }) {
  const { firstName, lastName, designation, department, profilePhoto, workStatus, user } = employee
  const fullName = `${firstName} ${lastName}`
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase()
  const status = STATUS[workStatus] || STATUS.ABSENT

  return (
    <div className="group relative flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer">
      {/* Status dot — top right */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          {status.label}
        </span>
        <span className={`size-2.5 rounded-full ${status.color} ring-2 ${status.ring} shadow-sm`} />
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
          {profilePhoto ? (
            <img src={profilePhoto} alt={fullName} className="size-full rounded-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-primary">{initials}</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="w-full text-center space-y-0.5">
        <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
        {designation && (
          <p className="text-xs text-muted-foreground truncate">{designation}</p>
        )}
        {department && (
          <p className="text-[11px] text-muted-foreground/70 truncate">{department}</p>
        )}
      </div>

      {/* Login ID badge */}
      {user?.loginId && (
        <span className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
          {user.loginId}
        </span>
      )}
    </div>
  )
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-5">
      <Skeleton className="size-16 rounded-full" />
      <div className="w-full space-y-2">
        <Skeleton className="h-3.5 w-3/4 mx-auto rounded" />
        <Skeleton className="h-3 w-1/2 mx-auto rounded" />
        <Skeleton className="h-3 w-2/3 mx-auto rounded" />
      </div>
      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [error, setError]         = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const role = user?.role || 'EMPLOYEE'
  const canAddEmployee = role === 'ADMIN' || role === 'HR_OFFICER'

  const fetchEmployees = async (q = '') => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/employees', { params: q ? { search: q } : {} })
      setEmployees(res.data.employees || [])
    } catch {
      setError('Failed to load employees. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmployees() }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchEmployees(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Status summary counts
  const counts = employees.reduce((acc, e) => {
    acc[e.workStatus] = (acc[e.workStatus] || 0) + 1
    return acc
  }, {})

  const topBarActions = (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="relative w-56">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Search employees…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-xs bg-input/50"
        />
      </div>

      {/* Refresh */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => fetchEmployees(search)}
        disabled={loading}
      >
        <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      {/* Add new — Admin / HR only */}
      {canAddEmployee && (
        <Button size="sm" className="h-8 gap-1.5 text-xs font-medium">
          <UserPlus className="size-3.5" />
          New Employee
        </Button>
      )}
    </div>
  )

  return (
    <AppLayout title="Employees" actions={topBarActions}>

      {/* Status summary strip */}
      {!loading && employees.length > 0 && (
        <div className="mb-5 flex gap-3 flex-wrap anim-fade-up">
          {[
            { key: 'CHECKED_IN',  label: 'Present',     color: 'text-emerald-500' },
            { key: 'ON_LEAVE',    label: 'On Leave',     color: 'text-sky-400' },
            { key: 'ABSENT',      label: 'Absent',       color: 'text-amber-400' },
            { key: 'CHECKED_OUT', label: 'Checked Out',  color: 'text-slate-400' },
          ].map(({ key, label, color }) => (
            counts[key] ? (
              <span key={key} className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className={`font-bold ${color}`}>{counts[key]}</span>
                {label}
              </span>
            ) : null
          ))}
          <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="font-bold text-foreground">{employees.length}</span>
            Total
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
          : employees.map((emp, i) => (
              <div key={emp.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <EmployeeCard employee={emp} />
              </div>
            ))
        }
      </div>

      {/* Empty state */}
      {!loading && employees.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center anim-fade-up">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted/40 mb-4">
            <Search className="size-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            {search ? 'No results found' : 'No employees yet'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {search
              ? `No employees match "${search}". Try a different search.`
              : 'Add your first employee to get started.'}
          </p>
          {canAddEmployee && !search && (
            <Button className="mt-5 gap-2" size="sm">
              <UserPlus className="size-4" />
              Add First Employee
            </Button>
          )}
        </div>
      )}
    </AppLayout>
  )
}
