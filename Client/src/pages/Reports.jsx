import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import api from '@/lib/api'
import { FileText, Printer, RotateCcw, BarChart2, User, Calendar, Briefcase, Lock, AlertCircle, Loader2 } from 'lucide-react'

/* ── Fixed light-mode design tokens (shadcn-aligned) ── */
const T = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  shadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
}
const A = '#0f172a', TC = '#475569', O = '#d97706', R = '#ef4444'
const card_s = () => ({background:T.card,borderRadius:12,border:`1px solid ${T.border}`,boxShadow:T.shadow})
const inr=v=>'₹'+Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const YEARS=[2025,2024,2023,2022]
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December']

/* ── mock employees (fallback) ─── */
const MOCK_EMPS=[
  {id:'1',name:'Arjun Mehta',   code:'OIARM E20230001',dept:'Engineering', designation:'Senior Developer',  join:'20 June 2022'},
  {id:'2',name:'Priya Sharma',  code:'OIPRSH20220042', dept:'HR',           designation:'HR Executive',      join:'15 March 2022'},
  {id:'3',name:'Rohit Kulkarni',code:'OIROKU20210018', dept:'Finance',      designation:'Finance Analyst',   join:'10 Jan 2021'},
  {id:'4',name:'Sneha Patil',   code:'OISNPA20230055', dept:'Engineering',  designation:'Frontend Developer',join:'01 Aug 2023'},
  {id:'5',name:'Vikram Desai',  code:'OIVIDE20220031', dept:'Operations',   designation:'Operations Lead',   join:'12 May 2022'},
  {id:'6',name:'Ananya Joshi',  code:'OIANJO20230072', dept:'Marketing',    designation:'Brand Manager',     join:'07 Nov 2023'},
]

/* ── salary data ─── */
const EARNINGS=[
  ['Basic Salary',25000],['House Rent Allowance',12500],['Standard Allowance',4167],
  ['Performance Bonus',2082.5],['Leave Travel Allowance',2082.5],['Fixed Allowance',4168],
]
const DEDUCTIONS=[
  ['PF Employee (6%)',-3000],['PF Employer (6%)',-3000],['Professional Tax',-200],['TDS Deduction',0],
]
const GROSS=EARNINGS.reduce((s,[,v])=>s+v,0)
const TOTAL_DED=DEDUCTIONS.reduce((s,[,v])=>s+v,0)
const NET=GROSS+TOTAL_DED

const MONTHLY_DATA=MONTHS.map((m,i)=>({
  month:m, working:[22,20,23,22,21,22,23,21,22,20,22,21][i],
  leaves:2, gross:GROSS, ded:Math.abs(TOTAL_DED), net:NET
}))
const YR_TOTAL={working:259,leaves:24,gross:GROSS*12,ded:Math.abs(TOTAL_DED)*12,net:NET*12}

/* ── Shimmer ─── */
function Shimmer({h=18,w='100%',mb=10,r=8}){
  return(
    <div style={{height:h,width:w,borderRadius:r,marginBottom:mb,
      background:'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
      backgroundSize:'200% 100%',animation:'shimmer 1.2s infinite'}}>
    </div>
  )
}

/* ── Empty state ─── */
function EmptyState(){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      padding:'80px 20px',gap:14,textAlign:'center'}}>
      <div style={{width:64,height:64,borderRadius:'50%',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',color:T.muted}}>
        <BarChart2 size={32} strokeWidth={1.5} />
      </div>
      <p style={{margin:0,fontWeight:700,fontSize:16,color:T.text}}>No Report Generated</p>
      <p style={{margin:0,fontSize:13,color:T.muted,maxWidth:280,lineHeight:1.6}}>
        Select an employee and year to generate the Salary Statement Report.
      </p>
    </div>
  )
}

