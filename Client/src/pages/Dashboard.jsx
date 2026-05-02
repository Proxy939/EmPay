import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Clock, PlaneTakeoff, Wallet, BarChart2,
  UserPlus, Search, Bell, Plus, MoreHorizontal, TrendingUp, Eye, Sun, Moon
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import NewEmployeeDialog from '@/components/employees/NewEmployeeDialog'
import { useTheme } from '@/lib/theme'
import api from '@/lib/api'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  accent:  '#6C5CE7', accentL: '#f0eeff', accentD: '#5a4bd1',
  green:   '#00b894', red:     '#d63031', blue:    '#0984e3', amber:   '#f39c12',
  bg:      '#f5f5f8', white:   '#ffffff',
  text:    '#2d3436', muted:   '#636e72', border:  '#e9ecef',
  shadow:  '0 1px 4px rgba(108,92,231,0.08), 0 1px 2px rgba(0,0,0,0.04)',
}

const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const SWATCHES = ['#a29bfe','#74b9ff','#00cec9','#fdcb6e','#fd79a8','#55efc4']
const AVT_CLR  = ['#6C5CE7','#0984e3','#00b894','#e17055','#fdcb6e','#fd79a8']

const WS = {
  CHECKED_IN:  { bg:'#e8f8f5', color:'#00b894', label:'Checked In'  },
  CHECKED_OUT: { bg:'#f0f0f0', color:'#636e72', label:'Checked Out' },
  ON_LEAVE:    { bg:'#e8f3fd', color:'#0984e3', label:'On Leave'    },
  ABSENT:      { bg:'#fff3f3', color:'#d63031', label:'Absent'      },
}

const avColor = (n='') => AVT_CLR[n.charCodeAt(0) % AVT_CLR.length]

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ value, onChange }) {
  const { colors: C } = useTheme()
  const isMonthly = value === 'monthly'
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.muted,fontWeight:600}}>
      <span style={{color: !isMonthly ? C.text : C.muted}}>Annually</span>
      <div
        onClick={() => onChange(isMonthly ? 'annually' : 'monthly')}
        style={{
          width:36, height:20, borderRadius:10, cursor:'pointer', position:'relative',
          background: isMonthly ? C.accent : C.border,
          transition:'background .2s',
        }}
      >
        <div style={{
          position:'absolute', top:3, left: isMonthly ? 19 : 3,
          width:14, height:14, borderRadius:'50%', background:'#fff',
          boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left .2s',
        }}/>
      </div>
      <span style={{color: isMonthly ? C.text : C.muted}}>Monthly</span>
    </div>
  )
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, color, unit }) {
  const { colors: C } = useTheme()
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:8,height:80,marginTop:8}}>
      {data.map((d, i) => (
        <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1,gap:4}}>
          <div style={{
            width:'100%', borderRadius:'4px 4px 0 0',
            background: color, opacity: 0.7 + (i / data.length) * 0.3,
            height: `${Math.max((d.value / max) * 100, 6)}%`,
            transition:'height .4s ease',
            minHeight:6,
          }}/>
          <span style={{fontSize:9,color:C.muted,textAlign:'center',whiteSpace:'nowrap'}}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Employer Cost Chart ────────────────────────────────────────────────────────
const COST_DATA = {
  annually: [
    {label:'Jan 2025', value:18},{label:'Feb 2025', value:22},{label:'Mar 2025', value:25},
    {label:'Apr 2025', value:21},{label:'May 2025', value:24},{label:'Jun 2025', value:27},
  ],
  monthly: [
    {label:'Wk 1', value:6},{label:'Wk 2', value:7},{label:'Wk 3', value:5},{label:'Wk 4', value:8},
  ],
}
const EMP_COUNT_DATA = {
  annually: [
    {label:'Jan 2025', value:18},{label:'Feb 2025', value:20},{label:'Mar 2025', value:22},
    {label:'Apr 2025', value:23},{label:'May 2025', value:25},{label:'Jun 2025', value:28},
  ],
  monthly: [
    {label:'Wk 1', value:22},{label:'Wk 2', value:23},{label:'Wk 3', value:24},{label:'Wk 4', value:25},
  ],
}

function EmployerCostChart() {
  const { colors: C } = useTheme()
  const [mode, setMode] = useState('annually')
  return (
    <div style={{background:C.card, borderRadius:14, boxShadow:C.shadow, padding:'18px 20px', flex:1}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontWeight:700,fontSize:13,color:C.text}}>Employer cost</span>
        <ToggleSwitch value={mode} onChange={setMode}/>
      </div>
      <div style={{fontSize:10,color:C.muted,marginBottom:4}}>
        {mode==='annually'?'₹ in Lakhs (monthly view)':'₹ in Lakhs (weekly view)'}
      </div>
      <BarChart data={COST_DATA[mode]} color={C.accent} unit="L"/>
    </div>
  )
}

