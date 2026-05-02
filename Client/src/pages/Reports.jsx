import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { useTheme } from '@/lib/theme'
import api from '@/lib/api'

/* ── accent colors ─── */
const A='#4f46e5', TC='#00b4d8', O='#f97316', R='#ef4444'

/* ── theme-aware tokens ─── */
function useT() {
  const { colors } = useTheme()
  return { bg:colors.bg, card:colors.card, text:colors.text, muted:colors.muted, border:colors.border, shadow:colors.shadow }
}
const card_s = (t) => ({background:t.card,borderRadius:14,boxShadow:t.shadow})
const inr=v=>'₹'+Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const YEARS=[2025,2024,2023,2022]
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December']


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
      padding:'60px 20px',gap:14,textAlign:'center'}}>
      <div style={{fontSize:52}}>📊</div>
      <p style={{margin:0,fontWeight:700,fontSize:16,color:'#374151'}}>No Report Generated Yet</p>
      <p style={{margin:0,fontSize:13,color:'#9ca3af',maxWidth:280,lineHeight:1.6}}>
        Select an employee and year to generate the Salary Statement Report
      </p>
    </div>
  )
}

/* ── Form Card ─── */
function FormCard({employees,onGenerate,onReset,loading,generated,selEmp,setSelEmp,selYear,setSelYear}){
  const t = useT()
  const card = {background:t.card,borderRadius:14,boxShadow:t.shadow}
  const [err,setErr]=useState('')
  const handleGen=()=>{
    if(!selEmp||!selYear){setErr('Please select both an employee and a year');return}
    setErr(''); onGenerate()
  }
  const empList=employees
  const TF={width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',
    fontSize:13,outline:'none',color:'#374151',background:'#fff',boxSizing:'border-box',
    fontFamily:'inherit',appearance:'none',cursor:'pointer'}

  return(
    <div style={{...card,overflow:'hidden',flexShrink:0,width:'100%',maxWidth:440}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'16px 20px',borderBottom:'1px solid #f3f4f6'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18}}>📊</span>
          <span style={{fontWeight:800,fontSize:15,color:'#111827'}}>Salary Statement Report</span>
        </div>
        <button onClick={()=>window.print()} style={{background:A,color:'#fff',border:'none',
          borderRadius:8,padding:'7px 16px',fontWeight:700,fontSize:12,cursor:'pointer',
          display:'flex',alignItems:'center',gap:6}}>
          🖨 Print
        </button>
      </div>

      {/* Body */}
      <div style={{padding:'20px'}}>
        {/* Employee */}
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>
            Employee Name :
          </label>
          <select value={selEmp||''} onChange={e=>{setSelEmp(e.target.value);setErr('')}} style={TF}>
            <option value="">Select Employee</option>
            {empList.map(e=>(
              <option key={e.id||e.code} value={e.id||e.code}>
                {e.name||`${e.firstName} ${e.lastName}`} ({e.code||e.user?.loginId||''})
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:6}}>
            Year :
          </label>
          <select value={selYear||''} onChange={e=>{setSelYear(Number(e.target.value)||null);setErr('')}} style={TF}>
            <option value="">Select Year</option>
            {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Validation error */}
        {err&&<p style={{margin:'0 0 12px',fontSize:12,color:R,fontWeight:600}}>⚠ {err}</p>}

        {/* Generate */}
        <button onClick={handleGen} disabled={loading} style={{
          width:'100%',padding:'11px',borderRadius:9,border:'none',background:loading?'#a5b4fc':A,
          color:'#fff',fontWeight:800,fontSize:13,cursor:loading?'not-allowed':'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:10,
          transition:'background .2s'}}>
          {loading?'⏳ Generating…':'📄 Generate Salary Statement'}
        </button>

        {/* Reset */}
        <button onClick={onReset} style={{
          width:'100%',padding:'9px',borderRadius:9,border:`1.5px solid #e5e7eb`,
          background:'transparent',color:'#6b7280',fontWeight:700,fontSize:12,cursor:'pointer'}}>
          ↺ Reset
        </button>

        {/* Summary chips */}
        {generated&&selEmp&&selYear&&(()=>{
          const emp=empList.find(e=>(e.id||e.code)===selEmp)||empList[0]
          const empName=emp?.name||`${emp?.firstName} ${emp?.lastName}`||'—'
          const dept=emp?.dept||emp?.department||'—'
          return(
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:16}}>
              {[['📅',`Year: ${selYear}`],['👤',empName],['💼',dept]].map(([icon,txt])=>(
                <span key={txt} style={{background:'#eef2ff',color:A,fontSize:11,fontWeight:700,
                  padding:'5px 12px',borderRadius:999,display:'flex',alignItems:'center',gap:4}}>
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
function PrintPreview({emp, year, report}){
  const t = useT()
  const card = {background:t.card,borderRadius:14,boxShadow:t.shadow}
  const TH={padding:'9px 14px',textAlign:'left',color:'#fff',fontWeight:700,fontSize:12}
  const TD={padding:'8px 14px',fontSize:12,borderBottom:'1px solid #f3f4f6'}
  const TDr={...TD,color:R}
  const empName=emp?.name||`${emp?.firstName||''} ${emp?.lastName||''}`.trim()||'—'
  const dept=emp?.dept||emp?.department||'—'
  const desig=emp?.designation||'—'
  const join=emp?.join||'—'
  const today=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})

  const monthly    = report?.monthly    || []
  const yearly     = report?.yearly     || {totalWorkedDays:0,totalGross:0,totalDeductions:0,totalNet:0}
  const components = report?.components || []
  const deductions = report?.deductions || []
  const noData = !report || monthly.every(m=>m.grossAmount===0)

  return(
    <div className="print-preview" style={{...card,border:'1.5px solid #e0e7ff',overflow:'hidden'}}>
      {/* ── Document Header ── */}
      <div style={{padding:'24px 28px',borderBottom:'2px solid #e0e7ff'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
          <div style={{width:48,height:48,background:'#eef2ff',borderRadius:10,display:'flex',
            alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:A}}>E</div>
          <div>
            <p style={{margin:0,fontWeight:800,fontSize:18,color:A}}>EmPay HRMS</p>
            <p style={{margin:0,fontSize:11,color:'#9ca3af'}}>Human Resource Management System</p>
          </div>
        </div>
        <p style={{margin:'0 0 16px',fontSize:20,fontWeight:800,color:TC,letterSpacing:'-0.01em'}}>
          Salary Statement Report
        </p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:12}}>
          <div><span style={{color:'#9ca3af'}}>Employee Name :</span> <strong>{empName}</strong></div>
          <div><span style={{color:'#9ca3af'}}>Designation :</span> <strong>{desig}</strong></div>
          <div><span style={{color:'#9ca3af'}}>Department :</span> <span>{dept}</span></div>
          <div><span style={{color:'#9ca3af'}}>Salary Year :</span> <strong>{year}</strong></div>
          <div><span style={{color:'#9ca3af'}}>Date of Joining :</span> <span style={{color:O,fontWeight:600}}>{join}</span></div>
          <div><span style={{color:'#9ca3af'}}>Report Generated :</span> <span style={{color:O,fontWeight:600}}>{today}</span></div>
        </div>
      </div>

      <div style={{padding:'20px 28px',display:'flex',flexDirection:'column',gap:20}}>
        {noData ? (
          <div style={{textAlign:'center',padding:'40px 20px',color:'#9ca3af',fontSize:13}}>
            <div style={{fontSize:40,marginBottom:12}}>💰</div>
            <p style={{margin:0,fontWeight:700,color:'#374151'}}>No payslips found for {year}</p>
            <p style={{margin:'6px 0 0',fontSize:12}}>Run payroll for this employee first to generate the statement.</p>
          </div>
        ) : (
          <>
            {/* ── Earnings & Deductions summary ── */}
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:TC}}>
                  {['Salary Components','Monthly Avg','Yearly Amount'].map(h=>(
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{background:'#f8f9ff',borderLeft:`4px solid ${A}`}}>
                  <td colSpan={3} style={{padding:'7px 14px',fontWeight:800,fontSize:11,color:A,
                    textTransform:'uppercase',letterSpacing:'0.06em'}}>Earnings</td>
                </tr>
                {components.map(c=>(
                  <tr key={c.name} style={{borderBottom:'1px solid #f3f4f6'}}>
                    <td style={TD}>{c.name}</td>
                    <td style={TD}>{inr((c.yearlyAmount||0)/12)}</td>
                    <td style={TD}>{inr(c.yearlyAmount||0)}</td>
                  </tr>
                ))}
                <tr style={{background:'#eef2ff'}}>
                  <td style={{...TD,fontWeight:800,color:A}}>Gross Earnings</td>
                  <td style={{...TD,fontWeight:800,color:A}}>{inr(yearly.totalGross/12)}</td>
                  <td style={{...TD,fontWeight:800,color:A}}>{inr(yearly.totalGross)}</td>
                </tr>
                <tr style={{background:'#fff5f5',borderLeft:`4px solid ${R}`}}>
                  <td colSpan={3} style={{padding:'7px 14px',fontWeight:800,fontSize:11,color:R,
                    textTransform:'uppercase',letterSpacing:'0.06em'}}>Deductions</td>
                </tr>
                {deductions.map(d=>(
                  <tr key={d.name} style={{borderBottom:'1px solid #f3f4f6'}}>
                    <td style={TD}>{d.name}</td>
                    <td style={TDr}>{inr((d.yearlyAmount||0)/12)}</td>
                    <td style={TDr}>{inr(d.yearlyAmount||0)}</td>
                  </tr>
                ))}
                <tr style={{background:'#fff1f2'}}>
                  <td style={{...TD,fontWeight:800,color:R}}>Total Deductions</td>
                  <td style={{...TD,fontWeight:800,color:R}}>{inr(yearly.totalDeductions/12)}</td>
                  <td style={{...TD,fontWeight:800,color:R}}>{inr(yearly.totalDeductions)}</td>
                </tr>
                <tr style={{background:TC}}>
                  <td style={{padding:'12px 14px',fontWeight:800,fontSize:14,color:'#fff'}}>Net Salary</td>
                  <td style={{padding:'12px 14px',fontWeight:800,fontSize:14,color:'#fff'}}>{inr(yearly.totalNet/12)}</td>
                  <td style={{padding:'12px 14px',fontWeight:800,fontSize:14,color:'#fff'}}>{inr(yearly.totalNet)}</td>
                </tr>
              </tbody>
            </table>

            {/* ── Monthly breakdown ── */}
            <div>
              <p style={{margin:'0 0 12px',fontWeight:800,fontSize:14,color:A}}>
                Monthly Breakdown — {year}
              </p>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                <thead>
                  <tr style={{background:'#eef2ff'}}>
                    {['Month','Working Days','Paid Leaves','Gross','Deductions','Net'].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontWeight:700,color:A,
                        borderBottom:'2px solid #e0e7ff'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((r,i)=>(
                    <tr key={r.month} style={{background:i%2===0?'#fafbff':'#fff',borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:'7px 10px',fontWeight:600}}>{r.month}</td>
                      <td style={{padding:'7px 10px'}}>{r.workedDays??0}</td>
                      <td style={{padding:'7px 10px'}}>{r.paidLeaveDays??0}</td>
                      <td style={{padding:'7px 10px'}}>{inr(r.grossAmount??0)}</td>
                      <td style={{padding:'7px 10px',color:R}}>-{inr(r.totalDeductions??0)}</td>
                      <td style={{padding:'7px 10px',fontWeight:600,color:A}}>{inr(r.netAmount??0)}</td>
                    </tr>
                  ))}
                  <tr style={{background:'#eef2ff',fontWeight:800}}>
                    <td style={{padding:'9px 10px',color:A}}>Yearly Total</td>
                    <td style={{padding:'9px 10px',color:A}}>{yearly.totalWorkedDays}</td>
                    <td style={{padding:'9px 10px',color:A}}>—</td>
                    <td style={{padding:'9px 10px',color:A}}>{inr(yearly.totalGross)}</td>
                    <td style={{padding:'9px 10px',color:R}}>-{inr(yearly.totalDeductions)}</td>
                    <td style={{padding:'9px 10px',color:A}}>{inr(yearly.totalNet)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

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
  const t = useT()
  const card = {background:t.card,borderRadius:14,boxShadow:t.shadow}
  return(
    <div style={{...card,padding:24,display:'flex',flexDirection:'column',gap:10}}>
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
  const t = useT()
  const card = {background:t.card,borderRadius:14,boxShadow:t.shadow}
  const [selEmp,setSelEmp]=useState(null)
  const [selYear,setSelYear]=useState(null)
  const [generated,setGenerated]=useState(false)
  const [loading,setLoading]=useState(false)
  const [employees,setEmployees]=useState([])
  const [report,setReport]=useState(null)
  const [reportError,setReportError]=useState(null)

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

  const handleGenerate=()=>{
    if(!selEmp || !selYear) return
    setLoading(true); setGenerated(false); setReport(null); setReportError(null)
    api.get(`/reports/salary-statement?employeeId=${selEmp}&year=${selYear}`)
      .then(r => {
        setReport(r.data?.data || null)
        setGenerated(true)
      })
      .catch(err => {
        setReportError(err?.response?.data?.message || 'Failed to generate report')
        setGenerated(true) // still show panel with error
      })
      .finally(() => setLoading(false))
  }
  const handleReset=()=>{ setSelEmp(null); setSelYear(null); setGenerated(false); setLoading(false); setReport(null); setReportError(null) }

  const selEmpObj=employees.find(e=>(e.id||e.code)===selEmp)||null

  return(
    <div style={{display:'flex',minHeight:'100vh',background:t.bg,fontFamily:'inherit'}}>
      <style>{PRINT_CSS}</style>
      <Sidebar/>
      <div style={{flex:1,marginLeft:64,padding:'28px 28px 48px',minWidth:0}}>
        {/* Title */}
        <div style={{marginBottom:22}}>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:t.text}}>Reports</h1>
          <p style={{margin:'4px 0 0',fontSize:12,color:'#9ca3af',display:'flex',alignItems:'center',gap:6}}>
            <span style={{background:'#fef3c7',color:'#d97706',padding:'2px 8px',borderRadius:999,fontWeight:700,fontSize:11}}>🔒 Admin &amp; Payroll Officer only</span>
          </p>
        </div>

        {/* Two-column layout */}
        <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
          {/* Left: form */}
          <FormCard
            employees={employees}
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
            {!loading && !generated && <div style={{...card,overflow:'hidden'}}><EmptyState/></div>}
            {!loading && generated && reportError && (
              <div style={{...card,padding:'32px',textAlign:'center',color:R}}>
                <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
                <p style={{margin:0,fontWeight:700}}>{reportError}</p>
              </div>
            )}
            {!loading && generated && !reportError && selEmpObj && selYear && (
              <PrintPreview emp={selEmpObj} year={selYear} report={report}/>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

