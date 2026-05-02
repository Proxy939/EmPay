import { useState, useEffect } from 'react'
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal'
import api from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'

// ── Google Font ──────────────────────────────────────────────────────────────
const FONT_LINK = document.createElement('link')
FONT_LINK.rel = 'stylesheet'
FONT_LINK.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'
document.head.appendChild(FONT_LINK)

// ── Constants ────────────────────────────────────────────────────────────────
const C = {
  nav:      '#1a1d23',
  navBorder:'#2a2d35',
  teal:     '#00b4d8',
  tealBg:   '#e0f7fc',
  amber:    '#f59e0b',
  orange:   '#f97316',
  red:      '#ef4444',
  green:    '#22c55e',
  blue:     '#3b82f6',
  blueLight:'#eff6ff',
  orangeL:  '#fff7ed',
  greenL:   '#f0fdf4',
  white:    '#ffffff',
  bg:       '#f4f5f7',
  text:     '#1a1d23',
  muted:    '#6b7280',
  border:   '#e5e7eb',
  rowHover: '#f0f9ff',
  pill:     '#f3f4f6',
}

const AVT_COLORS = ['#6C5CE7','#0984e3','#00b894','#e17055','#fdcb6e','#fd79a8','#00b4d8','#a29bfe','#55efc4']
const avColor = (name) => AVT_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1)||0)) % AVT_COLORS.length]

// ── Helpers ──────────────────────────────────────────────────────────────────
function to12hr(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}
function fmtH(h) {
  if (h == null || h <= 0) return '—'
  const hrs = Math.floor(h), mins = Math.round((h - hrs) * 60)
  return `${hrs}h${mins > 0 ? ' ' + mins + 'm' : ''}`
}

// Parse clock time to determine color
function clockInColor(t) {
  const h = parseInt(t.split(':')[0])
  const ampm = t.split(' ')[1]
  const hour24 = ampm === 'PM' && h !== 12 ? h + 12 : (ampm === 'AM' && h === 12 ? 0 : h)
  return hour24 > 9 ? C.orange : C.text
}
function clockOutColor(t) {
  const h = parseInt(t.split(':')[0])
  const ampm = t.split(' ')[1]
  const hour24 = ampm === 'PM' && h !== 12 ? h + 12 : (ampm === 'AM' && h === 12 ? 0 : h)
  return hour24 < 18 ? C.red : C.text
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 32 }) {
  const parts = name.trim().split(' ')
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.34, flexShrink: 0,
      textTransform: 'uppercase',
    }}>
      {initials.toUpperCase()}
    </div>
  )
}

// ── Top Navigation Bar ───────────────────────────────────────────────────────
function TopNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'attendance', label: 'Attendance' },
    { id: 'overtime',   label: 'Overtime',   badge: 32 },
    { id: 'leave',      label: 'Leave',      badge: 55 },
    { id: 'worktime',   label: 'Work Time' },
  ]
  return (
    <div style={{
      background: C.nav, height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', borderBottom: `1px solid ${C.navBorder}`,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: C.teal,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, padding: 6,
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 2 }} />
          ))}
        </div>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>EmPay</span>
      </div>

      {/* Center: Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#2a2d35', borderRadius: 30, padding: '4px 6px' }}>
        {tabs.map(tab => {
          const active = tab.id === activeTab
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 24, border: 'none', cursor: 'pointer',
                background: active ? '#fff' : 'transparent',
                color: active ? C.text : '#9ca3af',
                fontWeight: active ? 700 : 500, fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all .15s',
              }}>
              {tab.label}
              {tab.badge && (
                <span style={{
                  background: C.teal, color: '#fff',
                  borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Right: Add button */}
      <button style={{
        width: 34, height: 34, borderRadius: '50%', border: 'none',
        background: C.amber, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, color: '#fff', fontWeight: 300, lineHeight: 1,
        boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
      }}>+</button>
    </div>
  )
}

// ── Page Header ──────────────────────────────────────────────────────────────
function PageHeader({ currentDate, onPrev, onNext }) {
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const d      = currentDate
  const label  = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`

  return (
    <div style={{
      background: C.white, borderBottom: `1px solid ${C.border}`,
      padding: '14px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Title */}
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Attendance</h1>

      {/* Date navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onPrev} style={navBtnStyle}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 14, color: C.text, minWidth: 200, textAlign: 'center' }}>
          {label}
        </span>
        <button onClick={onNext} style={navBtnStyle}>›</button>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          border: `1px solid ${C.border}`, background: C.white,
          color: C.text, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          📋 Attendance Report
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          border: 'none', background: C.teal,
          color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 2px 8px rgba(0,180,216,0.3)',
        }}>
          👤 Add
        </button>
      </div>
    </div>
  )
}

const navBtnStyle = {
  width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`,
  background: C.white, cursor: 'pointer', fontSize: 16, color: C.muted,
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
}

