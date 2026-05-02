import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, CreditCard, Users, Clock, PlaneTakeoff, Wallet, BarChart2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { useTheme } from '@/lib/theme'

const Collapsible        = CollapsiblePrimitive.Root
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent


// ── EmPay nav items ───────────────────────────────────────────────────────────
const menuItems = [
  { id: 'employees',  icon: Users,        title: 'Employees',  path: '/dashboard'  },
  { id: 'attendance', icon: Clock,        title: 'Attendance', path: '/attendance' },
  { id: 'time-off',   icon: PlaneTakeoff, title: 'Time Off',   path: '/time-off'   },
  { id: 'payroll',    icon: Wallet,       title: 'Payroll',    path: '/payroll',   roles: ['ADMIN','PAYROLL_OFFICER'] },
  { id: 'reports',    icon: BarChart2,    title: 'Reports',    path: '/reports',   roles: ['ADMIN','PAYROLL_OFFICER'] },
]

// ── Animations ────────────────────────────────────────────────────────────────
const sidebarVariants = {
  collapsed: { width: 64  },
  expanded:  { width: 256 },
}
const itemVariants = {
  collapsed: { opacity: 0, x: -8 },
  expanded:  { opacity: 1, x: 0  },
}

export default function Sidebar() {
  const { colors: S } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [isHovered, setIsHovered] = useState(false)

  const user    = JSON.parse(localStorage.getItem('user') || '{}')
  const role    = user?.role || 'EMPLOYEE'
  const company = user?.companyName || 'EmPay'
  const name    = user?.name || 'User'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)
  const coInitials = company.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)

  const isActive = useCallback(
    (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/'),
    [location.pathname]
  )

  const visibleItems = menuItems.filter(item => !item.roles || item.roles.includes(role))
  const canSeeSettings = role === 'ADMIN'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const go = (path) => navigate(path)

  // ── Nav button helper ─────────────────────────────────────────────────────
  const NavBtn = ({ icon: Icon, label, path, delay = 0 }) => {
    const active = isActive(path)
    return (
      <motion.button
        variants={itemVariants}
        initial="collapsed"
        animate={isHovered ? 'expanded' : 'collapsed'}
        transition={{ delay }}
        onClick={() => go(path)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
          padding: '9px 10px', borderRadius: 10,
          background: active ? S.accentL : 'transparent',
          color: active ? S.accent : S.muted,
          fontWeight: active ? 600 : 500, fontSize: 14,
          transition: 'background .15s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = S.hover }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        <Icon
          size={16} strokeWidth={active ? 2.2 : 1.8}
          color={active ? S.accent : S.muted}
          style={{ flexShrink: 0 }}
        />
        {isHovered && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{label}</span>}
        {active && isHovered && (
          <span style={{ marginLeft: 'auto', width: 4, height: 20, borderRadius: 4, background: S.accent, flexShrink: 0 }} />
        )}
      </motion.button>
    )
  }

  // ── Expanded content ──────────────────────────────────────────────────────
  const ExpandedContent = (
    <motion.div
      key="expanded"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '20px 14px 12px', borderBottom: `1px solid ${S.border}` }}>
        <motion.div
          variants={itemVariants} initial="collapsed" animate="expanded" transition={{ delay: 0.1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{ width: 34, height: 34, background: S.accent, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CreditCard size={17} color="white" strokeWidth={2} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: S.text }}>Em<span style={{ color: S.accent }}>Pay</span></p>
            <p style={{ margin: 0, fontSize: 10, color: S.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>HRMS</p>
          </div>
        </motion.div>
      </div>

      {/* Company switcher */}
      <div style={{ padding: '10px 10px 0' }}>
        <motion.div
          variants={itemVariants} initial="collapsed" animate="expanded" transition={{ delay: 0.12 }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, background: S.hover || '#f8f8ff',
            border: `1px solid ${S.border}`, borderRadius: 10, padding: '9px 11px', cursor: 'pointer' }}
        >
          <div style={{ width: 30, height: 30, background: S.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
            {coInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 12, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company}</p>
            <p style={{ margin: 0, fontSize: 10, color: S.muted }}>{role.replace('_', ' ')}</p>
          </div>
          <ChevronDown size={13} color={S.muted} style={{ flexShrink: 0 }} />
        </motion.div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {/* Section label */}
        <motion.p
          variants={itemVariants} initial="collapsed" animate="expanded" transition={{ delay: 0.13 }}
          style={{ margin: '10px 4px 6px', fontSize: 10, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Main Menu
        </motion.p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleItems.map((item, i) => (
            <NavBtn key={item.id} icon={item.icon} label={item.title} path={item.path} delay={0.14 + i * 0.03} />
          ))}
        </div>

        {canSeeSettings && (
          <>
            <motion.p
              variants={itemVariants} initial="collapsed" animate="expanded" transition={{ delay: 0.26 }}
              style={{ margin: '14px 4px 6px', fontSize: 10, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              System
            </motion.p>
            <NavBtn icon={Settings} label="Settings" path="/settings" delay={0.27} />
          </>
        )}


      </div>

      {/* User profile */}
      <div style={{ borderTop: `1px solid ${S.border}`, padding: '10px 10px 14px' }}>
        <motion.div
          variants={itemVariants} initial="collapsed" animate="expanded" transition={{ delay: 0.28 }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, background: S.hover || '#fafafa', borderRadius: 10, padding: '9px 11px' }}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 12, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
            <p style={{ margin: 0, fontSize: 10, color: S.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: S.muted, display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <LogOut size={14} color={S.muted} />
          </button>
        </motion.div>
      </div>
    </motion.div>
  )

  // ── Collapsed content ─────────────────────────────────────────────────────
  const CollapsedContent = (
    <motion.div
      key="collapsed"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 2 }}
    >
      {/* Logo icon */}
      <div style={{ width: 36, height: 36, background: S.accent, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <CreditCard size={17} color="white" strokeWidth={2} />
      </div>

      {/* Nav icons */}
      {visibleItems.map((item, i) => {
        const active = isActive(item.path)
        return (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            title={item.title}
            onClick={() => go(item.path)}
            style={{
              width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? S.accentL : 'transparent',
              transition: 'background .15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = S.hover }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
          >
            <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} color={active ? S.accent : S.muted} />
          </motion.button>
        )
      })}

      {/* Settings */}
      {canSeeSettings && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          title="Settings"
          onClick={() => go('/settings')}
          style={{
            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive('/settings') ? S.accentL : 'transparent',
            transition: 'background .15s',
          }}
        >
          <Settings size={17} color={isActive('/settings') ? S.accent : S.muted} strokeWidth={isActive('/settings') ? 2.2 : 1.8} />
        </motion.button>
      )}



      {/* Avatar at bottom */}
      <div style={{ marginTop: 'auto', borderTop: `1px solid ${S.border}`, paddingTop: 12, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>
          {initials}
        </div>
      </div>
    </motion.div>
  )

  return (
    <motion.div
      style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 20,
        background: S.bg,
        borderRight: `1px solid ${S.border}`,
        boxShadow: '2px 0 12px rgba(108,92,231,0.06)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
      variants={sidebarVariants}
      animate={isHovered ? 'expanded' : 'collapsed'}
      transition={{ duration: 0.26, ease: 'easeInOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {isHovered ? ExpandedContent : CollapsedContent}
      </AnimatePresence>
    </motion.div>
  )
}
