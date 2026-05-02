import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Mail, Link2, UserPlus, Download, Calendar, MoreHorizontal, Eye } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { useTheme } from '@/lib/theme'
import api from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'

// ─── Design Tokens (theme-aware) ──────────────────────────────────────────────
// Static accent colors used by charts — not themeable since recharts needs hex
const ACCENT = {
  indigo:  '#4f46e5',
  indigoL: '#eef2ff',
  teal:    '#00b4d8',
  cyan:    '#06b6d4',
  green:   '#22c55e',
  purple:  '#8b5cf6',
  amber:   '#f59e0b',
  red:     '#ef4444',
}

// Theme-aware token getter — call inside components that have access to useTheme()
function useT() {
  const { colors } = useTheme()
  return {
    ...ACCENT,
    bg:      colors.bg,
    white:   colors.card,
    text:    colors.text,
    muted:   colors.muted,
    border:  colors.border,
    card:    colors.card,
    shadow:  colors.shadow,
    radius:  14,
  }
}

const SWATCHES = ['#8b5cf6','#4f46e5','#00b4d8','#10b981','#f43f5e','#f59e0b']

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVT_COLORS = ['#6366f1','#0ea5e9','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4']
const avtColor = (n='') => AVT_COLORS[n.charCodeAt(0) % AVT_COLORS.length]

function AvatarInitials({ name='', size=32 }) {
  const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:avtColor(name),
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontWeight:700, fontSize:size*0.38, flexShrink:0,
    }}>{initials}</div>
  )
}

function Skeleton({ w='100%', h=16, r=8 }) {
  const { theme } = useTheme()
  const light = theme === 'dark'
    ? 'linear-gradient(90deg,#1e1e2e 25%,#2a2a3e 50%,#1e1e2e 75%)'
    : 'linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)'
  return (
    <div style={{
      width:w, height:h, borderRadius:r,
      background:light,
      backgroundSize:'200% 100%',
      animation:'shimmer 1.4s infinite',
    }}/>
  )
}

