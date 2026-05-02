import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Sidebar from '@/components/layout/Sidebar'

/* ── Design tokens ─────────────────────────────── */
const A = '#4f46e5', T = '#00b4d8', G = '#22c55e', O = '#f97316', R = '#ef4444'
const BG = '#f4f5f7'
const card = { background:'#fff', borderRadius:14, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', padding:'20px 22px' }
const inr = v => '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })
const pill = (bg, color) => ({ background:bg, color, padding:'3px 11px', borderRadius:999, fontSize:11, fontWeight:700, display:'inline-block' })

/* ── Mock data ─────────────────────────────────── */
const COST_D = {
  annually:[{m:'Jan 25',v:43800},{m:'Feb 25',v:49200},{m:'Mar 25',v:49800},{m:'Apr 25',v:51000},{m:'May 25',v:48000}],
  monthly: [{m:'Wk 1',v:11000},{m:'Wk 2',v:12400},{m:'Wk 3',v:10600},{m:'Wk 4',v:9800}]
}
const CNT_D = {
  annually:[{m:'Jan 25',v:8},{m:'Feb 25',v:10},{m:'Mar 25',v:12},{m:'Apr 25',v:12},{m:'May 25',v:13}],
  monthly: [{m:'Wk 1',v:11},{m:'Wk 2',v:12},{m:'Wk 3',v:12},{m:'Wk 4',v:13}]
}
const PAYRUNS = [
  {id:1,name:'Payrun Oct 2025',period:'01 Oct – 31 Oct',emps:3,cost:49800,gross:50000,net:43800,status:'Pending'},
  {id:2,name:'Payrun Sep 2025',period:'01 Sep – 30 Sep',emps:3,cost:49200,gross:50000,net:43200,status:'Validated'},
  {id:3,name:'Payrun Aug 2025',period:'01 Aug – 31 Aug',emps:5,cost:82000,gross:85000,net:76500,status:'Done'},
]
const PAYSLIPS = [
  {id:1,name:'Arjun Mehta',   code:'OIARM E20230001',cost:16600,basic:25000,gross:50000,net:43800,status:'Done'},
  {id:2,name:'Priya Sharma',  code:'OIPRSH20220042', cost:16600,basic:25000,gross:50000,net:43800,status:'Pending'},
  {id:3,name:'Rohit Kulkarni',code:'OIROKU20210018', cost:16600,basic:25000,gross:50000,net:43800,status:'Pending'},
]
const ST = {
  Pending:    ['#fef3c7','#d97706'],
  'In Progress':['#dbeafe','#1d4ed8'],
  Validated:  ['#e0e7ff','#4338ca'],
  Done:       ['#dcfce7','#16a34a'],
}

/* ── Tiny shared components ────────────────────── */
const Badge = ({s}) => { const [bg,c]=ST[s]||['#f3f4f6','#374151']; return <span style={pill(bg,c)}>{s}</span> }

const Toggle = ({val,set}) => (
  <div style={{display:'flex',border:`1px solid ${A}`,borderRadius:999,overflow:'hidden',fontSize:11}}>
    {['annually','monthly'].map(m=>(
      <button key={m} onClick={()=>set(m)} style={{padding:'3px 13px',border:'none',cursor:'pointer',fontWeight:600,
        background:val===m?A:'#fff',color:val===m?'#fff':A,textTransform:'capitalize',transition:'all .15s'}}>{m}</button>
    ))}
  </div>
)

const ChartCard = ({title,data,color,mode,onMode}) => (
  <div style={{...card,flex:1,minWidth:0}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
      <span style={{fontWeight:700,fontSize:14}}>{title}</span>
      <Toggle val={mode} set={onMode}/>
    </div>
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data[mode]} margin={{top:4,right:4,left:0,bottom:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
        <XAxis dataKey="m" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
        <YAxis tick={{fontSize:10}} width={48} axisLine={false} tickLine={false}/>
        <Tooltip formatter={v=>inr(v)}/>
        <Bar dataKey="v" fill={color} radius={[4,4,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  </div>
)

/* ── DASHBOARD TAB ─────────────────────────────── */
function DashboardTab({employees}) {
  const [cm,setCm]=useState('annually'), [em,setEm]=useState('annually')
  const noBank=employees.filter(e=>!e.bankAccountNumber).length
  const noMgr =employees.filter(e=>!e.managerId).length
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Search */}
      <input placeholder="🔍  Search Member Or Category    ⌘ + F" style={{
        width:'100%',padding:'11px 16px',borderRadius:10,border:'1px solid #e5e7eb',
        fontSize:13,outline:'none',boxSizing:'border-box',background:'#fff',color:'#374151'
      }}/>

      {/* Stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr 1fr',gap:16}}>
        <div style={{background:A,borderRadius:14,padding:'24px 22px',color:'#fff',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{width:38,height:38,background:'rgba(255,255,255,0.18)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📊</div>
          <p style={{margin:0,fontWeight:800,fontSize:15}}>Generate Payroll Report</p>
          <p style={{margin:0,fontSize:12,opacity:.78}}>Analyze your payroll data with AI-powered insights</p>
          <button style={{background:'#fff',color:A,border:'none',borderRadius:8,padding:'8px 16px',fontWeight:700,fontSize:12,cursor:'pointer',alignSelf:'flex-start',marginTop:4}}>⚡ Generate Report</button>
        </div>
        <div style={card}>
          <div style={{width:36,height:36,background:'#e0f7fa',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,fontSize:18}}>💰</div>
          <p style={{margin:0,fontSize:12,color:'#6b7280',fontWeight:500}}>Monthly Payroll</p>
          <p style={{margin:'7px 0 10px',fontSize:24,fontWeight:800,lineHeight:1}}>{inr(43800)}</p>
          <span style={pill('#fee2e2',R)}>▼ -18.24%</span>
        </div>
        <div style={card}>
          <div style={{width:36,height:36,background:'#ede9fe',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,fontSize:18}}>🏢</div>
          <p style={{margin:0,fontSize:12,color:'#6b7280',fontWeight:500}}>Total Employer Cost</p>
          <p style={{margin:'7px 0 10px',fontSize:24,fontWeight:800,lineHeight:1}}>{inr(49800)}</p>
          <span style={pill('#dcfce7','#16a34a')}>▲ +24.92%</span>
        </div>
      </div>

      {/* Warnings */}
      {(noBank>0||noMgr>0)&&(
        <div style={card}>
          <p style={{margin:'0 0 12px',fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:6}}>
            <span style={{color:O}}>⚠</span> Warnings
          </p>
          {noBank>0&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              borderLeft:`3px solid ${O}`,paddingLeft:12,marginBottom:10,paddingTop:2,paddingBottom:2}}>
              <span style={{fontSize:13}}>⚠ {noBank} Employee without Bank A/C</span>
              <button style={{background:'none',border:'none',color:T,fontWeight:700,fontSize:12,cursor:'pointer'}}>Fix Now →</button>
            </div>
          )}
          {noMgr>0&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              borderLeft:`3px solid ${O}`,paddingLeft:12,paddingTop:2,paddingBottom:2}}>
              <span style={{fontSize:13}}>⚠ {noMgr} Employee without Manager</span>
              <button style={{background:'none',border:'none',color:T,fontWeight:700,fontSize:12,cursor:'pointer'}}>Fix Now →</button>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div style={{display:'flex',gap:16}}>
        <ChartCard title="Employer Cost" data={COST_D} color={A} mode={cm} onMode={setCm}/>
        <ChartCard title="Employee Count" data={CNT_D} color={T} mode={em} onMode={setEm}/>
      </div>
    </div>
  )
}

/* ── PAYRUN LIST ────────────────────────────────── */
function PayrunList({onOpen}) {
  const [filter,setFilter]=useState('All')
  const filters=['All','Pending','In Progress','Validated','Done']
  const rows=filter==='All'?PAYRUNS:PAYRUNS.filter(r=>r.status===filter)
  const TH={padding:'11px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6b7280',
    borderBottom:'1px solid #f3f4f6',textTransform:'uppercase',letterSpacing:'0.05em'}
  const TD={padding:'12px 16px',fontSize:13}
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={{fontWeight:800,fontSize:20}}>Payruns</span>
        <button style={{background:A,color:'#fff',border:'none',borderRadius:9,padding:'8px 20px',fontWeight:700,fontSize:13,cursor:'pointer'}}>+ New Payrun</button>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {filters.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'5px 16px',borderRadius:999,border:'none',cursor:'pointer',fontWeight:600,fontSize:12,transition:'all .15s',
            background:filter===f?A:'#f3f4f6',color:filter===f?'#fff':'#374151'}}>{f}</button>
        ))}
      </div>
      <div style={{...card,padding:0,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f9fafb'}}>
            {['Payrun Name','Period','Employees','Employer Cost','Gross','Net','Status','Action'].map(h=>(
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} style={{borderBottom:'1px solid #f3f4f6'}}
                onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <td style={{...TD,fontWeight:600}}>{r.name}</td>
                <td style={{...TD,color:'#6b7280'}}>{r.period}</td>
                <td style={TD}>{r.emps} Employees</td>
                <td style={TD}>{inr(r.cost)}</td>
                <td style={TD}>{inr(r.gross)}</td>
                <td style={TD}>{inr(r.net)}</td>
                <td style={TD}><Badge s={r.status}/></td>
                <td style={TD}>
                  <button onClick={()=>onOpen(r)} style={{background:A,color:'#fff',border:'none',
                    borderRadius:7,padding:'5px 14px',fontSize:12,fontWeight:700,cursor:'pointer'}}>Open →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── PAYSLIP LIST ───────────────────────────────── */
function PayslipList({payrun,onView,onBack}) {
  const TH={padding:'11px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6b7280',
    borderBottom:'1px solid #f3f4f6',textTransform:'uppercase',letterSpacing:'0.04em'}
  const TD={padding:'11px 14px',fontSize:13}
  return (
    <div>
      {/* Breadcrumb */}
      <p style={{margin:'0 0 10px',fontSize:12,color:'#9ca3af'}}>
        Payroll &rsaquo; Payruns &rsaquo; <span style={{color:A,fontWeight:600}}>{payrun.name}</span>
      </p>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <button onClick={onBack} style={{background:'#f3f4f6',border:'none',borderRadius:8,
          padding:'7px 16px',fontWeight:600,fontSize:12,cursor:'pointer'}}>← Back</button>
        <span style={{fontWeight:800,fontSize:18}}>{payrun.name}</span>
        <Badge s={payrun.status}/>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button style={{border:`1.5px solid ${A}`,color:A,background:'#fff',borderRadius:8,
            padding:'7px 18px',fontWeight:700,fontSize:12,cursor:'pointer'}}>Validate</button>
          <button style={{background:A,color:'#fff',border:'none',borderRadius:8,
            padding:'7px 18px',fontWeight:700,fontSize:12,cursor:'pointer'}}>⚡ Generate All Payslips</button>
        </div>
      </div>
      {/* Summary pills */}
      <div style={{display:'flex',gap:10,marginBottom:16}}>
        {[['Total',payrun.gross],['Employer Cost',payrun.cost],['Net',payrun.net]].map(([l,v])=>(
          <div key={l} style={{background:'#eef2ff',borderRadius:9,padding:'8px 18px'}}>
            <span style={{fontSize:12,color:'#6b7280'}}>{l}: </span>
            <span style={{fontWeight:700,color:A}}>{inr(v)}</span>
          </div>
        ))}
      </div>
      {/* Table */}
      <div style={{...card,padding:0,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f9fafb'}}>
            {['Employee','Pay Period','Employer Cost','Basic Wage','Gross Wage','Net Wage','Status','Action'].map(h=>(
              <th key={h} style={TH}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {PAYSLIPS.map(p=>(
              <tr key={p.id} style={{borderBottom:'1px solid #f3f4f6'}}
                onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <td style={TD}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:A,color:'#fff',
                    display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12,
                    fontWeight:700,marginRight:10,verticalAlign:'middle'}}>
                    {p.name[0]}
                  </div>
                  <span style={{fontWeight:600}}>{p.name}</span>
                  <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>{p.code}</div>
                </td>
                <td style={{...TD,color:'#6b7280'}}>Oct 2025</td>
                <td style={TD}>{inr(p.cost)}</td>
                <td style={TD}>{inr(p.basic)}</td>
                <td style={TD}>{inr(p.gross)}</td>
                <td style={{...TD,fontWeight:700}}>{inr(p.net)}</td>
                <td style={TD}><Badge s={p.status}/></td>
                <td style={TD}>
                  <button onClick={()=>onView(p)} style={{border:`1.5px solid ${A}`,color:A,
                    background:'#fff',borderRadius:7,padding:'5px 14px',fontSize:12,fontWeight:700,cursor:'pointer'}}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── PAYSLIP DETAIL MODAL ───────────────────────── */
const EARNINGS = [
  ['Basic Salary',25000],['House Rent Allowance',12500],['Standard Allowance',4167],
  ['Performance Bonus',2082.5],['Leave Travel Allowance',2082.5],['Fixed Allowance',4168],
]
const DEDUCTIONS = [
  ['PF Employee',-3000],['PF Employer',-3000],['Professional Tax',-200],
]
const STEPS = ['New Payslip','Compute','Validate','Done']

function PayslipDetailModal({payslip,payrun,onClose,onPrint}) {
  const [step,setStep]=useState(1)
  const gross=EARNINGS.reduce((s,[,v])=>s+v,0)
  const totalDed=DEDUCTIONS.reduce((s,[,v])=>s+v,0)
  const net=gross+totalDed
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:920,maxHeight:'92vh',
        overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.18)'}}>
        {/* Stepper header */}
        <div style={{background:'#f9fafb',borderRadius:'16px 16px 0 0',padding:'14px 24px',
          display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #f0f0f0'}}>
          <div style={{display:'flex',alignItems:'center',gap:0}}>
            {STEPS.map((s,i)=>(
              <div key={s} style={{display:'flex',alignItems:'center'}}>
                <button onClick={()=>setStep(i)} style={{
                  display:'flex',alignItems:'center',gap:7,padding:'6px 16px',borderRadius:999,border:'none',
                  cursor:'pointer',fontWeight:700,fontSize:12,transition:'all .15s',
                  background:step===i?A:'transparent',color:step===i?'#fff':'#6b7280'}}>
                  <span style={{width:20,height:20,borderRadius:'50%',display:'inline-flex',alignItems:'center',
                    justifyContent:'center',fontSize:11,fontWeight:800,
                    background:step===i?'rgba(255,255,255,0.25)':i<step?G:'#e5e7eb',
                    color:step===i?'#fff':i<step?'#fff':'#9ca3af'}}>{i<step?'✓':i+1}</span>
                  {s}
                </button>
                {i<STEPS.length-1&&<span style={{color:'#d1d5db',margin:'0 2px'}}>›</span>}
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{background:'#f3f4f6',border:'none',borderRadius:8,
            padding:'6px 14px',fontWeight:700,fontSize:13,cursor:'pointer',color:'#374151'}}>✕ Close</button>
        </div>

        <div style={{padding:'22px 28px'}}>
          {/* Employee info */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:22,
            background:'#f9fafb',borderRadius:12,padding:'16px 20px'}}>
            <div>
              <p style={{margin:0,fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Employee</p>
              <p style={{margin:'4px 0 0',fontWeight:700,fontSize:16}}>{payslip.name}</p>
              <p style={{margin:2,fontSize:12,color:'#6b7280'}}>{payslip.code}</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12}}>
              {[['Payrun',payrun.name],['Salary Structure','Regular Pay'],
                ['Period','01 Oct to 31 Oct'],['Status',payslip.status]].map(([l,v])=>(
                <div key={l}>
                  <span style={{color:'#9ca3af',fontWeight:600}}>{l}: </span>
                  <span style={{color:l==='Payrun'?T:l==='Status'?A:'#374151',fontWeight:l==='Payrun'||l==='Status'?700:400}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column body */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
            {/* Worked Days */}
            <div>
              <p style={{margin:'0 0 12px',fontWeight:700,fontSize:14,color:'#374151'}}>Worked Days</p>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:'#f0eeff'}}>
                  {['Type','Days','Amount'].map(h=>(
                    <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:A}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[['Attendance','20.00 (5 working days/week)',inr(45833.33)],
                    ['Paid Time Off','2.00 (2 Paid leaves/month)',inr(4166.67)]].map(([t,d,a])=>(
                    <tr key={t} style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:'9px 12px',color:'#374151'}}>{t}</td>
                      <td style={{padding:'9px 12px',color:'#6b7280',fontSize:11}}>{d}</td>
                      <td style={{padding:'9px 12px',fontWeight:600}}>{a}</td>
                    </tr>
                  ))}
                  <tr style={{background:'#f9fafb',fontWeight:700}}>
                    <td style={{padding:'9px 12px'}}>Total</td>
                    <td style={{padding:'9px 12px'}}>22.00</td>
                    <td style={{padding:'9px 12px',color:A}}>{inr(50000)}</td>
                  </tr>
                </tbody>
              </table>
              <p style={{margin:'10px 0 0',fontSize:11,color:'#9ca3af',fontStyle:'italic',lineHeight:1.5}}>
                Salary is calculated based on employee's monthly attendance. Paid leaves are included in total payable days, while unpaid leaves are deducted.
              </p>
            </div>

            {/* Salary Computation */}
            <div style={{position:'relative'}}>
              <p style={{margin:'0 0 12px',fontWeight:700,fontSize:14,color:'#374151'}}>Salary Computation</p>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:'#f9fafb'}}>
                  {['Component','Rate %','Amount'].map(h=>(
                    <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#6b7280'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {EARNINGS.map(([name,val])=>(
                    <tr key={name} style={{borderBottom:'1px solid #f9f9f9'}}>
                      <td style={{padding:'7px 12px',color:'#374151'}}>{name}</td>
                      <td style={{padding:'7px 12px',color:'#9ca3af'}}>100</td>
                      <td style={{padding:'7px 12px',fontWeight:500}}>{inr(val)}</td>
                    </tr>
                  ))}
                  <tr style={{background:'#eef2ff',fontWeight:800}}>
                    <td style={{padding:'9px 12px',color:A}}>Gross</td>
                    <td style={{padding:'9px 12px'}}></td>
                    <td style={{padding:'9px 12px',color:A}}>{inr(gross)}</td>
                  </tr>
                  {DEDUCTIONS.map(([name,val])=>(
                    <tr key={name} style={{borderBottom:'1px solid #f9f9f9'}}>
                      <td style={{padding:'7px 12px',color:'#374151'}}>{name}</td>
                      <td style={{padding:'7px 12px',color:'#9ca3af'}}>100</td>
                      <td style={{padding:'7px 12px',fontWeight:500,color:R}}>{inr(val)}</td>
                    </tr>
                  ))}
                  <tr style={{background:'#f0fdf4',fontWeight:800}}>
                    <td style={{padding:'9px 12px',color:G}}>Net Amount</td>
                    <td style={{padding:'9px 12px',color:G}}>100</td>
                    <td style={{padding:'9px 12px',color:G}}>{inr(net)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{display:'flex',gap:10,marginTop:24,justifyContent:'flex-end'}}>
            <button onClick={()=>setStep(s=>Math.max(0,s-1))} style={{border:'1px solid #e5e7eb',background:'#fff',color:'#374151',borderRadius:8,padding:'8px 20px',fontWeight:700,fontSize:13,cursor:'pointer'}}>← Back</button>
            <button onClick={()=>setStep(s=>Math.min(3,s+1))} style={{background:A,color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontWeight:700,fontSize:13,cursor:'pointer'}}>Next →</button>
            <button onClick={onPrint} style={{background:'#f3f4f6',color:'#374151',border:'none',borderRadius:8,padding:'8px 20px',fontWeight:700,fontSize:13,cursor:'pointer'}}>🖨 Print</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── PDF PREVIEW ────────────────────────────────── */
function PDFPreview({payslip,payrun,onClose}) {
  const gross=EARNINGS.reduce((s,[,v])=>s+v,0)
  const totalDed=DEDUCTIONS.reduce((s,[,v])=>s+v,0)
  const net=gross+totalDed
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1100,display:'flex',
      alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:14,width:'100%',maxWidth:720,maxHeight:'92vh',
        overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',border:'2px solid #e0e7ff'}}>
        {/* Close bar */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
          padding:'10px 20px',borderBottom:'1px solid #f0f0f0',background:'#f9fafb'}}>
          <span style={{fontWeight:700,fontSize:14}}>🖨 Payslip Preview</span>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>window.print()} style={{background:A,color:'#fff',border:'none',
              borderRadius:8,padding:'6px 16px',fontWeight:700,fontSize:12,cursor:'pointer'}}>Print / Download</button>
            <button onClick={onClose} style={{background:'#f3f4f6',border:'none',borderRadius:8,
              padding:'6px 14px',fontWeight:700,fontSize:12,cursor:'pointer'}}>✕</button>
          </div>
        </div>

        {/* Payslip card */}
        <div style={{padding:'28px 32px',fontFamily:"'Courier New',monospace"}}>
          {/* Company header */}
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:18,paddingBottom:16,borderBottom:'2px solid #e0e7ff'}}>
            <div style={{width:54,height:54,background:'#eef2ff',borderRadius:10,display:'flex',
              alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,color:A}}>E</div>
            <div>
              <p style={{margin:0,fontWeight:800,fontSize:18,color:A}}>EmPay HRMS</p>
              <p style={{margin:0,fontSize:12,color:'#6b7280'}}>Salary Slip for the month of Oct 2025</p>
            </div>
          </div>

          {/* Employee info grid */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:12,
            background:'#f8f0ff',padding:'14px 16px',borderRadius:10,marginBottom:16}}>
            {[
              ['Employee Name', payslip.name], ['PAN', 'ABCDE1234F'],
              ['Employee Code', payslip.code], ['UAN', '1234567890'],
              ['Department', 'Engineering'],   ['Bank A/C', 'XXXX4321'],
              ['Location', 'Pune'],             ['Pay Period', '01/10 – 31/10/2025'],
              ['Date of Joining', '20/06/2022'],['Pay Date', '02/11/2025'],
            ].map(([l,v])=>(
              <div key={l} style={{display:'flex',gap:4}}>
                <span style={{color:'#6b7280',minWidth:110}}>{l} :</span>
                <span style={{fontWeight:600,color:'#1f2937'}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Worked days */}
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginBottom:16}}>
            <thead><tr style={{background:'#f8f0ff'}}>
              <th style={{padding:'7px 10px',textAlign:'left',color:'#6b7280'}}>Worked Days</th>
              <th style={{padding:'7px 10px',textAlign:'right',color:'#6b7280'}}>Number of Days</th>
            </tr></thead>
            <tbody>
              {[['Attendance','20 days'],['Total','22 days']].map(([l,v])=>(
                <tr key={l} style={{borderBottom:'1px solid #f0f0f0'}}>
                  <td style={{padding:'6px 10px'}}>{l}</td>
                  <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Earnings / Deductions */}
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginBottom:16}}>
            <thead><tr style={{background:'#f9fafb'}}>
              <th style={{padding:'7px 10px',textAlign:'left',color:'#6b7280'}}>Earnings</th>
              <th style={{padding:'7px 10px',textAlign:'right',color:'#6b7280'}}>Amount</th>
              <th style={{padding:'7px 10px',textAlign:'left',color:'#6b7280'}}>Deductions</th>
              <th style={{padding:'7px 10px',textAlign:'right',color:'#6b7280'}}>Amount</th>
            </tr></thead>
            <tbody>
              {EARNINGS.map(([e,ev],i)=>{
                const [d,dv]=DEDUCTIONS[i]||[]
                return (
                  <tr key={e} style={{borderBottom:'1px solid #f9f9f9'}}>
                    <td style={{padding:'6px 10px'}}>{e}</td>
                    <td style={{padding:'6px 10px',textAlign:'right'}}>{inr(ev)}</td>
                    <td style={{padding:'6px 10px',color:R}}>{d||''}</td>
                    <td style={{padding:'6px 10px',textAlign:'right',color:R}}>{d?inr(dv):''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Net payable */}
          <div style={{background:T,borderRadius:10,padding:'14px 20px',color:'#fff',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,fontWeight:600}}>Total Net Payable (Gross – Deductions)</span>
            <div style={{textAlign:'right'}}>
              <p style={{margin:0,fontSize:22,fontWeight:800}}>{inr(net)}</p>
              <p style={{margin:0,fontSize:11,opacity:.85}}>Forty-Three Thousand Eight Hundred Only</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── MAIN PAYROLL PAGE (unified — no tabs) ──────── */
export default function Payroll() {
  const [view,setView]=useState('list')   // 'list' | 'payslips' | 'detail' | 'pdf'
  const [selPayrun,setSelPayrun]=useState(null)
  const [selPayslip,setSelPayslip]=useState(null)
  const [employees,setEmployees]=useState([])

  // Fetch real employees for warnings
  useState(()=>{ import('../lib/api').then(m=>m.default.get('/employees').then(r=>setEmployees(r.data.employees||[])).catch(()=>{})) },[])

  const openPayrun  = pr => { setSelPayrun(pr);  setView('payslips') }
  const openPayslip = ps => { setSelPayslip(ps); setView('detail')   }
  const backToList  = ()  => { setView('list');   setSelPayrun(null)  }
  const openPDF     = ()  => setView('pdf')
  const closePDF    = ()  => setView('detail')
  const closeDetail = ()  => setView('payslips')

  return (
    <div style={{display:'flex',minHeight:'100vh',background:BG,fontFamily:"'Plus Jakarta Sans','Inter',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <Sidebar/>
      <div style={{flex:1,marginLeft:64,padding:'28px 28px 40px',minWidth:0,overflowX:'hidden'}}>

        {/* ── Page title ── */}
        <h1 style={{margin:'0 0 22px',fontSize:22,fontWeight:800,color:'#111827'}}>Payroll</h1>

        {/* ── Default view: dashboard stats + payrun list ── */}
        {view==='list' && (
          <div style={{display:'flex',flexDirection:'column',gap:24}}>
            <DashboardTab employees={employees}/>
            <div style={{borderTop:'2px solid #f3f4f6',paddingTop:24}}>
              <PayrunList onOpen={openPayrun}/>
            </div>
          </div>
        )}

        {/* ── Payslip list (after clicking Open) ── */}
        {view==='payslips' && selPayrun && (
          <PayslipList payrun={selPayrun} onView={openPayslip} onBack={backToList}/>
        )}
      </div>

      {/* ── Modals (overlay) ── */}
      {view==='detail' && selPayslip && selPayrun && (
        <PayslipDetailModal payslip={selPayslip} payrun={selPayrun}
          onClose={closeDetail} onPrint={openPDF}/>
      )}
      {view==='pdf' && selPayslip && selPayrun && (
        <PDFPreview payslip={selPayslip} payrun={selPayrun} onClose={closePDF}/>
      )}
    </div>
  )
}
