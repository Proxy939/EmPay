import { NavLink, useNavigate } from 'react-router-dom'
import {
  Users, Clock, PlaneTakeoff, Wallet, BarChart2, Settings, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Users,        label: 'Employees',  path: '/dashboard' },
  { icon: Clock,        label: 'Attendance', path: '/attendance' },
  { icon: PlaneTakeoff, label: 'Time Off',   path: '/time-off' },
  { icon: Wallet,       label: 'Payroll',    path: '/payroll' },
  { icon: BarChart2,    label: 'Reports',    path: '/reports' },
  { icon: Settings,     label: 'Settings',   path: '/settings' },
]

// Roles that can access each route (null = all roles)
const routeRoles = {
  '/payroll':  ['ADMIN', 'PAYROLL_OFFICER'],
  '/reports':  ['ADMIN', 'PAYROLL_OFFICER'],
  '/settings': ['ADMIN'],
}

export default function Sidebar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const role = user?.role || 'EMPLOYEE'

  const company = user?.companyName || 'EmPay'
  const companyInitials = company
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const visibleNav = navItems.filter((item) => {
    const allowed = routeRoles[item.path]
    return !allowed || allowed.includes(role)
  })

  return (
    <aside className="flex w-56 flex-col shrink-0 border-r border-sidebar-border bg-sidebar">
      {/* Company Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-inner shadow-white/10">
          <CreditCard className="size-4 text-primary-foreground" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
            {company}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
            HRMS
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
        {visibleNav.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground'
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — user info */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {companyInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">
              {user?.name || 'User'}
            </p>
            <p className="truncate text-[10px] text-muted-foreground capitalize">
              {role?.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