function StatusPill({ status }) {
  const cfg = {
    CHECKED_IN:  { bg:'#dcfce7', color:'#166534', label:'Full-time'  },
    CHECKED_OUT: { bg:'#f3f4f6', color:'#374151', label:'Full-time'  },
    ON_LEAVE:    { bg:'#fef3c7', color:'#92400e', label:'On Leave'   },
    ABSENT:      { bg:'#fee2e2', color:'#991b1b', label:'Absent'     },
  }[status] || { bg:'#f3f4f6', color:'#374151', label: status }
  return (
    <span style={{
      background:cfg.bg, color:cfg.color,
      padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:600,
    }}>{cfg.label}</span>
  )
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ userName, totalEmployees }) {
  const navigate = useNavigate()
  const T = useT()
  const AVTS = ['#4f46e5','#00b4d8','#22c55e']
  const extra = Math.max(0, (totalEmployees || 0) - AVTS.length)
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${T.border}`,
    }}>
      {/* Left: title */}
      <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:T.text }}>Dashboard</h1>

      {/* Right: actions */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {/* Search */}
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          background:'#f3f4f6', borderRadius:8, padding:'7px 12px', fontSize:13, color:T.muted,
        }}>
          <Search size={14} color={T.muted}/>
          <span>Quick Search...</span>
        </div>
        {/* Icon buttons */}
        {[Mail, Link2].map((Icon, i) => (
          <button key={i} style={{
            width:34, height:34, borderRadius:8, border:`1px solid ${T.border}`,
            background:T.white, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          }}>
            <Icon size={15} color={T.muted}/>
          </button>
        ))}
        {/* Avatar stack — dynamic count */}
        <div style={{ display:'flex', alignItems:'center' }}>
          {AVTS.map((c,i) => (
            <div key={i} style={{
              width:28, height:28, borderRadius:'50%', background:c,
              border:'2px solid #fff', marginLeft: i===0 ? 0 : -8, zIndex:AVTS.length-i,
            }}/>
          ))}
          {extra > 0 && (
            <div style={{
              marginLeft:-8, background:'#f3f4f6', borderRadius:999,
              padding:'2px 8px', fontSize:11, fontWeight:700, color:T.muted,
              border:'2px solid #fff', zIndex:0,
            }}>+{extra}</div>
          )}
        </div>
        {/* Invite */}
        <button
          onClick={() => navigate('/employees/new')}
          style={{
            display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
            border:`1.5px solid ${T.indigo}`, borderRadius:8, background:'transparent',
            color:T.indigo, fontWeight:600, fontSize:13, cursor:'pointer',
            fontFamily:'inherit',
          }}>
          <UserPlus size={14}/> Invite
        </button>
      </div>
    </div>
  )
}

// ─── Greeting + Date Row ──────────────────────────────────────────────────────
function GreetingBar({ userName, dateRange, setDateRange }) {
  const T = useT()
  const hr = new Date().getHours()
  const greet = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening'
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
      <h2 style={{ margin:0, fontSize:26, fontWeight:800, color:T.text }}>
        {greet}, {userName?.split(' ')[0] || 'there'} 👋
      </h2>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          display:'flex', alignItems:'center', gap:7, padding:'8px 14px',
          border:`1.5px solid ${T.border}`, borderRadius:8, background:T.white,
          fontSize:13, color:T.muted, cursor:'pointer',
        }}>
          <Calendar size={14} color={T.muted}/>
          <span>{dateRange}</span>
        </div>
        <button style={{
          display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
          background:T.indigo, border:'none', borderRadius:8,
          color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit',
        }}>
          <Download size={14}/> Export Data
        </button>
      </div>
    </div>
  )
}

// ─── Card 1: Total Employees ─────────────────────────────────────────────────
function TotalEmployeesCard({ data, loading }) {
  const T = useT()
  const card = { background:T.card, borderRadius:T.radius, boxShadow:T.shadow, padding:'20px 22px' }
  const total    = data?.totalEmployees    ?? 0
  const onLeave  = data?.onLeaveToday      ?? 0
  return (
    <div style={{ ...card, flex:1, minWidth:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <span style={{ fontWeight:700, fontSize:14, color:T.text }}>Total Employees</span>
        <MoreHorizontal size={16} color={T.muted} style={{ cursor:'pointer' }}/>
      </div>

      {/* Row 1 — Active */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
          {loading ? <Skeleton w={60} h={32}/> : (
            <span style={{ fontSize:34, fontWeight:800, color:T.text, lineHeight:1 }}>{total}</span>
          )}
          <span style={{ fontSize:12, color:T.green, fontWeight:600 }}>↑ Active</span>
        </div>
        <span style={{
          background:T.indigoL, color:T.indigo, fontSize:11, fontWeight:600,
          padding:'4px 10px', borderRadius:999,
        }}>Full-time</span>
      </div>

      {/* Row 2 — On Leave */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
          {loading ? <Skeleton w={40} h={28}/> : (
            <span style={{ fontSize:28, fontWeight:800, color:T.text, lineHeight:1 }}>{onLeave}</span>
          )}
          <span style={{ fontSize:12, color:T.amber, fontWeight:600 }}>On Leave</span>
        </div>
        <span style={{
          background:'#fff7ed', color:'#c2410c', fontSize:11, fontWeight:600,
          padding:'4px 10px', borderRadius:999,
        }}>Part-time</span>
      </div>

      {/* Mini bar */}
      <div style={{ marginTop:16, height:5, borderRadius:999, background:'#f3f4f6', overflow:'hidden' }}>
        <div style={{
          height:'100%', background:`linear-gradient(90deg,${T.indigo},${T.teal})`,
          width: total > 0 ? `${Math.round(((total - onLeave)/total)*100)}%` : '0%',
          borderRadius:999, transition:'width .6s ease',
        }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:T.muted }}>
        <span>Present rate</span>
        <span style={{ fontWeight:600, color:T.indigo }}>
          {total > 0 ? Math.round(((total-onLeave)/total)*100) : 0}%
        </span>
      </div>
    </div>
  )
}

// ─── Card 2: Attendance Overview ──────────────────────────────────────────────
function AttendanceOverviewCard({ data, loading }) {
  const T = useT()
  const card = { background:T.card, borderRadius:T.radius, boxShadow:T.shadow, padding:'20px 22px' }
  const rate    = data?.attendanceRate  ?? 0
  const present = data?.checkedInToday  ?? 0
  const leave   = data?.onLeaveToday    ?? 0
  const absent  = data?.absentToday     ?? 0
  const total   = present + leave + absent || 1

  const segments = [
    { pct: Math.round((leave/total)*100),   color:'#00b4d8', label:'On Leave'  },
    { pct: Math.round((absent/total)*100),  color:'#f59e0b', label:'Absent'    },
    { pct: Math.round((present/total)*100), color:'#22c55e', label:'On Time'   },
  ]

  return (
    <div style={{ ...card, flex:1, minWidth:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontWeight:700, fontSize:14, color:T.text }}>Attendance Overview</span>
        <MoreHorizontal size={16} color={T.muted} style={{ cursor:'pointer' }}/>
      </div>

      {/* Big percentage */}
      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:4 }}>
        {loading ? <Skeleton w={80} h={40}/> : (
          <span style={{ fontSize:42, fontWeight:800, color:T.text, lineHeight:1 }}>{rate}%</span>
        )}
        <span style={{ fontSize:12, color:T.green, fontWeight:600 }}>↑ 20% since last month</span>
      </div>
      <p style={{ margin:'0 0 14px', fontSize:12, color:T.muted }}>Today's attendance rate</p>

      {/* Segmented progress bar */}
      <div style={{ display:'flex', height:8, borderRadius:999, overflow:'hidden', gap:2, marginBottom:10 }}>
        {segments.map((s,i) => (
          <div key={i} style={{
            flex: s.pct, background:s.color, minWidth: s.pct > 0 ? 4 : 0,
            transition:'flex .6s ease',
          }}/>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:14 }}>
        {segments.map((s,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:T.muted }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Counts row */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:14, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
        {[['Present', present, T.green],['On Leave', leave, T.teal],['Absent', absent, T.red]].map(([l,v,c])=>(
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card 3: Today's Work Status (Gauge) ──────────────────────────────────────
function WorkStatusCard({ data, loading }) {
  const T = useT()
  const card = { background:T.card, borderRadius:T.radius, boxShadow:T.shadow, padding:'20px 22px' }
  const present = data?.checkedInToday ?? 0
  const leave   = data?.onLeaveToday   ?? 0
  const absent  = data?.absentToday    ?? 0
  const total   = (present + leave + absent) || 1
  const pct     = Math.round((present / total) * 100)

  // CSS-only arc via conic-gradient on a circle
  const arcDeg = Math.round((pct / 100) * 180) // semicircle = 180°

  return (
    <div style={{ ...card, flex:1, minWidth:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <span style={{ fontWeight:700, fontSize:14, color:T.text }}>Today's Work Status</span>
        <MoreHorizontal size={16} color={T.muted} style={{ cursor:'pointer' }}/>
      </div>

      {/* Gauge */}
      <div style={{ display:'flex', alignItems:'center', gap:20 }}>
        {/* Semicircle via clip */}
        <div style={{ position:'relative', width:100, height:52, flexShrink:0 }}>
          {/* Background arc */}
          <div style={{
            position:'absolute', bottom:0, left:0,
            width:100, height:100, borderRadius:'50%',
            background:'#f3f4f6',
            clipPath:'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
          }}/>
          {/* Filled arc */}
          <div style={{
            position:'absolute', bottom:0, left:0,
            width:100, height:100, borderRadius:'50%',
            background:`conic-gradient(${T.indigo} 0deg, ${T.teal} ${arcDeg}deg, transparent ${arcDeg}deg)`,
            clipPath:'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
            transition:'all .6s ease',
          }}/>
          {/* Inner white circle to create donut */}
          <div style={{
            position:'absolute', bottom:0, left:12, right:12,
            height:76, borderRadius:'50%', background:T.white,
            clipPath:'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
          }}/>
          {/* Center text */}
          <div style={{ position:'absolute', bottom:2, left:0, right:0, textAlign:'center' }}>
            {loading ? <Skeleton w={40} h={20}/> : (
              <span style={{ fontSize:17, fontWeight:800, color:T.text }}>{present}</span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
          {[
            { color:T.purple, count:present, label:'Checked In' },
            { color:T.amber,  count:leave,   label:'On Leave'   },
            { color:'#374151',count:absent,  label:'Absent'     },
          ].map(({ color, count, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
              <span style={{ fontSize:13, fontWeight:700, color:T.text, minWidth:28 }}>{count}</span>
              <span style={{ fontSize:12, color:T.muted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer pct */}
      <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, color:T.muted }}>Overall attendance</span>
        <span style={{ fontSize:15, fontWeight:800, color:T.indigo }}>{pct}%</span>
      </div>
    </div>
  )
}

// ─── Card: Employee Attendance Performance (horizontal bars) ─────────────────
function EmployeePerformanceCard({ data, loading }) {
  const T = useT()
  const card = { background:T.card, borderRadius:T.radius, boxShadow:T.shadow, padding:'20px 22px' }
  const rows = data || []

  if (!loading && rows.length === 0) {
    return (
      <div style={{ ...card, flex:'0 0 54%', minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minHeight:220, color:T.muted, fontSize:13 }}>
        <span style={{ fontSize:28, marginBottom:8 }}>📅</span>
        <span>No attendance data for this month yet</span>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:T.text, color:T.white, borderRadius:10, padding:'10px 14px', fontSize:12 }}>
        <p style={{ margin:'0 0 6px', fontWeight:700 }}>{label}</p>
        {payload.map((p,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:p.fill }}/>
            <span style={{ color:T.muted }}>{p.name}:</span>
            <span style={{ fontWeight:600 }}>{p.value} days</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ ...card, flex:'0 0 52%', minWidth:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <span style={{ fontWeight:700, fontSize:14, color:T.text }}>Attendance Performance</span>
        <MoreHorizontal size={16} color={T.muted} style={{ cursor:'pointer' }}/>
      </div>
      <p style={{ margin:'0 0 16px', fontSize:12, color:T.muted }}>
        EmPay tracks punctuality and attendance across all employees
      </p>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3,4,5].map(i => <Skeleton key={i} h={18} r={4}/>)}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart layout="vertical" data={rows} barSize={6} barGap={2}
            margin={{ left:80, right:10, top:0, bottom:0 }}>
            <XAxis type="number" domain={[0,25]} tick={{ fontSize:10, fill:T.muted }}
              tickLine={false} axisLine={false}/>
            <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:T.text, fontWeight:500 }}
              tickLine={false} axisLine={false} width={76}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="daysPresent" name="Days Present" fill={T.purple} radius={3}/>
            <Bar dataKey="daysOnTime"  name="Days On Time" fill={T.cyan}  radius={3}/>
            <Bar dataKey="extraHours" name="Extra Hours"  fill={T.green}  radius={3}/>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
        {[['Days Present',T.purple],['Days On Time',T.cyan],['Extra Hours',T.green]].map(([l,c])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:T.muted }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:c }}/>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card: Payroll Statistics (grouped bar + color swatches) ──────────────────
function PayrollStatsCard({ data, loading }) {
  const T = useT()
  const card = { background:T.card, borderRadius:T.radius, boxShadow:T.shadow, padding:'20px 22px' }
  const [barColor, setBarColor] = useState('#8b5cf6')
  const [activeColor, setActiveColor] = useState(0)
  const rows = data || []

  if (!loading && rows.length === 0) {
    return (
      <div style={{ ...card, flex:'0 0 44%', minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minHeight:220, color:T.muted, fontSize:13 }}>
        <span style={{ fontSize:28, marginBottom:8 }}>💰</span>
        <span>No payroll data for this year yet</span>
      </div>
    )
  }

  const fmt = (v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:T.text, color:T.white, borderRadius:10, padding:'10px 14px', fontSize:12 }}>
        <p style={{ margin:'0 0 8px', fontWeight:700 }}>{label} 2025</p>
        {payload.map((p,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:p.fill || barColor }}/>
            <span style={{ color:T.muted }}>{p.name}:</span>
            <span style={{ fontWeight:600 }}>₹{p.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ ...card, flex:'0 0 44%', minWidth:0 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontWeight:700, fontSize:14, color:T.text }}>Payroll Statistics</span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Swatches */}
          <div style={{ display:'flex', gap:5 }}>
            {SWATCHES.map((c,i) => (
              <button key={i} onClick={() => { setBarColor(c); setActiveColor(i) }}
                style={{
                  width:16, height:16, borderRadius:'50%', background:c, border:'none',
                  cursor:'pointer', outline: activeColor===i ? `2px solid ${c}` : 'none',
                  outlineOffset:2, transition:'transform .15s',
                  transform: activeColor===i ? 'scale(1.25)' : 'scale(1)',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize:12, color:T.indigo, fontWeight:600, cursor:'pointer' }}>
            Advance Filter →
          </span>
        </div>
      </div>

      {loading ? (
        <Skeleton h={160}/>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={rows} barSize={8} barGap={2}
            margin={{ left:0, right:0, top:0, bottom:0 }}>
            <XAxis dataKey="month" tick={{ fontSize:9, fill:T.muted }} tickLine={false} axisLine={false}/>
            <YAxis tickFormatter={fmt} tick={{ fontSize:9, fill:T.muted }} tickLine={false} axisLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="grossPayroll" name="Gross Payroll" fill={barColor}   radius={[3,3,0,0]}/>
            <Bar dataKey="netPayroll"   name="Net Payroll"   fill={barColor}
              fillOpacity={0.35} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginTop:10 }}>
        {[['Gross Payroll', 1],['Net Payroll', 0.35]].map(([l,op])=>(
          <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:T.muted }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:barColor, opacity:op }}/>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Employees Table ──────────────────────────────────────────────────────────
function EmployeesTable({ employees, loading }) {
  const navigate = useNavigate()
  const T = useT()
  const card = { background:T.card, borderRadius:T.radius, boxShadow:T.shadow, padding:'20px 22px' }
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('all')
  const [role,   setRole]     = useState('all')

  const rows = (employees || []).filter(e => {
    const q = search.toLowerCase()
    const nameMatch = e.name?.toLowerCase().includes(q) || e.loginId?.toLowerCase().includes(q)
    const statusMatch = status === 'all' || e.workStatus === status
    const roleMatch   = role   === 'all' || e.department?.toLowerCase().includes(role.toLowerCase())
    return nameMatch && statusMatch && roleMatch
  })

  const depts = [...new Set((employees || []).map(e => e.department).filter(Boolean))]

  const TH = ({ children }) => (
    <th style={{
      padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700,
      color:T.muted, textTransform:'uppercase', letterSpacing:'0.05em',
      borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap', background:T.white,
    }}>{children}</th>
  )

  return (
    <div style={{ ...card, marginTop:20 }}>
      {/* Table header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <span style={{ fontWeight:700, fontSize:15, color:T.text }}>All Employees</span>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {/* Search */}
          <div style={{ display:'flex', alignItems:'center', gap:6, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 12px', background:'#fafafa' }}>
            <Search size={13} color={T.muted}/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employee..."
              style={{ border:'none', outline:'none', background:'transparent', fontSize:12, color:T.text, width:140, fontFamily:'inherit' }}
            />
          </div>
          {/* Status filter */}
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 10px', fontSize:12, color:T.muted, background:'#fafafa', cursor:'pointer', fontFamily:'inherit' }}>
            <option value="all">All Status</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
          {/* Dept filter */}
          <select value={role} onChange={e => setRole(e.target.value)}
            style={{ border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 10px', fontSize:12, color:T.muted, background:'#fafafa', cursor:'pointer', fontFamily:'inherit' }}>
            <option value="all">All Dept</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {/* Export */}
          <button style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', background:T.indigo, border:'none', borderRadius:8, color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            <Download size={13}/> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr>
              <TH>Employee ID</TH>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Role / Designation</TH>
              <TH>Department</TH>
              <TH>Status</TH>
              <TH>Action</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i}>
                  {[1,2,3,4,5,6,7].map(j => (
                    <td key={j} style={{ padding:'12px 14px' }}><Skeleton h={14}/></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign:'center', padding:32, color:T.muted, fontSize:13 }}>
                  No employees match your filters
                </td>
              </tr>
            ) : rows.map((emp, i) => (
              <tr key={emp.loginId || i}
                style={{ borderBottom:`1px solid ${T.border}`, transition:'background .15s', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='#f5f7ff'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <td style={{ padding:'12px 14px', fontFamily:'monospace', fontSize:11, color:T.muted, whiteSpace:'nowrap' }}>
                  {emp.loginId}
                </td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <AvatarInitials name={emp.name} size={30}/>
                    <span style={{ fontWeight:600, color:T.text }}>{emp.name}</span>
                  </div>
                </td>
                <td style={{ padding:'12px 14px', color:T.muted, fontSize:12 }}>{emp.email}</td>
                <td style={{ padding:'12px 14px', color:T.text, fontSize:12 }}>{emp.designation}</td>
                <td style={{ padding:'12px 14px', color:T.muted, fontSize:12 }}>{emp.department}</td>
                <td style={{ padding:'12px 14px' }}>
                  <StatusPill status={emp.workStatus}/>
                </td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', gap:8 }}>
                    <button
                      onClick={() => navigate(`/employees/${emp.id || emp.loginId}`)}
                      title="View Profile"
                      style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.border}`, background:T.white, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Eye size={13} color={T.muted}/>
                    </button>
                    <button
                      title="More"
                      style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.border}`, background:T.white, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <MoreHorizontal size={13} color={T.muted}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const T = useT()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userName = user?.name || 'there'

  const [overview,        setOverview]        = useState(null)
  const [costTrend,       setCostTrend]       = useState([])
  const [attendanceTrend, setAttendanceTrend] = useState([])
  const [employees,       setEmployees]       = useState([])
  const [loading,         setLoading]         = useState(true)
  const [apiError,        setApiError]        = useState(false)
  const [lastUpdated,     setLastUpdated]     = useState(null)
  const [dateRange,       setDateRange]       = useState(() => {
    const n = new Date()
    const s = new Date(n.getFullYear(), n.getMonth(), 1)
    const e = new Date(n.getFullYear(), n.getMonth() + 1, 0)
    const fmt = d => d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    return `${fmt(s)} – ${fmt(e)}`
  })

  const fetchAll = () => {
    setLoading(true)
    setApiError(false)
    const year  = new Date().getFullYear()
    const month = new Date().getMonth() + 1

    Promise.all([
      api.get('/dashboard/overview'),
      api.get(`/dashboard/attendance-trend?month=${month}&year=${year}`),
      api.get(`/dashboard/employer-cost-trend?year=${year}`),
      api.get('/employees'),
    ])
    .then(([ov, at, ct, em]) => {
      // Overview — shape: { data: { totalEmployees, ... } }
      setOverview(ov.data?.data || ov.data || null)

      // Attendance trend — shape: { data: [...] }
      setAttendanceTrend(at.data?.data || at.data || [])

      // Cost trend — shape: { data: [...] }
      setCostTrend(ct.data?.data || ct.data || [])

      // Employees — shape: { employees: [...] }
      const empArr = em.data?.employees || em.data?.data || em.data || []
      setEmployees(empArr.map(e => ({
        id:          e.id,
        loginId:     e.user?.loginId   || e.loginId  || '—',
        name:        `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Unknown',
        email:       e.user?.email     || e.email    || '—',
        designation: e.designation     || '—',
        department:  e.department      || '—',
        workStatus:  e.workStatus      || 'ABSENT',
      })))

      setLastUpdated(new Date())
    })
    .catch((err) => {
      console.error('[Dashboard] API fetch failed:', err?.response?.status, err?.message)
      setApiError(true)
    })
    .finally(() => setLoading(false))
  }

  // Initial load + auto-refresh every 30 seconds
  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30_000)
    return () => clearInterval(interval)
  }, [])

  const SIDEBAR_W = 64

  return (
    <>
      <div style={{ display:'flex', minHeight:'100vh', background:T.bg, fontFamily:'inherit' }}>
        <Sidebar/>

        {/* Main content */}
        <main style={{
          marginLeft: SIDEBAR_W,
          flex: 1,
          padding: '28px 28px 40px',
          minWidth: 0,
          overflowX: 'hidden',
        }}>
          <TopBar userName={userName} totalEmployees={overview?.totalEmployees}/>

          {/* API error banner */}
          {apiError && (
            <div style={{
              marginBottom:16, padding:'10px 16px', borderRadius:10,
              background:'#fff7ed', border:'1px solid #fed7aa',
              display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13,
            }}>
              <span style={{ color:'#c2410c' }}>
                ⚠️ Could not reach the server — showing cached demo data.
              </span>
              <button
                onClick={fetchAll}
                style={{
                  padding:'5px 12px', borderRadius:6, border:'1px solid #fb923c',
                  background:'transparent', color:'#c2410c', fontWeight:600,
                  cursor:'pointer', fontSize:12, fontFamily:'inherit',
                }}
              >
                Retry
              </button>
            </div>
          )}

          <GreetingBar userName={userName} dateRange={dateRange} setDateRange={setDateRange}/>

          {/* Row 1 — Stat Cards */}
          <div style={{ display:'flex', gap:16, marginBottom:20 }}>
            <TotalEmployeesCard      data={overview} loading={loading}/>
            <AttendanceOverviewCard  data={overview} loading={loading}/>
            <WorkStatusCard          data={overview} loading={loading}/>
          </div>

          {/* Row 2 — Charts */}
          <div style={{ display:'flex', gap:16, marginBottom:0 }}>
            <EmployeePerformanceCard data={attendanceTrend} loading={loading}/>
            <PayrollStatsCard        data={costTrend}       loading={loading}/>
          </div>

          {/* Row 3 — Employees Table */}
          <EmployeesTable employees={employees} loading={loading}/>

          {/* Last updated */}
          {lastUpdated && !loading && (
            <p style={{ textAlign:'right', fontSize:11, color:T.muted, marginTop:12 }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </main>
      </div>
    </>
  )
}
