import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Search, Zap, IndianRupee, Building2, AlertTriangle, ArrowRight, Printer, CheckCircle2, ChevronRight, X, FileText } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'

// Static light-mode theme tokens (shadcn-aligned)
const T = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  indigo: '#4f46e5',
  indigoL: '#eef2ff',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  shadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
  radius: 12
}

const A = T.indigo, TC = T.cyan, G = T.green, O = T.amber, R = T.red

const inr = v => '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pill = (bg, color) => ({ background: bg, color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 })

/* ── Mock data (Tables only) ────────────────────── */
const ST = {
  Pending: ['#fef3c7', '#d97706'],
  'In Progress': ['#dbeafe', '#1d4ed8'],
  Validated: ['#e0e7ff', '#4338ca'],
  Done: ['#dcfce7', '#16a34a'],
  Computed: ['#e0f2fe', '#0284c7'],
}

/* ── Tiny shared components ────────────────────── */
const Badge = ({ s }) => { const [bg, c] = ST[s] || ['#f1f5f9', '#475569']; return <span style={pill(bg, c)}>{s}</span> }

const Toggle = ({ val, set }) => (
  <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', fontSize: 11, background: T.card, padding: 2 }}>
    {['annually', 'monthly'].map(m => (
      <button key={m} onClick={() => set(m)} style={{
        padding: '4px 14px', border: 'none', cursor: 'pointer', fontWeight: 600, borderRadius: 6,
        background: val === m ? T.indigo : 'transparent', color: val === m ? '#fff' : T.muted, textTransform: 'capitalize', transition: 'all .15s'
      }}>{m}</button>
    ))}
  </div>
)

