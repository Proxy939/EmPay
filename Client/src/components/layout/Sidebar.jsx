import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, CreditCard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import AppIcon from './AppIcon'

const Collapsible = CollapsiblePrimitive.Root
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

// ── EmPay nav items ───────────────────────────────────────────────────────────
const menuItems = [
  { id: 'employees',  icon: 'Users',        title: 'Employees',  path: '/dashboard',  roles: null },
  { id: 'attendance', icon: 'Clock',        title: 'Attendance', path: '/attendance', roles: null },
  { id: 'time-off',   icon: 'PlaneTakeoff', title: 'Time Off',   path: '/time-off',   roles: null },
  { id: 'payroll',    icon: 'Wallet',       title: 'Payroll',    path: '/payroll',    roles: ['ADMIN', 'PAYROLL_OFFICER'] },
  { id: 'reports',    icon: 'BarChart2',    title: 'Reports',    path: '/reports',    roles: ['ADMIN', 'PAYROLL_OFFICER'] },
]

// ── Animation variants ────────────────────────────────────────────────────────
const sidebarVariants = {
  collapsed: { width: 64 },
  expanded:  { width: 260 },
}
const itemVariants = {
  collapsed: { opacity: 0, x: -10 },
  expanded:  { opacity: 1, x: 0 },
}