/* ── Form Card ─── */
function FormCard({employees,onGenerate,onReset,loading,generated,selEmp,setSelEmp,selYear,setSelYear}){
  const [err,setErr]=useState('')
  const handleGen=()=>{
    if(!selEmp||!selYear){setErr('Please select both an employee and a year');return}
    setErr(''); onGenerate()
  }
  const empList=employees.length>0?employees:MOCK_EMPS
  const TF={width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${T.border}`,
    fontSize:13,outline:'none',color:T.text,background:'#fff',boxSizing:'border-box',
    fontFamily:'inherit',appearance:'none',cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}

  return(
    <div style={{...card_s(),overflow:'hidden',flexShrink:0,width:'100%',maxWidth:440}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'16px 20px',borderBottom:`1px solid ${T.border}`,background:'#fafafa'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <BarChart2 size={18} color={T.muted}/>
          <span style={{fontWeight:700,fontSize:15,color:T.text,letterSpacing:'-0.3px'}}>Salary Statement</span>
        </div>
        <button onClick={()=>window.print()} style={{background:'#fff',color:T.text,border:`1px solid ${T.border}`,
          borderRadius:6,padding:'6px 14px',fontWeight:600,fontSize:12,cursor:'pointer',
          display:'flex',alignItems:'center',gap:6,boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
          <Printer size={13}/> Print
        </button>
      </div>

      {/* Body */}
      <div style={{padding:'20px'}}>
        {/* Employee */}
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:12,fontWeight:600,color:T.text,marginBottom:6}}>
            Employee Name
          </label>
          <select value={selEmp||''} onChange={e=>{setSelEmp(e.target.value);setErr('')}} style={TF}>
            <option value="">Select Employee...</option>
            {empList.map(e=>(
              <option key={e.id||e.code} value={e.id||e.code}>
                {e.name||`${e.firstName} ${e.lastName}`} ({e.code||e.user?.loginId||''})
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:12,fontWeight:600,color:T.text,marginBottom:6}}>
            Year
          </label>
          <select value={selYear||''} onChange={e=>{setSelYear(Number(e.target.value)||null);setErr('')}} style={TF}>
            <option value="">Select Year...</option>
            {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Validation error */}
        {err&&<p style={{margin:'0 0 12px',fontSize:12,color:R,fontWeight:500,display:'flex',alignItems:'center',gap:4}}>
          <AlertCircle size={14}/> {err}
        </p>}

        {/* Generate */}
        <button onClick={handleGen} disabled={loading} style={{
          width:'100%',padding:'10px',borderRadius:8,border:'none',background:loading?T.muted:A,
          color:'#fff',fontWeight:600,fontSize:13,cursor:loading?'not-allowed':'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:10,
          transition:'background .2s',boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
          {loading?<Loader2 size={15} className="animate-spin"/>:<FileText size={15}/>}
          {loading?'Generating...':'Generate Statement'}
        </button>

        {/* Reset */}
        <button onClick={onReset} style={{
          width:'100%',padding:'9px',borderRadius:8,border:`1px solid ${T.border}`,
          background:'#fff',color:T.text,fontWeight:600,fontSize:13,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
          <RotateCcw size={14}/> Reset
        </button>

        {/* Summary chips */}
        {generated&&selEmp&&selYear&&(()=>{
          const emp=empList.find(e=>(e.id||e.code)===selEmp)||empList[0]
          const empName=emp?.name||`${emp?.firstName} ${emp?.lastName}`||'—'
          const dept=emp?.dept||emp?.department||'—'
          return(
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:16}}>
              {[[<Calendar size={12}/>,`${selYear}`],[<User size={12}/>,empName],[<Briefcase size={12}/>,dept]].map(([icon,txt],i)=>(
                <span key={i} style={{background:'#f1f5f9',color:T.muted,fontSize:11,fontWeight:600,
                  padding:'4px 10px',borderRadius:6,display:'flex',alignItems:'center',gap:6,border:`1px solid ${T.border}`}}>
                  {icon} {txt}
                </span>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

/* ── PRINT PREVIEW ──────────────────────────────── */
function PrintPreview({emp,year}){
  const TH={padding:'9px 14px',textAlign:'left',color:T.muted,fontWeight:600,fontSize:11,textTransform:'uppercase',letterSpacing:'0.05em'}
  const TD={padding:'10px 14px',fontSize:13,borderBottom:`1px solid ${T.border}`,color:T.text}
  const TDr={...TD,color:R}
  const empName=emp?.name||`${emp?.firstName||''} ${emp?.lastName||''}`.trim()||'—'
  const dept=emp?.dept||emp?.department||'Engineering'
  const desig=emp?.designation||'Senior Developer'
  const join=emp?.join||'20 June 2022'
  const today=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})

  return(
    <div className="print-preview" style={{...card_s(),border:`1px solid ${T.border}`,overflow:'hidden'}}>
      {/* ── Document Header ── */}
      <div style={{padding:'24px 28px',borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
          <div style={{width:44,height:44,background:A,borderRadius:8,display:'flex',
            alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'#fff'}}>E</div>
          <div>
            <p style={{margin:0,fontWeight:700,fontSize:16,color:T.text}}>EmPay HRMS</p>
            <p style={{margin:0,fontSize:12,color:T.muted}}>Human Resource Management System</p>
          </div>
        </div>
        <p style={{margin:'0 0 16px',fontSize:18,fontWeight:700,color:T.text,letterSpacing:'-0.4px'}}>
          Salary Statement Report
        </p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}>
          <div><span style={{color:T.muted,marginRight:6}}>Employee Name :</span> <strong style={{color:T.text}}>{empName}</strong></div>
          <div><span style={{color:T.muted,marginRight:6}}>Designation :</span> <strong style={{color:T.text}}>{desig}</strong></div>
          <div><span style={{color:T.muted,marginRight:6}}>Department :</span> <span style={{color:T.text}}>{dept}</span></div>
          <div><span style={{color:T.muted,marginRight:6}}>Salary Year :</span> <strong style={{color:T.text}}>{year}</strong></div>
          <div><span style={{color:T.muted,marginRight:6}}>Date of Joining :</span> <span style={{color:T.text}}>{join}</span></div>
          <div><span style={{color:T.muted,marginRight:6}}>Salary Effective From :</span> <span style={{color:T.text}}>01 July {year}</span></div>
        </div>
      </div>

      <div style={{padding:'20px 28px',display:'flex',flexDirection:'column',gap:20}}>
        {/* ── Main salary table ── */}
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f8fafc',borderBottom:`1px solid ${T.border}`}}>
              {['Salary Components','Monthly Amount','Yearly Amount'].map(h=>(
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Earnings header */}
            <tr style={{background:'#f8fafc'}}>
              <td colSpan={3} style={{padding:'10px 14px',fontWeight:600,fontSize:12,color:T.text,
                borderBottom:`1px solid ${T.border}`}}>Earnings</td>
            </tr>
            {EARNINGS.map(([name,mo])=>(
              <tr key={name}>
                <td style={TD}>{name}</td>
                <td style={TD}>{inr(mo)}</td>
                <td style={TD}>{inr(mo*12)}</td>
              </tr>
            ))}
            {/* Gross row */}
            <tr>
              <td style={{...TD,fontWeight:600,color:T.text,borderBottom:`1px solid ${T.border}`}}>Gross Earnings</td>
              <td style={{...TD,fontWeight:600,color:T.text,borderBottom:`1px solid ${T.border}`}}>{inr(GROSS)}</td>
              <td style={{...TD,fontWeight:600,color:T.text,borderBottom:`1px solid ${T.border}`}}>{inr(GROSS*12)}</td>
            </tr>

            {/* Deductions header */}
            <tr style={{background:'#f8fafc'}}>
              <td colSpan={3} style={{padding:'10px 14px',fontWeight:600,fontSize:12,color:R,
                borderBottom:`1px solid ${T.border}`}}>Deductions</td>
            </tr>
            {DEDUCTIONS.map(([name,mo])=>(
              <tr key={name}>
                <td style={TD}>{name}</td>
                <td style={mo<0?TDr:TD}>{mo<=0?inr(mo):inr(mo)}</td>
                <td style={mo<0?TDr:TD}>{mo<=0?inr(mo*12):inr(mo*12)}</td>
              </tr>
            ))}
            {/* Total deductions row */}
            <tr>
              <td style={{...TD,fontWeight:600,color:R}}>Total Deductions</td>
              <td style={{...TD,fontWeight:600,color:R}}>{inr(TOTAL_DED)}</td>
              <td style={{...TD,fontWeight:600,color:R}}>{inr(TOTAL_DED*12)}</td>
            </tr>

            {/* Net salary */}
            <tr style={{background:A}}>
              <td style={{padding:'12px 14px',fontWeight:700,fontSize:14,color:'#fff',borderRadius:'0 0 0 6px'}}>Net Salary</td>
              <td style={{padding:'12px 14px',fontWeight:700,fontSize:14,color:'#fff'}}>{inr(NET)}</td>
              <td style={{padding:'12px 14px',fontWeight:700,fontSize:14,color:'#fff',borderRadius:'0 0 6px 0'}}>{inr(NET*12)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Monthly breakdown ── */}
        <div>
          <p style={{margin:'0 0 12px',fontWeight:700,fontSize:15,color:T.text,letterSpacing:'-0.3px'}}>
            Monthly Breakdown — {year}
          </p>
          <div style={{borderRadius:8,border:`1px solid ${T.border}`,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:'#f8fafc',borderBottom:`1px solid ${T.border}`}}>
                  {['Month','Working Days','Paid Leaves','Gross','Deductions','Net'].map(h=>(
                    <th key={h} style={{padding:'10px',textAlign:'left',fontWeight:600,color:T.muted,fontSize:11,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHLY_DATA.map((r,i)=>(
                  <tr key={r.month} style={{borderBottom:`1px solid ${T.border}`}}>
                    <td style={{padding:'8px 10px',fontWeight:500,color:T.text}}>{r.month}</td>
                    <td style={{padding:'8px 10px',color:T.muted}}>{r.working}</td>
                    <td style={{padding:'8px 10px',color:T.muted}}>{r.leaves}</td>
                    <td style={{padding:'8px 10px',color:T.text}}>{inr(r.gross)}</td>
                    <td style={{padding:'8px 10px',color:R}}>-{inr(r.ded)}</td>
                    <td style={{padding:'8px 10px',fontWeight:600,color:T.text}}>{inr(r.net)}</td>
                  </tr>
                ))}
                {/* Yearly total */}
                <tr style={{background:'#f8fafc',fontWeight:600}}>
                  <td style={{padding:'12px 10px',color:T.text}}>Yearly Total</td>
                  <td style={{padding:'12px 10px',color:T.text}}>{YR_TOTAL.working}</td>
                  <td style={{padding:'12px 10px',color:T.text}}>{YR_TOTAL.leaves}</td>
                  <td style={{padding:'12px 10px',color:T.text}}>{inr(YR_TOTAL.gross)}</td>
                  <td style={{padding:'12px 10px',color:R}}>-{inr(YR_TOTAL.ded)}</td>
                  <td style={{padding:'12px 10px',color:T.text}}>{inr(YR_TOTAL.net)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{borderTop:'1px solid #e5e7eb',paddingTop:14,textAlign:'center'}}>
          <p style={{margin:0,fontSize:11,color:'#9ca3af'}}>
            Generated by EmPay HRMS &nbsp;|&nbsp; Report Date: {today}
          </p>
          <p style={{margin:'4px 0 0',fontSize:11,color:'#9ca3af'}}>
            This is a system-generated report and does not require a signature.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── SHIMMER SKELETON (report placeholder) ──────── */
function ReportSkeleton(){
  return(
    <div style={{...card_s(),padding:24,display:'flex',flexDirection:'column',gap:10}}>
      <Shimmer h={28} w="60%"/>
      <Shimmer h={14} w="40%" mb={20}/>
      {Array.from({length:10}).map((_,i)=><Shimmer key={i} h={36}/>)}
    </div>
  )
}

/* ── PRINT CSS ──────────────────────────────────── */
const PRINT_CSS=`
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@media print {
  body * { visibility: hidden !important; }
  .print-preview, .print-preview * { visibility: visible !important; }
  .print-preview { position: fixed; inset: 0; width: 100%; box-shadow: none !important; border: none !important; }
  @page { margin: 15mm; }
}
`

/* ── MAIN REPORTS PAGE ──────────────────────────── */
export default function Reports(){
  const [selEmp,setSelEmp]=useState(null)
  const [selYear,setSelYear]=useState(null)
  const [generated,setGenerated]=useState(false)
  const [loading,setLoading]=useState(false)
  const [employees,setEmployees]=useState([])

  // fetch real employees
  useEffect(()=>{
    api.get('/employees').then(r=>{
      const list=(r.data.employees||[]).map(e=>({
        id:e.id,
        name:`${e.firstName} ${e.lastName}`,
        code:e.user?.loginId||e.loginId||'',
        dept:e.department||'—',
        designation:e.jobTitle||'—',
        join:e.dateOfJoining?new Date(e.dateOfJoining).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}):'—'
      }))
      if(list.length>0) setEmployees(list)
    }).catch(()=>{})
  },[])

  const empList=employees.length>0?employees:MOCK_EMPS

  const handleGenerate=()=>{
    setLoading(true); setGenerated(false)
    setTimeout(()=>{ setLoading(false); setGenerated(true) },600)
  }
  const handleReset=()=>{ setSelEmp(null); setSelYear(null); setGenerated(false); setLoading(false) }

  const selEmpObj=empList.find(e=>(e.id||e.code)===selEmp)||null

  return(
    <div style={{display:'flex',minHeight:'100vh',background:T.bg,fontFamily:'inherit',colorScheme:'light'}}>
      <style>{PRINT_CSS}</style>
      <Sidebar/>
      <div style={{flex:1,marginLeft:64,padding:'28px 28px 48px',minWidth:0}}>
        {/* Title */}
        <div style={{marginBottom:22}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:700,color:T.text,letterSpacing:'-0.4px'}}>Reports</h1>
          <p style={{margin:'6px 0 0',fontSize:12,color:T.muted,display:'flex',alignItems:'center',gap:6}}>
            <span style={{background:'#fff',border:`1px solid ${T.border}`,color:T.muted,padding:'3px 10px',borderRadius:6,fontWeight:600,fontSize:11,display:'flex',alignItems:'center',gap:4}}><Lock size={11}/> Admin &amp; Payroll Officer only</span>
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
          {/* Left: form */}
          <FormCard
            employees={empList}
            onGenerate={handleGenerate}
            onReset={handleReset}
            loading={loading}
            generated={generated}
            selEmp={selEmp} setSelEmp={e=>{setSelEmp(e);if(generated)setTimeout(()=>{setLoading(false);setGenerated(true)},400)}}
            selYear={selYear} setSelYear={y=>{setSelYear(y);if(generated)setTimeout(()=>{setLoading(false);setGenerated(true)},400)}}
          />

          {/* Right: preview */}
          <div style={{flex:1,minWidth:320}}>
            {loading && <ReportSkeleton/>}
            {!loading && !generated && <div style={{...card_s(),overflow:'hidden'}}><EmptyState/></div>}
            {!loading && generated && selEmpObj && selYear && (
              <PrintPreview emp={selEmpObj} year={selYear}/>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