const ChartCard = ({ title, data, color, mode, onMode }) => (
  <div style={{ background: T.card, borderRadius: T.radius, boxShadow: T.shadow, padding: '24px', flex: 1, minWidth: 0, border: `1px solid ${T.border}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{title}</span>
      <Toggle val={mode} set={onMode} />
    </div>
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data[mode]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
        <XAxis dataKey="m" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} dy={10} />
        <YAxis tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
        <Tooltip formatter={v => inr(v)} cursor={{ fill: T.bg }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: T.shadow, fontSize: 12, fontWeight: 600 }} />
        <Bar dataKey="v" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

/* ── CREATE PAYRUN MODAL ────────────────────────── */
function CreatePayrunModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!name || !start || !end) return setErr('All fields are required')
    setLoading(true)
    try {
      const api = (await import('../lib/api')).default
      await api.post('/payroll', { name, periodStart: start, periodEnd: end })
      onCreated()
      onClose()
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Error creating payrun')
    } finally {
      setLoading(false)
    }
  }

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', background: '#fff', color: T.text, fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }
  const lbl = { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.text }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: T.bg, borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: T.text }}>Create New Payrun</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 24 }}>
          {err && <p style={{ margin: '0 0 16px', color: T.red, fontSize: 13, fontWeight: 600 }}>{err}</p>}
          <label style={lbl}>Payrun Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. May 2026 Payroll" style={inp} autoFocus/>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Start Date</label>
              <input type="date" value={start} onChange={e=>setStart(e.target.value)} style={inp}/>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>End Date</label>
              <input type="date" value={end} onChange={e=>setEnd(e.target.value)} style={inp}/>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" onClick={onClose} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 16px', fontWeight: 600, color: T.text, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: T.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13 }}>{loading ? 'Creating...' : 'Create Payrun'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── DASHBOARD TAB ───────────────────────────────── */
function DashboardTab() {
  const card = { background: T.card, borderRadius: T.radius, boxShadow: T.shadow, padding: '24px', border: `1px solid ${T.border}` }
  const [cm, setCm] = useState('annually'), [em, setEm] = useState('annually')
  const [showAI, setShowAI] = useState(false)
  
  const [data, setData] = useState({
    cost: { annually: [], monthly: [] },
    count: { annually: [], monthly: [] },
    summary: { mp: 0, mpDiff: 0, tc: 0, tcDiff: 0 }
  })

  useEffect(() => {
    import('../lib/api').then(m => {
      const api = m.default
      const year = new Date().getFullYear()
      Promise.all([
        api.get(`/dashboard/employer-cost-trend?year=${year}`),
        api.get(`/dashboard/employee-count-trend?year=${year}`)
      ]).then(([cRes, eRes]) => {
        const cTrend = cRes.data.data || []
        const eTrend = eRes.data.data || []
        
        const annCost = cTrend.map(c => ({ m: c.month, v: c.employerCost }))
        const annCount = eTrend.map(c => ({ m: c.month, v: c.count }))
        
        const cmIdx = new Date().getMonth()
        const pmIdx = cmIdx === 0 ? 0 : cmIdx - 1
        
        const currC = cTrend[cmIdx] || { grossPayroll: 0, employerCost: 0 }
        const prevC = cTrend[pmIdx] || { grossPayroll: 0, employerCost: 0 }
        
        const mpDiff = prevC.grossPayroll ? ((currC.grossPayroll - prevC.grossPayroll) / prevC.grossPayroll) * 100 : 0
        const tcDiff = prevC.employerCost ? ((currC.employerCost - prevC.employerCost) / prevC.employerCost) * 100 : 0
        
        const currCount = annCount[cmIdx]?.v || 0

        setData({
          cost: {
            annually: annCost,
            monthly: [
              { m: 'Wk 1', v: currC.employerCost * 0.25 },
              { m: 'Wk 2', v: currC.employerCost * 0.25 },
              { m: 'Wk 3', v: currC.employerCost * 0.25 },
              { m: 'Wk 4', v: currC.employerCost * 0.25 }
            ]
          },
          count: {
            annually: annCount,
            monthly: [
              { m: 'Wk 1', v: currCount },
              { m: 'Wk 2', v: currCount },
              { m: 'Wk 3', v: currCount },
              { m: 'Wk 4', v: currCount }
            ]
          },
          summary: { mp: currC.grossPayroll, mpDiff, tc: currC.employerCost, tcDiff }
        })
      }).catch(console.error)
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'inherit' }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={{ width: 40, height: 40, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><IndianRupee size={20} color={T.text} /></div>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, fontWeight: 600 }}>Monthly Payroll</p>
          <p style={{ margin: '8px 0 12px', fontSize: 28, fontWeight: 800, lineHeight: 1, color: T.text }}>{inr(data.summary.mp)}</p>
          <span style={pill(data.summary.mpDiff >= 0 ? '#dcfce7' : '#fee2e2', data.summary.mpDiff >= 0 ? '#16a34a' : R)}>
            {data.summary.mpDiff >= 0 ? '▲ +' : '▼ '}{data.summary.mpDiff.toFixed(2)}%
          </span>
        </div>
        <div style={card}>
          <div style={{ width: 40, height: 40, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Building2 size={20} color={T.text} /></div>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, fontWeight: 600 }}>Total Employer Cost</p>
          <p style={{ margin: '8px 0 12px', fontSize: 28, fontWeight: 800, lineHeight: 1, color: T.text }}>{inr(data.summary.tc)}</p>
          <span style={pill(data.summary.tcDiff >= 0 ? '#dcfce7' : '#fee2e2', data.summary.tcDiff >= 0 ? '#16a34a' : R)}>
            {data.summary.tcDiff >= 0 ? '▲ +' : '▼ '}{data.summary.tcDiff.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'flex', gap: 16 }}>
        <ChartCard title="Employer Cost" data={data.cost} color={T.indigo} mode={cm} onMode={setCm} />
        <ChartCard title="Employee Count" data={data.count} color={T.cyan} mode={em} onMode={setEm} />
      </div>
    </div>
  )
}


/* ── PAYRUN LIST ────────────────────────────────── */
function PayrunList({ onOpen }) {
  const card = { background: T.card, borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.border}` }
  const [filter, setFilter] = useState('All')
  const [payruns, setPayruns] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  
  const fetchPayruns = () => {
    import('../lib/api').then(m => m.default.get('/payroll')).then(r => {
      setPayruns(r.data.data || [])
    }).catch(console.error)
  }
  useEffect(() => { fetchPayruns() }, [])

  const filters = ['All', 'PENDING', 'IN_PROGRESS', 'VALIDATED', 'DONE']
  const rows = filter === 'All' ? payruns : payruns.filter(r => r.status === filter)

  const TH = { padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.muted, borderBottom: `1px solid ${T.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const TD = { padding: '14px 20px', fontSize: 13, color: T.text }
  
  const formatPeriod = (s, e) => {
    const f = d => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    return `${f(s)} – ${f(e)}`
  }

  const formatStatus = s => s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: T.text }}>Payruns</span>
        <button onClick={() => setShowCreate(true)} style={{ background: T.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ New Payrun</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 999, border: `1px solid ${filter === f ? T.indigo : T.border}`, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all .15s',
            background: filter === f ? T.indigoL : '#fff', color: filter === f ? T.indigo : T.muted
          }}>{f === 'All' ? 'All' : formatStatus(f)}</button>
        ))}
      </div>
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: T.bg }}>
            {['Payrun Name', 'Period', 'Employees', 'Employer Cost', 'Gross', 'Net', 'Status', 'Action'].map(h => (
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ ...TD, fontWeight: 700 }}>{r.name}</td>
                <td style={{ ...TD, color: T.muted }}>{formatPeriod(r.periodStart, r.periodEnd)}</td>
                <td style={{ ...TD, color: T.muted }}>{r._count?.payslips || 0} Employees</td>
                <td style={TD}>{inr(r.totalEmployerCost || 0)}</td>
                <td style={TD}>{inr(r.totalGross || 0)}</td>
                <td style={{ ...TD, fontWeight: 700 }}>{inr(r.totalNet || 0)}</td>
                <td style={TD}><Badge s={formatStatus(r.status)} /></td>
                <td style={TD}>
                  <button onClick={() => onOpen(r)} style={{
                    background: '#fff', color: T.text, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6,
                    borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>Open <ArrowRight size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: T.muted }}>No payruns found.</td></tr>}
          </tbody>
        </table>
      </div>
      {showCreate && <CreatePayrunModal onClose={() => setShowCreate(false)} onCreated={fetchPayruns} />}
    </div>
  )
}

/* ── PAYSLIP LIST ───────────────────────────────── */
function PayslipList({ payrun, onView, onBack }) {
  const card = { background: T.card, borderRadius: T.radius, boxShadow: T.shadow, border: `1px solid ${T.border}` }
  const TH = {
    padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.muted,
    borderBottom: `1px solid ${T.border}`, textTransform: 'uppercase', letterSpacing: '0.04em'
  }
  const TD = { padding: '14px 20px', fontSize: 13, color: T.text }

  const [pr, setPr] = useState(payrun)
  const [payslips, setPayslips] = useState([])
  const [loadingAction, setLoadingAction] = useState(false)

  const fetchData = async () => {
    try {
      const api = (await import('../lib/api')).default
      const [prRes, psRes] = await Promise.all([
        api.get(`/payroll/${payrun.id}`),
        api.get(`/payroll/${payrun.id}/payslips`)
      ])
      setPr(prRes.data.data)
      setPayslips(psRes.data.data)
    } catch(e) { console.error(e) }
  }
  
  useEffect(() => { fetchData() }, [payrun.id])

  const handleGenerate = async () => {
    setLoadingAction(true)
    try {
      const api = (await import('../lib/api')).default
      await api.post(`/payroll/${payrun.id}/generate`)
      await fetchData()
    } catch(e) { alert(e.response?.data?.message || 'Error generating payslips') }
    setLoadingAction(false)
  }

  const handleValidate = async () => {
    setLoadingAction(true)
    try {
      const api = (await import('../lib/api')).default
      await api.patch(`/payroll/${payrun.id}/validate`)
      await fetchData()
    } catch(e) { alert(e.response?.data?.message || 'Error validating payrun') }
    setLoadingAction(false)
  }

  const formatPeriod = (s) => {
    return new Date(s).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }
  const formatStatus = s => s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Breadcrumb */}
      <p style={{ margin: '0 0 16px', fontSize: 13, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', padding: 0, gap: 4 }}><ArrowRight size={14} style={{ transform: 'rotate(180deg)' }}/> Back</button>
        <span style={{color:T.border}}>|</span> <span>Payroll</span> <ChevronRight size={12} /> <span>Payruns</span> <ChevronRight size={12} /> <span style={{ color: T.text, fontWeight: 600 }}>{pr.name}</span>
      </p>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: 24, color: T.text }}>{pr.name}</h2>
        <Badge s={formatStatus(pr.status)} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={handleValidate} disabled={loadingAction} style={{
            border: `1px solid ${T.border}`, color: T.text, background: '#fff', borderRadius: 8,
            padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: loadingAction ? 'not-allowed' : 'pointer'
          }}>Validate</button>
          <button onClick={handleGenerate} disabled={loadingAction} style={{
            background: T.indigo, color: '#fff', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: loadingAction ? 'not-allowed' : 'pointer'
          }}><Zap size={14} /> Generate All Payslips</button>
        </div>
      </div>
      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[['Total', pr.totalGross || 0], ['Employer Cost', pr.totalEmployerCost || 0], ['Net', pr.totalNet || 0]].map(([l, v]) => (
          <div key={l} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 20px' }}>
            <span style={{ fontSize: 13, color: T.muted, display: 'block', marginBottom: 4, fontWeight: 500 }}>{l}</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{inr(v)}</span>
          </div>
        ))}
      </div>
      {/* Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: T.bg }}>
            {['Employee', 'Pay Period', 'Employer Cost', 'Basic Wage', 'Gross Wage', 'Net Wage', 'Status', 'Action'].map(h => (
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {payslips.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={TD}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: T.indigoL, color: T.indigo,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700
                    }}>
                      {p.employee.firstName[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: T.text }}>{p.employee.firstName} {p.employee.lastName}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{p.employee.user?.loginId || 'EMP'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...TD, color: T.muted }}>{formatPeriod(p.periodStart)}</td>
                <td style={TD}>{inr(p.employerCost || 0)}</td>
                <td style={TD}>{inr(p.basicWage || 0)}</td>
                <td style={TD}>{inr(p.grossAmount || 0)}</td>
                <td style={{ ...TD, fontWeight: 700 }}>{inr(p.netAmount || 0)}</td>
                <td style={TD}><Badge s={formatStatus(p.status)} /></td>
                <td style={TD}>
                  <button onClick={() => onView(p)} style={{
                    background: '#fff', color: T.text, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6,
                    borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}>View</button>
                </td>
              </tr>
            ))}
            {payslips.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: T.muted }}>No payslips found. Click "Generate All Payslips".</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── PAYSLIP DETAIL MODAL ───────────────────────── */
const EARNINGS = [
  ['Basic Salary', 25000], ['House Rent Allowance', 12500], ['Standard Allowance', 4167],
  ['Performance Bonus', 2082.5], ['Leave Travel Allowance', 2082.5], ['Fixed Allowance', 4168],
]
const DEDUCTIONS = [
  ['PF Employee', -3000], ['PF Employer', -3000], ['Professional Tax', -200],
]
const STEPS = ['New Payslip', 'Compute', 'Validate', 'Done']

function PayslipDetailModal({ payslip, payrun, onClose, onPrint }) {
  const [step, setStep] = useState(1)
  const gross = EARNINGS.reduce((s, [, v]) => s + v, 0)
  const totalDed = DEDUCTIONS.reduce((s, [, v]) => s + v, 0)
  const net = gross + totalDed
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 920, maxHeight: '92vh',
        overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)'
      }}>
        {/* Stepper header */}
        <div style={{
          background: '#f9fafb', borderRadius: '16px 16px 0 0', padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => setStep(i)} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 999, border: 'none',
                  cursor: 'pointer', fontWeight: 700, fontSize: 12, transition: 'all .15s',
                  background: step === i ? T.indigo : 'transparent', color: step === i ? '#fff' : T.muted
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 800,
                    background: step === i ? 'rgba(255,255,255,0.25)' : i < step ? T.green : T.border,
                    color: step === i ? '#fff' : i < step ? '#fff' : T.muted
                  }}>{i < step ? <CheckCircle2 size={12}/> : i + 1}</span>
                  {s}
                </button>
                {i < STEPS.length - 1 && <ChevronRight size={14} style={{ color: T.border, margin: '0 4px' }}/>}
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
            padding: '6px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: T.text, display: 'flex', alignItems: 'center', gap: 6
          }}><X size={14} /> Close</button>
        </div>

        <div style={{ padding: '22px 28px' }}>
          {/* Employee info */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22,
            background: '#f9fafb', borderRadius: 12, padding: '16px 20px'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 16 }}>{payslip.name}</p>
              <p style={{ margin: 2, fontSize: 12, color: '#6b7280' }}>{payslip.code}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              {[['Payrun', payrun.name], ['Salary Structure', 'Regular Pay'],
              ['Period', '01 Oct to 31 Oct'], ['Status', payslip.status]].map(([l, v]) => (
                <div key={l}>
                  <span style={{ color: '#9ca3af', fontWeight: 600 }}>{l}: </span>
                  <span style={{ color: l === 'Payrun' ? T : l === 'Status' ? A : '#374151', fontWeight: l === 'Payrun' || l === 'Status' ? 700 : 400 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Worked Days */}
            <div>
              <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#374151' }}>Worked Days</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f0eeff' }}>
                  {['Type', 'Days', 'Amount'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: A }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[['Attendance', '20.00 (5 working days/week)', inr(45833.33)],
                  ['Paid Time Off', '2.00 (2 Paid leaves/month)', inr(4166.67)]].map(([t, d, a]) => (
                    <tr key={t} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '9px 12px', color: '#374151' }}>{t}</td>
                      <td style={{ padding: '9px 12px', color: '#6b7280', fontSize: 11 }}>{d}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{a}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
                    <td style={{ padding: '9px 12px' }}>Total</td>
                    <td style={{ padding: '9px 12px' }}>22.00</td>
                    <td style={{ padding: '9px 12px', color: A }}>{inr(50000)}</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9ca3af', fontStyle: 'italic', lineHeight: 1.5 }}>
                Salary is calculated based on employee's monthly attendance. Paid leaves are included in total payable days, while unpaid leaves are deducted.
              </p>
            </div>

            {/* Salary Computation */}
            <div style={{ position: 'relative' }}>
              <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#374151' }}>Salary Computation</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  {['Component', 'Rate %', 'Amount'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {EARNINGS.map(([name, val]) => (
                    <tr key={name} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '7px 12px', color: '#374151' }}>{name}</td>
                      <td style={{ padding: '7px 12px', color: '#9ca3af' }}>100</td>
                      <td style={{ padding: '7px 12px', fontWeight: 500 }}>{inr(val)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#eef2ff', fontWeight: 800 }}>
                    <td style={{ padding: '9px 12px', color: A }}>Gross</td>
                    <td style={{ padding: '9px 12px' }}></td>
                    <td style={{ padding: '9px 12px', color: A }}>{inr(gross)}</td>
                  </tr>
                  {DEDUCTIONS.map(([name, val]) => (
                    <tr key={name} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '7px 12px', color: '#374151' }}>{name}</td>
                      <td style={{ padding: '7px 12px', color: '#9ca3af' }}>100</td>
                      <td style={{ padding: '7px 12px', fontWeight: 500, color: R }}>{inr(val)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f0fdf4', fontWeight: 800 }}>
                    <td style={{ padding: '9px 12px', color: G }}>Net Amount</td>
                    <td style={{ padding: '9px 12px', color: G }}>100</td>
                    <td style={{ padding: '9px 12px', color: G }}>{inr(net)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            <button onClick={() => setStep(s => Math.max(0, s - 1))} style={{ border: `1px solid ${T.border}`, background: '#fff', color: T.text, borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back</button>
            <button onClick={() => setStep(s => Math.min(3, s + 1))} style={{ background: T.indigo, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>Next <ArrowRight size={14} /></button>
            <button onClick={onPrint} style={{ background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Printer size={14} /> Print</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── PDF PREVIEW ────────────────────────────────── */
function PDFPreview({ payslip, payrun, onClose }) {
  const gross = EARNINGS.reduce((s, [, v]) => s + v, 0)
  const totalDed = DEDUCTIONS.reduce((s, [, v]) => s + v, 0)
  const net = gross + totalDed
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 720, maxHeight: '92vh',
        overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '2px solid #e0e7ff'
      }}>
        {/* Close bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 24px', borderBottom: `1px solid ${T.border}`, background: T.bg
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}><Printer size={16} /> Payslip Preview</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => window.print()} style={{
              background: T.indigo, color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}><Printer size={14} /> Print / Download</button>
            <button onClick={onClose} style={{
              background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
              padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}><X size={14} /></button>
          </div>
        </div>

        {/* Payslip card */}
        <div style={{ padding: '28px 32px', fontFamily: "'Courier New',monospace" }}>
          {/* Company header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, paddingBottom: 16, borderBottom: '2px solid #e0e7ff' }}>
            <div style={{
              width: 54, height: 54, background: '#eef2ff', borderRadius: 10, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: A
            }}>E</div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: A }}>EmPay HRMS</p>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Salary Slip for the month of Oct 2025</p>
            </div>
          </div>

          {/* Employee info grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12,
            background: '#f8f0ff', padding: '14px 16px', borderRadius: 10, marginBottom: 16
          }}>
            {[
              ['Employee Name', payslip.name], ['PAN', 'ABCDE1234F'],
              ['Employee Code', payslip.code], ['UAN', '1234567890'],
              ['Department', 'Engineering'], ['Bank A/C', 'XXXX4321'],
              ['Location', 'Pune'], ['Pay Period', '01/10 – 31/10/2025'],
              ['Date of Joining', '20/06/2022'], ['Pay Date', '02/11/2025'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', gap: 4 }}>
                <span style={{ color: '#6b7280', minWidth: 110 }}>{l} :</span>
                <span style={{ fontWeight: 600, color: '#1f2937' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Worked days */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
            <thead><tr style={{ background: '#f8f0ff' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', color: '#6b7280' }}>Worked Days</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', color: '#6b7280' }}>Number of Days</th>
            </tr></thead>
            <tbody>
              {[['Attendance', '20 days'], ['Total', '22 days']].map(([l, v]) => (
                <tr key={l} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '6px 10px' }}>{l}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Earnings / Deductions */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
            <thead><tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', color: '#6b7280' }}>Earnings</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', color: '#6b7280' }}>Amount</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', color: '#6b7280' }}>Deductions</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', color: '#6b7280' }}>Amount</th>
            </tr></thead>
            <tbody>
              {EARNINGS.map(([e, ev], i) => {
                const [d, dv] = DEDUCTIONS[i] || []
                return (
                  <tr key={e} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '6px 10px' }}>{e}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{inr(ev)}</td>
                    <td style={{ padding: '6px 10px', color: R }}>{d || ''}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: R }}>{d ? inr(dv) : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Net payable */}
          <div style={{
            background: TC, borderRadius: 10, padding: '14px 20px', color: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total Net Payable (Gross – Deductions)</span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{inr(net)}</p>
              <p style={{ margin: 0, fontSize: 11, opacity: .85 }}>Forty-Three Thousand Eight Hundred Only</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── MAIN PAYROLL PAGE (unified — no tabs) ──────── */
export default function Payroll() {
  const [view, setView] = useState('list')   // 'list' | 'payslips' | 'detail' | 'pdf'
  const [selPayrun, setSelPayrun] = useState(null)
  const [selPayslip, setSelPayslip] = useState(null)
  const [employees, setEmployees] = useState([])

  // Fetch real employees for warnings
  useState(() => { import('../lib/api').then(m => m.default.get('/employees').then(r => setEmployees(r.data.employees || [])).catch(() => { })) }, [])

  const openPayrun = pr => { setSelPayrun(pr); setView('payslips') }
  const openPayslip = ps => { setSelPayslip(ps); setView('detail') }
  const backToList = () => { setView('list'); setSelPayrun(null) }
  const openPDF = () => setView('pdf')
  const closePDF = () => setView('detail')
  const closeDetail = () => setView('payslips')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'inherit' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 64, padding: '28px 28px 40px', minWidth: 0, overflowX: 'hidden' }}>

        {/* ── Page title ── */}
        <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800, color: T.text }}>Payroll</h1>

        {/* ── Default view: dashboard stats + payrun list ── */}
        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <DashboardTab employees={employees} />
            <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 32 }}>
              <PayrunList onOpen={openPayrun} />
            </div>
          </div>
        )}

        {/* ── Payslip list (after clicking Open) ── */}
        {view === 'payslips' && selPayrun && (
          <PayslipList payrun={selPayrun} onView={openPayslip} onBack={backToList} />
        )}
      </div>

      {/* ── Modals (overlay) ── */}
      {view === 'detail' && selPayslip && selPayrun && (
        <PayslipDetailModal payslip={selPayslip} payrun={selPayrun}
          onClose={closeDetail} onPrint={openPDF} />
      )}
      {view === 'pdf' && selPayslip && selPayrun && (
        <PDFPreview payslip={selPayslip} payrun={selPayrun} onClose={closePDF} />
      )}
    </div>
  )
}