// ── Summary Cards ────────────────────────────────────────────────────────────
function StatCol({ label, value, trend, positive }) {
  const trendColor = trend.startsWith('0') ? C.muted : positive ? '#16a34a' : C.red
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '0 12px', borderRight: `1px solid ${C.border}` }}>
      <p style={{ margin: '0 0 2px', fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</p>
      <p style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: C.text }}>{value}</p>
      <p style={{ margin: 0, fontSize: 11, color: trendColor, fontWeight: 500 }}>{trend}</p>
    </div>
  )
}

function SummaryCard({ icon, iconColor, iconBg, title, stats }) {
  return (
    <div style={{
      background: C.white, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      padding: '16px 20px', flex: 1,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{title}</span>
        </div>
        <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.muted, fontSize: 18, lineHeight: 1 }}>···</button>
      </div>
      <div style={{ display: 'flex' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            borderRight: i < stats.length - 1 ? `1px solid ${C.border}` : 'none',
            padding: '0 8px',
          }}>
            <p style={{ margin: '0 0 2px', fontSize: 11, color: C.muted, fontWeight: 500 }}>{s.label}</p>
            <p style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: C.text }}>{s.value}</p>
            <p style={{
              margin: 0, fontSize: 11, fontWeight: 500,
              color: s.trend.startsWith('0') ? C.muted : s.up ? '#16a34a' : C.red,
            }}>{s.trend}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ search, onSearch }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '0 0 260px' }}>
        <span style={{
          position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, color: C.muted, pointerEvents: 'none',
        }}>🔍</span>
        <input
          value={search} onChange={e => onSearch(e.target.value)}
          placeholder="Search employee"
          style={{
            width: '100%', height: 36, paddingLeft: 32, paddingRight: 12,
            borderRadius: 8, border: `1px solid ${C.border}`,
            background: '#f9fafb', color: C.text, fontSize: 13, outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            boxSizing: 'border-box',
          }}
        />
      </div>
      {/* Date Range */}
      <button style={filterBtnStyle}>📅 Date Range ▼</button>
      {/* Advance Filter */}
      <button style={filterBtnStyle}>🎛 Advance Filter ▼</button>
    </div>
  )
}

const filterBtnStyle = {
  padding: '7px 14px', borderRadius: 20, border: `1px solid ${C.border}`,
  background: C.white, color: C.text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
}

// ── Table Header Cell ─────────────────────────────────────────────────────────
function TH({ children }) {
  return (
    <th style={{
      padding: '11px 16px', textAlign: 'left',
      fontSize: 11, fontWeight: 700, color: C.muted,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      borderBottom: `1px solid ${C.border}`,
      background: '#fafafa', whiteSpace: 'nowrap',
    }}>
      {children} <span style={{ opacity: 0.5, fontSize: 10 }}>⇅</span>
    </th>
  )
}

// ── Table Row ─────────────────────────────────────────────────────────────────
function TRow({ row, even, onClick }) {
  const [hovered, setHovered] = useState(false)
  const inColor  = clockInColor(row.clockIn)
  const outColor = clockOutColor(row.clockOut)

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.rowHover : even ? '#fafafa' : C.white,
        transition: 'background .12s',
        cursor: 'pointer',
      }}
    >
      {/* Employee Name + ID */}
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={row.name} size={34} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{row.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{row.loginId}</p>
          </div>
        </div>
      </td>

      {/* Clock In & Out */}
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ color: inColor, fontWeight: 600 }}>{row.clockIn}</span>
          <span style={{
            background: C.pill, color: C.muted,
            borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600,
          }}>
            {row.duration}
          </span>
          <span style={{ color: C.muted, fontSize: 11 }}>——→</span>
          <span style={{ color: outColor, fontWeight: 600 }}>{row.clockOut}</span>
        </div>
      </td>

      {/* Extra Hours */}
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: row.extra === '—' ? C.muted : C.teal }}>
        {row.extra}
      </td>

      {/* Profile */}
      <td style={{ padding: '12px 16px' }}>
        <span style={{ color: C.teal, fontSize: 12, cursor: 'pointer' }}>
          📎 {row.profile}
        </span>
      </td>

      {/* Location */}
      <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        📍 {row.location}
      </td>

      {/* Note */}
      <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {row.note}
      </td>
    </tr>
  )
}