function EmployeeCountChart() {
  const { colors: C } = useTheme()
  const [mode, setMode] = useState('annually')
  return (
    <div style={{background:C.card, borderRadius:14, boxShadow:C.shadow, padding:'18px 20px', flex:1}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontWeight:700,fontSize:13,color:C.text}}>Employee count</span>
        <ToggleSwitch value={mode} onChange={setMode}/>
      </div>
      <div style={{fontSize:10,color:C.muted,marginBottom:4}}>
        {mode==='annually'?'Headcount by month':'Headcount by week'}
      </div>
      <BarChart data={EMP_COUNT_DATA[mode]} color='#0984e3' unit=""/>
    </div>
  )
}


// ── Metric Card ─────────────────────────────────────────────────────────────────
function MetricCard({ label, value, trend, icon: Icon, loading }) {
  const { colors: C } = useTheme()
  return (
    <div style={{background:C.card, borderRadius:14, boxShadow:C.shadow, padding:'22px 20px', flex:1, minWidth:0}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
        <p style={{margin:0, color:C.muted, fontSize:13, fontWeight:500}}>{label}</p>
        <div style={{width:32,height:32,borderRadius:8,background:C.accentL,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Icon size={16} color={C.accent}/>
        </div>
      </div>
      {loading
        ? <div style={{height:36,background:C.border,borderRadius:8,marginBottom:10}}/>
        : <p style={{margin:'0 0 8px',fontSize:30,fontWeight:800,color:C.text,lineHeight:1}}>{value.toLocaleString()}</p>
      }
      <p style={{margin:0,color:C.green,fontSize:12,display:'flex',alignItems:'center',gap:4}}>
        <TrendingUp size={12}/>{trend}
      </p>
    </div>
  )
}



// ── Check In / Out Widget ─────────────────────────────────────────────────────
function CheckInWidget({ C }) {
  const [status,  setStatus]  = useState(null)  // 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT'
  const [time,    setTime]    = useState('')
  const [loading, setLoading] = useState(false)
  const [errMsg,  setErrMsg]  = useState('')

  const fetchStatus = () => {
    api.get('/attendance/my-status')
      .then(r => {
        const d = r.data
        setStatus(d.workStatus)          // backend returns workStatus
        if (d.since) {
          const t = new Date(d.since)    // backend returns since (checkIn time)
          setTime(t.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }))
        } else {
          setTime('')
        }
      })
      .catch(() => setStatus('ABSENT'))
  }

  useEffect(() => { fetchStatus() }, [])

  const handleCheckIn = async () => {
    setLoading(true); setErrMsg('')
    try { await api.post('/attendance/check-in');  fetchStatus() }
    catch(e) { setErrMsg(e.response?.data?.message || 'Check-in failed') }
    setLoading(false)
  }
  const handleCheckOut = async () => {
    setLoading(true); setErrMsg('')
    try { await api.post('/attendance/check-out'); fetchStatus() }
    catch(e) { setErrMsg(e.response?.data?.message || 'Check-out failed') }
    setLoading(false)
  }

  const isIn  = status === 'CHECKED_IN'
  const isOut = status === 'CHECKED_OUT'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8,
        background:C.card, border:`1px solid ${errMsg ? C.red : C.border}`,
        borderRadius:10, padding:'6px 12px', minWidth:160, transition:'border .2s' }}>
        {/* Status dot */}
        <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
          background: isIn ? C.green : isOut ? C.amber : C.muted,
          boxShadow: isIn ? `0 0 0 3px ${C.green}33` : 'none',
          transition: 'all .3s' }} />
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:11, color:C.muted, lineHeight:1.2 }}>
            {isIn  ? `In since ${time}` :
             isOut ? `Out · ${time}`    : 'Not checked in'}
          </p>
        </div>
        <button
          onClick={isIn ? handleCheckOut : handleCheckIn}
          disabled={loading || isOut}
          style={{
            padding:'4px 10px', borderRadius:7, border:'none',
            background: isIn ? C.red : isOut ? C.border : C.green,
            color: isOut ? C.muted : 'white',
            fontSize:11, fontWeight:700,
            cursor: (loading || isOut) ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition:'all .2s', whiteSpace:'nowrap',
          }}
        >
          {loading ? '…' : isIn ? 'Check Out' : isOut ? 'Done' : 'Check In'}
        </button>
      </div>
      {errMsg && (
        <p style={{ margin:0, fontSize:10, color:C.red, paddingLeft:4 }}>{errMsg}</p>
      )}
    </div>
  )
}