export default function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [isHovered,    setIsHovered]    = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState(new Set())

  // User from localStorage
  const user    = JSON.parse(localStorage.getItem('user') || '{}')
  const role    = user?.role || 'EMPLOYEE'
  const company = user?.companyName || 'EmPay'
  const initials = (user?.name || 'U')
    .split(' ').map((w) => w[0]).join('').toUpperCase().substring(0, 2)

  const isActive = useCallback(
    (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/'),
    [location.pathname]
  )

  const visibleItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  )
  const canSeeSettings = role === 'ADMIN'

  const toggleSubmenu = useCallback((title) => {
    setOpenSubmenus((prev) => {
      const next = new Set(prev)
      next.has(title) ? next.delete(title) : next.add(title)
      return next
    })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const go = (path) => navigate(path)

  // ── Expanded sidebar ────────────────────────────────────────────────────────
  const ExpandedContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.08 }}
      className="flex-1 flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <motion.div
          variants={itemVariants} initial="collapsed" animate="expanded"
          transition={{ delay: 0.12 }}
          className="flex items-center gap-3"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-inner shadow-white/10">
            <CreditCard className="size-4 text-primary-foreground" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{company}</h3>
            <p className="text-[10px] text-muted-foreground">Human Resource Management</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-0.5">
          <motion.div
            variants={itemVariants} initial="collapsed" animate="expanded"
            transition={{ delay: 0.1 }}
            className="px-2 pb-2 pt-1"
          >
            <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              HR Management
            </h2>
          </motion.div>

          {visibleItems.map((item, i) => (
            <motion.div
              key={item.id}
              variants={itemVariants} initial="collapsed" animate="expanded"
              transition={{ delay: 0.1 + i * 0.03 }}
            >
              {item.submenu ? (
                <Collapsible
                  open={openSubmenus.has(item.title)}
                  onOpenChange={() => toggleSubmenu(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={`flex items-center justify-between w-full h-10 px-3 rounded-lg transition-all duration-150 group ${
                        isActive(item.path)
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <AppIcon name={item.icon} className="size-4 shrink-0" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <motion.div animate={{ rotate: openSubmenus.has(item.title) ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="size-3.5" />
                      </motion.div>
                    </button>
                  </CollapsibleTrigger>
                  <AnimatePresence>
                    {openSubmenus.has(item.title) && (
                      <CollapsibleContent asChild>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-8 mt-0.5 space-y-0.5"
                        >
                          {item.submenu.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => go(sub.path)}
                              className={`flex items-center gap-2.5 h-9 px-3 rounded-lg transition-all duration-150 w-full text-sm font-medium ${
                                isActive(sub.path)
                                  ? 'bg-primary/15 text-primary border-r-2 border-primary'
                                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                              }`}
                            >
                              <AppIcon name={sub.icon} className="size-3.5 shrink-0" />
                              {sub.title}
                            </button>
                          ))}
                        </motion.div>
                      </CollapsibleContent>
                    )}
                  </AnimatePresence>
                </Collapsible>
              ) : (
                <button
                  onClick={() => go(item.path)}
                  className={`flex items-center gap-2.5 h-10 px-3 rounded-lg transition-all duration-150 w-full ${
                    isActive(item.path)
                      ? 'bg-primary/15 text-primary border-r-2 border-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <AppIcon name={item.icon} className="size-4 shrink-0" />
                  <span className="text-sm font-medium">{item.title}</span>
                </button>
              )}
            </motion.div>
          ))}

          {/* System section */}
          {canSeeSettings && (
            <motion.div
              variants={itemVariants} initial="collapsed" animate="expanded"
              transition={{ delay: 0.22 }}
            >
              <div className="px-2 pb-1 pt-4">
                <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  System
                </h2>
              </div>
              <button
                onClick={() => go('/settings')}
                className={`flex items-center gap-2.5 h-10 px-3 rounded-lg transition-all duration-150 w-full ${
                  isActive('/settings')
                    ? 'bg-primary/15 text-primary border-r-2 border-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Settings className="size-4 shrink-0" />
                <span className="text-sm font-medium">Settings</span>
              </button>
            </motion.div>
          )}
        </nav>
      </ScrollArea>

      {/* Bottom — user profile */}
      <div className="border-t border-border p-3 mt-auto">
        <motion.div
          variants={itemVariants} initial="collapsed" animate="expanded"
          transition={{ delay: 0.25 }}
          className="flex items-center gap-2.5 rounded-lg bg-accent/40 p-2.5"
        >
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={user?.employee?.profilePhoto} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email || ''}</p>
          </div>
          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={handleLogout}>
            <LogOut className="size-3.5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )

  // ── Collapsed sidebar ───────────────────────────────────────────────────────
  const CollapsedContent = (
    <div className="pt-4 px-2.5 flex flex-col h-full items-center">
      {/* Logo icon */}
      <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-primary shadow-inner shadow-white/10">
        <CreditCard className="size-4 text-primary-foreground" strokeWidth={2} />
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {visibleItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            title={item.title}
          >
            <button
              onClick={() => go(item.path)}
              className={`flex size-10 items-center justify-center rounded-lg transition-all duration-150 ${
                isActive(item.path)
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <AppIcon name={item.icon} className="size-4 shrink-0" />
            </button>
          </motion.div>
        ))}
      </nav>

      {/* Settings icon (collapsed) */}
      {canSeeSettings && (
        <div className="pb-2" title="Settings">
          <button
            onClick={() => go('/settings')}
            className={`flex size-10 items-center justify-center rounded-lg transition-all duration-150 ${
              isActive('/settings')
                ? 'bg-primary/15 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Settings className="size-4 shrink-0" />
          </button>
        </div>
      )}

      {/* User avatar (collapsed) */}
      <div className="border-t border-border pb-3 pt-2 mt-auto w-full flex justify-center">
        <Avatar className="size-9">
          <AvatarImage src={user?.employee?.profilePhoto} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )

  return (
    <motion.div
      className="fixed left-0 top-0 h-screen z-20 bg-background/95 backdrop-blur-md border-r border-border shadow-lg flex flex-col overflow-hidden"
      variants={sidebarVariants}
      animate={isHovered ? 'expanded' : 'collapsed'}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {isHovered ? (
          <motion.div key="expanded" className="flex-1 flex flex-col h-full">
            {ExpandedContent}
          </motion.div>
        ) : (
          <motion.div key="collapsed" className="flex-1 flex flex-col h-full">
            {CollapsedContent}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
