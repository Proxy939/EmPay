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

// ── Payroll Cost Placeholder ──────────────────────────────────────────────────
function CostTrendCard() {
  const { colors: C } = useTheme()
  return (
    <div style={{background:C.card, borderRadius:14, boxShadow:C.shadow,
      padding:'20px 22px', height:'100%', display:'flex', flexDirection:'column', minHeight:320}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <h3 style={{margin:0, fontSize:16, fontWeight:700, color:C.text}}>Employer Cost Trend</h3>
        <span style={{fontSize:11, padding:'3px 10px', borderRadius:20,
          background:C.accentL, color:C.accent, fontWeight:600}}>Coming Soon</span>
      </div>
      <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', gap:12, border:`2px dashed ${C.border}`, borderRadius:12, padding:20}}>
        <Wallet size={36} color={C.border}/>
        <div style={{textAlign:'center'}}>
          <p style={{margin:0, fontWeight:600, color:C.muted, fontSize:14}}>No payroll data yet</p>
          <p style={{margin:'4px 0 0', fontSize:12, color:C.muted}}>
            Cost trends will appear once the Payroll module is active.
          </p>
        </div>
      </div>
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



// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({ search, onSearch, onAddEmployee, canAdd }) {
  const { colors: C, theme, toggle } = useTheme()
  const user    = JSON.parse(localStorage.getItem('user') || '{}')
  const name    = user?.name || 'User'
  const initials= name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
      <div>
        <h1 style={{margin:0,fontSize:24,fontWeight:800,color:C.text}}>Dashboard</h1>
        <p style={{margin:0,color:C.muted,fontSize:13,marginTop:2}}>Monitor all of your HR metrics here</p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        {canAdd && (
          <button onClick={onAddEmployee}
            style={{display:'flex',alignItems:'center',gap:6,height:36,padding:'0 14px',borderRadius:10,
              border:'none',background:C.accent,color:'white',fontWeight:600,fontSize:13,cursor:'pointer'}}>
            <UserPlus size={14}/> New Employee
          </button>
        )}
        <div style={{position:'relative'}}>
          <Search size={14} color={C.muted} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Search anything"
            style={{height:36,paddingLeft:32,paddingRight:12,borderRadius:10,border:`1px solid ${C.border}`,
              background:C.inputBg,color:C.text,fontSize:13,outline:'none',width:200}}/>
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
        <div style={{width:36,height:36,borderRadius:'50%',background:C.accent,display:'flex',
          alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:13,cursor:'pointer'}}>
          {initials}
        </div>
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

  const fetchEmps = () => {
    api.get('/employees').then(r=>{ setEmployees(r.data.employees||[]); setLoading(false) }).catch(()=>setLoading(false))
  }
  useEffect(()=>{ fetchEmps() },[])

  const total     = employees.length
  const checkedIn = employees.filter(e=>e.workStatus==='CHECKED_IN').length
  const onLeave   = employees.filter(e=>e.workStatus==='ON_LEAVE').length
  const absent    = employees.filter(e=>e.workStatus==='ABSENT').length

  const filtered  = search
    ? employees.filter(e=>`${e.firstName} ${e.lastName} ${e.department||''} ${e.user?.email||''}`
        .toLowerCase().includes(search.toLowerCase()))
    : employees

  const pct = (n) => total > 0 ? `${Math.round((n/total)*100)}% of workforce` : 'No employees yet'
  const metrics = [
    { label:'Total Employees',       value:total,     icon:Users,        trend: total > 0 ? `${total} active ${total===1?'employee':'employees'}` : 'No employees yet' },
    { label:'Checked In Today',      value:checkedIn, icon:Clock,        trend: pct(checkedIn) },
    { label:'On Leave Today',        value:onLeave,   icon:PlaneTakeoff, trend: pct(onLeave)   },
    { label:'Absent Today',          value:absent,    icon:BarChart2,    trend: pct(absent)    },
  ]

  const role      = JSON.parse(localStorage.getItem('user') || '{}')?.role || 'EMPLOYEE'
  const canAdd    = ['ADMIN','HR_OFFICER'].includes(role)

  return (
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,fontFamily:"'Geist Variable','Inter',sans-serif"}}>
      {/* Animated dark sidebar (fixed, 64px collapsed) */}
      <Sidebar />

      {/* Main — pl-16 (64px) offsets the collapsed sidebar */}
      <div style={{flex:1,marginLeft:64,padding:'28px 28px 40px',minWidth:0,overflowX:'hidden'}}>
        <TopBar search={search} onSearch={setSearch} onAddEmployee={()=>setNewEmpOpen(true)} canAdd={canAdd}/>


        {/* ── Top section grid ── */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,marginBottom:20,alignItems:'start'}}>

          {/* Left: metrics + attendance */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Metric Cards */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {metrics.map(m=>(
                <MetricCard key={m.label} loading={loading} {...m}/>
              ))}
            </div>

            {/* Today's Attendance */}
            <div style={{background:C.card, borderRadius:14, boxShadow:C.shadow, padding:'20px 22px'}}>
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

          {/* Right: Cost trend (payroll module pending) */}
          <CostTrendCard />
        </div>

        {/* ── Employee Table ── */}
        <div style={{background:C.card, borderRadius:14, boxShadow:C.shadow, overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <Users size={16} color={C.accent}/>
              <span style={{fontWeight:700,fontSize:15,color:C.text}}>Total Employees</span>
              <span style={{background:C.accentL,color:C.accent,fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:20}}>
                {loading?'…':total.toLocaleString()}
              </span>
            </div>
            <div style={{display:'flex',gap:10}}>
              <div style={{position:'relative'}}>
                <Search size={13} color={C.muted} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or ID"
                  style={{height:32,paddingLeft:28,paddingRight:10,borderRadius:8,border:`1px solid ${C.border}`,
                    background:C.inputBg,color:C.text,fontSize:12,outline:'none',width:180}}/>
              </div>
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
      </div>

      {/* New Employee Dialog */}
      <NewEmployeeDialog open={newEmpOpen} onOpenChange={setNewEmpOpen} onCreated={fetchEmps}/>
    </div>
  )
}