// ── Avatar Dropdown ────────────────────────────────────────────────────────────
function AvatarMenu({ C, initials, navigate }) {
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div style={{ position:'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ width:36, height:36, borderRadius:'50%', background:C.accent,
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', fontWeight:700, fontSize:13, cursor:'pointer',
          boxShadow: open ? `0 0 0 3px ${C.accentL}` : 'none', transition:'box-shadow .15s' }}
      >
        {initials}
      </div>

      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:98 }} />
          {/* Menu */}
          <div style={{
            position:'absolute', right:0, top:'calc(100% + 8px)', zIndex:99,
            background:C.card, border:`1px solid ${C.border}`,
            borderRadius:12, boxShadow:C.shadow, minWidth:180, overflow:'hidden',
          }}>
            {/* Name row */}
            <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}` }}>
              <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.text }}>
                {JSON.parse(localStorage.getItem('user') || '{}')?.name || 'User'}
              </p>
              <p style={{ margin:0, fontSize:11, color:C.muted }}>
                {JSON.parse(localStorage.getItem('user') || '{}')?.email || ''}
              </p>
            </div>
            {/* My Profile */}
            <button
              onClick={() => { setOpen(false); navigate('/profile') }}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                padding:'10px 14px', border:'none', background:'transparent',
                cursor:'pointer', textAlign:'left', color:C.text, fontSize:13,
                fontWeight:500, transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Users size={14} color={C.muted} /> My Profile
            </button>
            <div style={{ height:1, background:C.border, margin:'0 14px' }} />
            {/* Log Out */}
            <button
              onClick={handleLogout}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                padding:'10px 14px', border:'none', background:'transparent',
                cursor:'pointer', textAlign:'left', color:C.red, fontSize:13,
                fontWeight:500, transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.redBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Eye size={14} color={C.red} /> Log Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({ search, onSearch, onAddEmployee, canAdd }) {
  const { colors: C, theme, toggle } = useTheme()
  const navigate = useNavigate()
  const user    = JSON.parse(localStorage.getItem('user') || '{}')
  const name    = user?.name || 'User'
  const initials= name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
      <div>
        <h1 style={{margin:0,fontSize:24,fontWeight:800,color:C.text}}>Dashboard</h1>
        <p style={{margin:0,color:C.muted,fontSize:13,marginTop:2}}>Monitor all of your HR metrics here</p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        {canAdd && (
          <button onClick={onAddEmployee}
            style={{display:'flex',alignItems:'center',gap:6,height:36,padding:'0 14px',borderRadius:10,
              border:'none',background:C.accent,color:'white',fontWeight:600,fontSize:13,cursor:'pointer'}}>
            <UserPlus size={14}/> New Employee
          </button>
        )}
        {/* Check In/Out */}
        <CheckInWidget C={C} />
        <div style={{position:'relative'}}>
          <Search size={14} color={C.muted} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Search anything"
            style={{height:36,paddingLeft:32,paddingRight:12,borderRadius:10,border:`1px solid ${C.border}`,
              background:C.inputBg,color:C.text,fontSize:13,outline:'none',width:180}}/>
        </div>
        {/* Theme toggle */}
        <button onClick={toggle} title={theme==='light'?'Switch to dark':'Switch to light'}
          style={{width:36,height:36,borderRadius:10,background:C.card,border:`1px solid ${C.border}`,
            display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          {theme==='light' ? <Moon size={16} color={C.muted}/> : <Sun size={16} color={C.muted}/>}
        </button>
        <div style={{width:36,height:36,borderRadius:10,background:C.card,border:`1px solid ${C.border}`,
          display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <Bell size={16} color={C.muted}/>
        </div>
        {/* Avatar with dropdown */}
        <AvatarMenu C={C} initials={initials} navigate={navigate} />
      </div>
    </div>
  )
}


// ── Attendance Row ────────────────────────────────────────────────────────────
function ARow({ emp }) {
  const { colors: C } = useTheme()
  const name     = `${emp.firstName} ${emp.lastName}`
  const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase()
  const st       = WS[emp.workStatus] || WS.ABSENT
  return (
    <div style={{display:'flex',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
      <div style={{width:38,height:38,borderRadius:'50%',background:avColor(name),display:'flex',
        alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:13,marginRight:12,flexShrink:0}}>
        {initials}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontWeight:600,fontSize:14,color:C.text}}>{name}</p>
        <p style={{margin:0,color:C.muted,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {emp.user?.email || emp.designation || '—'}
        </p>
      </div>
      <span style={{background:st.bg,color:st.color,fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:20,whiteSpace:'nowrap',marginLeft:8}}>
        {st.label}
      </span>
    </div>
  )
}

// ── Employee Table Row ────────────────────────────────────────────────────────
function TRow({ emp, navigate }) {
  const { colors: C } = useTheme()
  const name = `${emp.firstName} ${emp.lastName}`
  const st   = WS[emp.workStatus] || WS.ABSENT
  return (
    <tr>
      <td style={{padding:'12px 16px',fontSize:12,fontWeight:600,color:C.muted,fontFamily:'monospace'}}>{emp.user?.loginId || '—'}</td>
      <td style={{padding:'12px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:avColor(name),display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:11,flexShrink:0}}>
            {name[0]}{emp.lastName[0]}
          </div>
          <span style={{fontSize:14,fontWeight:600,color:C.text}}>{name}</span>
        </div>
      </td>
      <td style={{padding:'12px 16px',fontSize:13,color:C.muted}}>{emp.user?.email || '—'}</td>
      <td style={{padding:'12px 16px',fontSize:13,color:C.text}}>{emp.department || '—'}</td>
      <td style={{padding:'12px 16px'}}>
        <span style={{background:st.bg,color:st.color,fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:20}}>
          {st.label}
        </span>
      </td>
      <td style={{padding:'12px 16px'}}>
        <button onClick={()=>navigate(`/employees/${emp.id}`)}
          style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:8,border:`1px solid ${C.border}`,
            background:'transparent',cursor:'pointer',color:C.muted,fontSize:12,fontWeight:500}}>
          <Eye size={12}/> View
        </button>
      </td>
    </tr>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { colors: C } = useTheme()
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [newEmpOpen,setNewEmpOpen]= useState(false)
  const [search,    setSearch]    = useState('')
  const [dashTab,   setDashTab]   = useState('dashboard') // 'dashboard' | 'payrun' | 'configuration'

  const fetchEmps = () => {
    api.get('/employees').then(r=>{ setEmployees(r.data.employees||[]); setLoading(false) }).catch(()=>setLoading(false))
  }
  useEffect(()=>{ fetchEmps() },[])

  const total     = employees.length
  const checkedIn = employees.filter(e=>e.workStatus==='CHECKED_IN').length
  const onLeave   = employees.filter(e=>e.workStatus==='ON_LEAVE').length
  const absent    = employees.filter(e=>e.workStatus==='ABSENT').length

  // Warnings
  const noBank    = employees.filter(e=>!e.bankAccountNumber).length
  const noManager = employees.filter(e=>!e.managerId).length

  const filtered  = search
    ? employees.filter(e=>`${e.firstName} ${e.lastName} ${e.department||''} ${e.user?.email||''}`
        .toLowerCase().includes(search.toLowerCase()))
    : employees

  const pct = (n) => total > 0 ? `${Math.round((n/total)*100)}% of workforce` : 'No employees yet'
  const metrics = [
    { label:'Total Employees',  value:total,     icon:Users,        trend: total > 0 ? `${total} active` : 'No employees yet' },
    { label:'Checked In Today', value:checkedIn, icon:Clock,        trend: pct(checkedIn) },
    { label:'On Leave Today',   value:onLeave,   icon:PlaneTakeoff, trend: pct(onLeave)   },
    { label:'Absent Today',     value:absent,    icon:BarChart2,    trend: pct(absent)    },
  ]

  const role   = JSON.parse(localStorage.getItem('user') || '{}')?.role || 'EMPLOYEE'
  const canAdd = ['ADMIN','HR_OFFICER'].includes(role)

  // Mock payrun data
  const payrunItems = [
    { label:'Payrun for Oct 2025', slips:3 },
    { label:'Payrun for Sept 2025', slips:3 },
    { label:'Payrun for Aug 2025', slips:3 },
  ]

  const DASH_TABS = ['Dashboard','Payrun','Configuration']

  return (
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,fontFamily:"'Geist Variable','Inter',sans-serif"}}>
      <Sidebar />
      <div style={{flex:1,marginLeft:64,padding:'28px 28px 40px',minWidth:0,overflowX:'hidden'}}>
        <TopBar search={search} onSearch={setSearch} onAddEmployee={()=>setNewEmpOpen(true)} canAdd={canAdd}/>

        {/* ── Tab Bar ── */}
        <div style={{display:'flex',gap:2,marginBottom:20,borderBottom:`1px solid ${C.border}`}}>
          {DASH_TABS.map(t => {
            const key = t.toLowerCase()
            const active = dashTab === key
            return (
              <button key={t} onClick={()=>setDashTab(key)}
                style={{padding:'8px 18px',border:'none',background:'transparent',cursor:'pointer',
                  fontSize:13,fontWeight:600,borderBottom:`2px solid ${active?C.accent:'transparent'}`,
                  color:active?C.accent:C.muted,transition:'all .15s',marginBottom:-1}}>
                {t}
              </button>
            )
          })}
        </div>

        {/* ══════ DASHBOARD TAB ══════ */}
        {dashTab === 'dashboard' && (<>

          {/* Warnings */}
          {!loading && (noBank > 0 || noManager > 0) && (
            <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:12,padding:'14px 18px',marginBottom:18}}>
              <p style={{margin:'0 0 8px',fontWeight:700,fontSize:13,color:'#92400e'}}>⚠ Warning</p>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {noBank > 0 && (
                  <p style={{margin:0,fontSize:12,color:'#b45309'}}>
                    {noBank} Employee{noBank>1?'s':''} without Bank A/c
                  </p>
                )}
                {noManager > 0 && (
                  <p style={{margin:0,fontSize:12,color:'#b45309'}}>
                    {noManager} Employee{noManager>1?'s':''} without Manager
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Top grid */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,marginBottom:20,alignItems:'start'}}>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* Metric Cards */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {metrics.map(m=>(
                  <MetricCard key={m.label} loading={loading} {...m}/>
                ))}
              </div>
              {/* Today's Attendance */}
              <div style={{background:C.card,borderRadius:14,boxShadow:C.shadow,padding:'20px 22px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text}}>Today's Attendance</h3>
                  <button style={{width:28,height:28,borderRadius:8,background:C.accentL,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <Plus size={14} color={C.accent}/>
                  </button>
                </div>
                {loading
                  ? [1,2,3].map(i=><div key={i} style={{height:58,background:C.border,borderRadius:10,marginBottom:8}}/>)
                  : employees.length===0
                    ? <p style={{color:C.muted,fontSize:13,margin:'20px 0',textAlign:'center'}}>No employees yet</p>
                    : employees.slice(0,6).map(e=><ARow key={e.id} emp={e}/>)
                }
              </div>
            </div>

            {/* Right column — payrun + charts */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Payrun Card */}
              <div style={{background:C.card,borderRadius:14,boxShadow:C.shadow,padding:'18px 20px'}}>
                <p style={{margin:'0 0 12px',fontWeight:700,fontSize:13,color:C.text}}>Payrun</p>
                {payrunItems.map((p,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'8px 0',borderBottom:i<payrunItems.length-1?`1px solid ${C.border}`:'none'}}>
                    <span style={{fontSize:12,color:C.text,fontWeight:500}}>{p.label}</span>
                    <span style={{fontSize:11,color:C.muted,background:C.accentL,padding:'2px 8px',borderRadius:20,fontWeight:600}}>
                      {p.slips} Payslip{p.slips!==1?'s':''}
                    </span>
                  </div>
                ))}
              </div>
              {/* Charts with toggles */}
              <EmployerCostChart/>
              <EmployeeCountChart/>
            </div>
          </div>

          {/* Employee Table */}
          <div style={{background:C.card,borderRadius:14,boxShadow:C.shadow,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <Users size={16} color={C.accent}/>
                <span style={{fontWeight:700,fontSize:15,color:C.text}}>Total Employees</span>
                <span style={{background:C.accentL,color:C.accent,fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:20}}>
                  {loading?'…':total.toLocaleString()}
                </span>
              </div>
              <div style={{position:'relative'}}>
                <Search size={13} color={C.muted} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or ID"
                  style={{height:32,paddingLeft:28,paddingRight:10,borderRadius:8,border:`1px solid ${C.border}`,
                    background:C.inputBg,color:C.text,fontSize:12,outline:'none',width:180}}/>
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:C.tableBg}}>
                    {['ID','Name','Email','Department','Status','Action'].map(h=>(
                      <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,fontWeight:700,
                        color:C.muted,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:`1px solid ${C.border}`}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [1,2,3].map(i=>(
                        <tr key={i}><td colSpan={6} style={{padding:'14px 16px'}}>
                          <div style={{height:16,background:'#f0f0f0',borderRadius:6}}/>
                        </td></tr>
                      ))
                    : filtered.map(e=><TRow key={e.id} emp={e} navigate={navigate}/>)
                  }
                  {!loading && filtered.length===0 && (
                    <tr><td colSpan={6} style={{padding:'32px 16px',textAlign:'center',color:C.muted,fontSize:13}}>
                      No employees match your search.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* ══════ PAYRUN TAB ══════ */}
        {dashTab === 'payrun' && (
          <div style={{background:C.card,borderRadius:14,boxShadow:C.shadow,padding:'28px'}}>
            <h3 style={{margin:'0 0 16px',fontSize:16,fontWeight:700,color:C.text}}>Payrun History</h3>
            {payrunItems.map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'14px 0',borderBottom:`1px solid ${C.border}`}}>
                <div>
                  <p style={{margin:0,fontWeight:600,fontSize:14,color:C.text}}>{p.label}</p>
                  <p style={{margin:0,fontSize:12,color:C.muted}}>{p.slips} payslip{p.slips!==1?'s':''} generated</p>
                </div>
                <button style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${C.border}`,
                  background:'transparent',color:C.text,fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ══════ CONFIGURATION TAB ══════ */}
        {dashTab === 'configuration' && (
          <div style={{background:C.card,borderRadius:14,boxShadow:C.shadow,padding:'28px'}}>
            <h3 style={{margin:'0 0 8px',fontSize:16,fontWeight:700,color:C.text}}>Configuration</h3>
            <p style={{margin:0,fontSize:13,color:C.muted}}>Payroll configuration settings coming soon.</p>
          </div>
        )}

      </div>
      <NewEmployeeDialog open={newEmpOpen} onOpenChange={setNewEmpOpen} onCreated={fetchEmps}/>
    </div>
  )
}