// ── Main Attendance Page ──────────────────────────────────────────────────────
export default function Attendance() {
  const me = JSON.parse(localStorage.getItem('user') || '{}')
  const isPrivileged = ['ADMIN','HR_OFFICER','PAYROLL_OFFICER'].includes(me?.role)

  const [activeTab,    setActiveTab]    = useState('attendance')
  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [search,       setSearch]       = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [selectedIdx,  setSelectedIdx]  = useState(0)
  const [rows,         setRows]         = useState([])
  const [summary,      setSummary]      = useState({ present:0, halfDay:0, absent:0, total:0, daysPresent:0, leavesCount:0, totalWorkingDays:0 })
  const [loading,      setLoading]      = useState(true)

  const goDate = (delta) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + delta)
    setCurrentDate(d)
  }

  // Fetch real data
  useEffect(() => {
    setLoading(true)
    if (isPrivileged) {
      const dateStr = currentDate.toISOString().slice(0,10)
      api.get(`/attendance/day?date=${dateStr}`)
        .then(r => {
          setSummary(r.data.summary || {})
          setRows((r.data.attendees || []).map(a => ({
            id:       a.id,
            name:     a.employee.name,
            loginId:  a.employee.loginId || '—',
            clockIn:  to12hr(a.checkIn),
            clockOut: to12hr(a.checkOut),
            duration: fmtH(a.workingHours),
            extra:    fmtH(a.extraHours),
            profile:  a.employee.designation || '—',
            location: a.employee.department  || '—',
            note:     a.status,
          })))
        })
        .catch(() => setRows([]))
        .finally(() => setLoading(false))
    } else {
      const now = new Date()
      api.get(`/attendance/me?month=${now.getMonth()+1}&year=${now.getFullYear()}`)
        .then(r => {
          setSummary(r.data.summary || {})
          setRows((r.data.records || []).map(rec => ({
            id:       rec.id,
            name:     new Date(rec.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
            loginId:  new Date(rec.date).toLocaleDateString('en-IN',{weekday:'short'}),
            clockIn:  rec.checkIn  || '—',
            clockOut: rec.checkOut || '—',
            duration: fmtH(rec.workingHours),
            extra:    fmtH(rec.extraHours),
            profile:  rec.status,
            location: '—',
            note:     '—',
          })))
        })
        .catch(() => setRows([]))
        .finally(() => setLoading(false))
    }
  }, [currentDate])

  const filtered = search
    ? rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.loginId.toLowerCase().includes(search.toLowerCase()))
    : rows

  const summaryCards = isPrivileged ? [
    {
      icon: '📋', iconBg: C.blueLight, title: 'Present',
      stats: [
        { label: 'Present',  value: summary.present  ?? 0, trend: 'Total checked in', up: true },
        { label: 'Half Day', value: summary.halfDay  ?? 0, trend: 'Less than 4 hrs',  up: null },
      ],
    },
    {
      icon: '⚠️', iconBg: C.orangeL, title: 'Not Present',
      stats: [
        { label: 'Absent',  value: summary.absent ?? 0, trend: 'No attendance',    up: false },
        { label: 'Total',   value: summary.total  ?? 0, trend: 'Attendance records', up: null },
      ],
    },
    {
      icon: '✈️', iconBg: C.greenL, title: 'My Month',
      stats: [
        { label: 'Days Present',   value: summary.daysPresent    ?? 0, trend: 'This month', up: true  },
        { label: 'Leaves Taken',   value: summary.leavesCount    ?? 0, trend: 'Approved',   up: null  },
        { label: 'Working Days',   value: summary.totalWorkingDays ?? 0, trend: 'Mon–Fri',  up: null  },
      ],
    },
  ] : [
    {
      icon: '📋', iconBg: C.blueLight, title: 'My Attendance',
      stats: [
        { label: 'Days Present',     value: summary.daysPresent     ?? 0, trend: 'This month', up: true },
        { label: 'Leaves Taken',     value: summary.leavesCount     ?? 0, trend: 'Approved',   up: null },
        { label: 'Total Work Days',  value: summary.totalWorkingDays ?? 0, trend: 'Mon–Fri',   up: null },
      ],
    },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 64, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top nav bar */}
        <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Page header */}
        <PageHeader
          currentDate={currentDate}
          onPrev={() => goDate(-1)}
          onNext={() => goDate(+1)}
        />

        {/* Content */}
        <div style={{ padding: '24px 28px', flex: 1 }}>

          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
            {summaryCards.map((card, i) => (
              <SummaryCard key={i} {...card} />
            ))}
          </div>

          {/* Table Card */}
          <div style={{
            background: C.white, borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            {/* Filter bar inside card */}
            <div style={{ padding: '16px 20px 0' }}>
              <FilterBar search={search} onSearch={setSearch} />
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <TH>{isPrivileged ? 'Employee Name' : 'Date'}</TH>
                    <TH>Clock-in &amp; Out</TH>
                    <TH>Extra Hours</TH>
                    <TH>{isPrivileged ? 'Designation' : 'Status'}</TH>
                    <TH>{isPrivileged ? 'Department' : ''}</TH>
                    <TH>{isPrivileged ? 'Status' : ''}</TH>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: C.muted, fontSize: 13 }}>Loading…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No attendance records found.</td></tr>
                  ) : filtered.map((row, i) => (
                    <TRow
                      key={row.id} row={row} even={i % 2 === 1}
                      onClick={() => { setSelectedIdx(i); setModalOpen(true) }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employeeIndex={selectedIdx}
        totalEmployees={rows.length}
        employee={rows[selectedIdx] ? { name: rows[selectedIdx].name, id: rows[selectedIdx].loginId, role: rows[selectedIdx].profile, phone: '—' } : null}
        onNext={() => setSelectedIdx(i => Math.min(rows.length - 1, i + 1))}
        onPrev={() => setSelectedIdx(i => Math.max(0, i - 1))}
      />
    </div>
  )
}
