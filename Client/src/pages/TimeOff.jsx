import { useState, useMemo } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { useTheme } from '@/lib/theme'

/* ── accent colors ── */
const A='#4f46e5', TC='#00b4d8', PU='#8b5cf6', AM='#f59e0b'
const GR='#22c55e', RD='#ef4444'

/* ── theme-aware tokens ── */
function useT() {
  const { colors } = useTheme()
  return { bg:colors.bg, card:colors.card, text:colors.text, muted:colors.muted, border:colors.border, shadow:colors.shadow, hover:colors.hover }
}
const card_s = (t) => ({background:t.card,borderRadius:14,boxShadow:t.shadow})

/* ── type meta ── */
const TYPE={
  'Paid Time Off': {color:TC,bg:'#e0f7fa',icon:'🌴'},
  'Sick Leave':    {color:PU,bg:'#f3e8ff',icon:'🏥'},
  'Unpaid Leave':  {color:AM,bg:'#fef3c7',icon:'📋'},
}

/* ── status meta ── */
const STAT={
  Approved:{bg:'#dcfce7',color:'#16a34a'},
  Pending: {bg:'#fef3c7',color:'#d97706'},
  Rejected:{bg:'#fee2e2',color:'#dc2626'},
}

/* ── mock data ── */
const MOCK_LEAVES=[
  {id:1,emp:'Arjun Mehta',  empId:'OIARM E20230001',type:'Paid Time Off',start:'28 Oct 2025',end:'28 Oct 2025',days:1,note:'Personal work',  status:'Approved'},
  {id:2,emp:'Priya Sharma', empId:'OIPRSH20220042', type:'Sick Leave',   start:'15 Nov 2025',end:'17 Nov 2025',days:3,note:'Fever and rest', status:'Pending'},
  {id:3,emp:'Rohit Kulkarni',empId:'OIROKU20210018',type:'Unpaid Leave', start:'05 Dec 2025',end:'06 Dec 2025',days:2,note:'Family function',status:'Rejected'},
  {id:4,emp:'Sneha Patil',  empId:'OISNPA20230055', type:'Paid Time Off',start:'10 Dec 2025',end:'12 Dec 2025',days:3,note:'Vacation',       status:'Rejected'},
  {id:5,emp:'Vikram Desai', empId:'OIVIDE20220031', type:'Sick Leave',   start:'20 Dec 2025',end:'20 Dec 2025',days:1,note:'Doctor visit',   status:'Approved'},
]
const MOCK_ALLOC=[
  {id:1,emp:'Arjun Mehta',  type:'Paid Time Off',period:'Oct 13 – No Limit',allocated:24,remaining:23},
  {id:2,emp:'Priya Sharma', type:'Sick Leave',   period:'Oct 13 – No Limit',allocated:7, remaining:4},
  {id:3,emp:'Rohit Kulkarni',type:'Paid Time Off',period:'Oct 13 – No Limit',allocated:24,remaining:24},
]

/* ── helpers ── */
const fmtDate=d=>d
const workingDays=(a,b)=>{
  if(!a||!b) return 0
  const s=new Date(a),e=new Date(b); let n=0
  for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){const w=d.getDay();if(w!==0&&w!==6)n++}
  return n
}

/* ── tiny shared ── */
const Badge=({s})=>{ const m=STAT[s]||{bg:'#f3f4f6',color:'#374151'}; return <span style={{...m,padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:700}}>{s}</span>}
const TypePill=({t})=>{ const m=TYPE[t]||{}; return <span style={{background:m.bg,color:m.color,padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:700}}>{m.icon} {t}</span>}
const Btn=(p)=><button {...p} style={{padding:'6px 16px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:700,fontSize:12,...p.style}}>{p.children}</button>

/* ── Balance Cards ── */
function BalanceCards(){
  const t = useT()
  const card = {background:t.card,borderRadius:14,boxShadow:t.shadow}
  const cards=[
    {type:'Paid Time Off', val:'24',  sub:'Days Available',color:TC},
    {type:'Sick Leave',    val:'07',  sub:'Days Available',color:PU},
    {type:'Unpaid Leave',  val:'∞',   sub:'No Limit',      color:AM},
  ]
  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:22}}>
      {cards.map(c=>(
        <div key={c.type} style={{...card,padding:'18px 20px',borderLeft:`4px solid ${c.color}`,display:'flex',alignItems:'center',gap:16}}>
          <div style={{fontSize:28}}>{TYPE[c.type].icon}</div>
          <div>
            <p style={{margin:0,fontSize:12,color:'#6b7280',fontWeight:600}}>{c.type}</p>
            <p style={{margin:'4px 0 2px',fontSize:28,fontWeight:800,color:c.color,lineHeight:1}}>{c.val}</p>
            <p style={{margin:0,fontSize:11,color:'#9ca3af'}}>{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Leave table (shared) ── */
function LeaveTable({rows,isAdmin,canApprove,onView,onApprove,onReject,rejectId,setRejectId,rejectReason,setRejectReason,onConfirmReject}){
  const t = useT()
  const card = {background:t.card,borderRadius:14,boxShadow:t.shadow}
  const TH={padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:t.muted,
    borderBottom:`1px solid ${t.border}`,textTransform:'uppercase',letterSpacing:'0.05em'}
  const TD={padding:'11px 14px',fontSize:13,borderBottom:`1px solid ${t.border}`}
  return(
    <div style={{...card,padding:0,overflow:'hidden'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr style={{background:'#f9fafb'}}>
          {['#',...(isAdmin?['Employee']:[]),'Leave Type','Start','End','Days','Note','Status','Actions'].map(h=>(
            <th key={h} style={TH}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.length===0&&(
            <tr><td colSpan={9} style={{textAlign:'center',padding:32,color:'#9ca3af',fontSize:13}}>No records found</td></tr>
          )}
          {rows.map((r,i)=>(
            <>
              <tr key={r.id} style={{borderBottom:'1px solid #f3f4f6'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f8faff'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <td style={{...TD,color:'#9ca3af'}}>{i+1}</td>
                {isAdmin&&(
                  <td style={TD}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:A,color:'#fff',display:'inline-flex',
                      alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,marginRight:8,verticalAlign:'middle'}}>
                      {r.emp[0]}
                    </div>
                    <span style={{fontWeight:600}}>{r.emp}</span>
                    <div style={{fontSize:10,color:'#9ca3af',marginTop:2}}>{r.empId}</div>
                  </td>
                )}
                <td style={TD}><TypePill t={r.type}/></td>
                <td style={{...TD,color:'#374151'}}>{r.start}</td>
                <td style={{...TD,color:'#374151'}}>{r.end}</td>
                <td style={{...TD,fontWeight:600}}>{r.days}d</td>
                <td style={{...TD,color:'#6b7280',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.note}</td>
                <td style={TD}><Badge s={r.status}/></td>
                <td style={{...TD,whiteSpace:'nowrap'}}>
                  <button onClick={()=>onView(r)} style={{background:'none',border:`1px solid #e5e7eb`,borderRadius:7,
                    padding:'4px 10px',fontSize:12,cursor:'pointer',marginRight:4}}>👁 View</button>
                  {canApprove&&r.status==='Pending'&&(
                    <>
                      <button onClick={()=>onApprove(r.id)} style={{background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0',
                        borderRadius:7,padding:'4px 10px',fontSize:12,cursor:'pointer',marginRight:4}}>✅ Approve</button>
                      <button onClick={()=>setRejectId(r.id)} style={{background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',
                        borderRadius:7,padding:'4px 10px',fontSize:12,cursor:'pointer'}}>❌ Reject</button>
                    </>
                  )}
                </td>
              </tr>
              {rejectId===r.id&&(
                <tr key={`rej-${r.id}`} style={{background:'#fff5f5'}}>
                  <td colSpan={9} style={{padding:'10px 16px'}}>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
                        placeholder="Enter rejection reason…"
                        style={{flex:1,padding:'7px 12px',borderRadius:8,border:'1.5px solid #fca5a5',
                          fontSize:12,outline:'none',background:'#fff'}}/>
                      <button onClick={()=>onConfirmReject(r.id)} style={{background:RD,color:'#fff',border:'none',
                        borderRadius:8,padding:'7px 16px',fontWeight:700,fontSize:12,cursor:'pointer'}}>Confirm Reject</button>
                      <button onClick={()=>{setRejectId(null);setRejectReason('')}} style={{background:'#f3f4f6',border:'none',
                        borderRadius:8,padding:'7px 14px',fontWeight:600,fontSize:12,cursor:'pointer'}}>Cancel</button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── EMPLOYEE VIEW ── */
function EmployeeView({onNew,onView,leaves,setLeaves}){
  const [filter,setFilter]=useState('All')
  const filters=['All','Pending','Approved','Rejected']
  const myLeaves=leaves.filter(r=>r.emp==='Arjun Mehta') // logged-in employee
  const shown=filter==='All'?myLeaves:myLeaves.filter(r=>r.status===filter)
  const [rejectId,setRejectId]=useState(null)
  const [rejectReason,setRejectReason]=useState('')
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:'#111827'}}>Time Off</h1>
          <p style={{margin:'4px 0 0',fontSize:13,color:'#9ca3af'}}>Manage your leave requests and balances</p>
        </div>
        <Btn onClick={onNew} style={{background:A,color:'#fff'}}>+ New Request</Btn>
      </div>
      <div style={{height:20}}/>
      <BalanceCards/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontWeight:700,fontSize:15}}>My Leave Requests</span>
          <span style={{background:'#eef2ff',color:A,borderRadius:999,padding:'2px 9px',fontSize:12,fontWeight:700}}>{myLeaves.length}</span>
        </div>
        <div style={{display:'flex',gap:6}}>
          {filters.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'5px 14px',borderRadius:999,border:'none',
              cursor:'pointer',fontWeight:600,fontSize:11,background:filter===f?A:'#f3f4f6',color:filter===f?'#fff':'#374151'}}>{f}</button>
          ))}
        </div>
      </div>
      <LeaveTable rows={shown} isAdmin={false} canApprove={false} onView={onView}
        onApprove={()=>{}} onReject={()=>{}} rejectId={rejectId} setRejectId={setRejectId}
        rejectReason={rejectReason} setRejectReason={setRejectReason} onConfirmReject={()=>{}}/>
    </div>
  )
}

/* ── ADMIN VIEW ─────────────────────────────────── */
function AdminView({onNew,onNewAlloc,onView,leaves,setLeaves,canApprove}){
  const t = useT()
  const card = {background:t.card,borderRadius:14,boxShadow:t.shadow}
  const [tab,setTab]=useState('timeoff')
  const [filter,setFilter]=useState('All')
  const [search,setSearch]=useState('')
  const [rejectId,setRejectId]=useState(null)
  const [rejectReason,setRejectReason]=useState('')
  const filters=['All','Pending','Approved','Rejected']

  const shown=useMemo(()=>{
    let r=leaves
    if(filter!=='All') r=r.filter(x=>x.status===filter)
    if(search) r=r.filter(x=>x.emp.toLowerCase().includes(search.toLowerCase()))
    return r
  },[leaves,filter,search])

  const approve=id=>setLeaves(p=>p.map(r=>r.id===id?{...r,status:'Approved'}:r))
  const confirmReject=id=>{
    setLeaves(p=>p.map(r=>r.id===id?{...r,status:'Rejected'}:r))
    setRejectId(null); setRejectReason('')
  }
  const TH={padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:700,color:t.muted,
    borderBottom:`1px solid ${t.border}`,textTransform:'uppercase',letterSpacing:'0.05em'}
  const TD={padding:'11px 14px',fontSize:13,borderBottom:`1px solid ${t.border}`}

  return(
    <div>
      {/* header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:'#111827'}}>Time Off</h1>
          <p style={{margin:'4px 0 0',fontSize:13,color:'#9ca3af'}}>Review and manage all employee leave requests</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          {canApprove&&<Btn onClick={onNewAlloc} style={{background:'#fff',color:PU,border:`1.5px solid ${PU}`}}>+ New Allocation</Btn>}
          <Btn onClick={onNew} style={{background:A,color:'#fff'}}>+ New Request</Btn>
        </div>
      </div>

      {/* tabs */}
      <div style={{display:'flex',gap:4,marginBottom:20}}>
        {[['timeoff','Time Off'],['allocation','Allocation']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:'8px 22px',borderRadius:999,border:'none',cursor:'pointer',
            fontWeight:700,fontSize:13,background:tab===k?A:'#f3f4f6',color:tab===k?'#fff':'#374151'}}>{l}</button>
        ))}
      </div>

      {tab==='timeoff'&&(
        <>
          {/* search + filters */}
          <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search employee…"
              style={{padding:'8px 14px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,
                outline:'none',width:200,background:'#f9fafb'}}/>
            <select style={{padding:'8px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',background:'#f9fafb'}}>
              <option>Leave Type ▼</option>
              {Object.keys(TYPE).map(t=><option key={t}>{t}</option>)}
            </select>
            <div style={{display:'flex',gap:6}}>
              {filters.map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{padding:'5px 14px',borderRadius:999,border:'none',
                  cursor:'pointer',fontWeight:600,fontSize:11,background:filter===f?A:'#f3f4f6',color:filter===f?'#fff':'#374151'}}>{f}</button>
              ))}
            </div>
          </div>
          {/* balance strip */}
          <div style={{...card,padding:'12px 20px',marginBottom:14,background:'#eef2ff',display:'flex',gap:28,flexWrap:'wrap',alignItems:'center'}}>
            {[['🌴','Paid Time Off','24 Days',TC],['🏥','Sick Leave','07 Days',PU],['📋','Unpaid','No Limit',AM]].map(([ic,lbl,val,c])=>(
              <span key={lbl} style={{fontSize:13,fontWeight:600,color:c}}>{ic} {lbl} <span style={{color:'#374151',fontWeight:400}}>| {val}</span></span>
            ))}
            <span style={{fontSize:11,color:'#9ca3af',marginLeft:'auto'}}>Select a row to view individual balances</span>
          </div>
          <LeaveTable rows={shown} isAdmin={true} canApprove={canApprove} onView={onView}
            onApprove={approve} onReject={()=>{}} rejectId={rejectId} setRejectId={setRejectId}
            rejectReason={rejectReason} setRejectReason={setRejectReason} onConfirmReject={confirmReject}/>
        </>
      )}

      {tab==='allocation'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span style={{fontWeight:700,fontSize:15}}>Leave Balance Allocations</span>
            {canApprove&&<Btn onClick={onNewAlloc} style={{background:A,color:'#fff'}}>+ New Allocation</Btn>}
          </div>
          <div style={{...card,padding:0,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#f9fafb'}}>
                {['Employee','Leave Type','Validity Period','Allocated Days','Remaining','Actions'].map(h=>(
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {MOCK_ALLOC.map(r=>(
                  <tr key={r.id} style={{borderBottom:'1px solid #f3f4f6'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8faff'}
                    onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <td style={{...TD,fontWeight:600}}>{r.emp}</td>
                    <td style={TD}><TypePill t={r.type}/></td>
                    <td style={{...TD,color:'#6b7280'}}>{r.period}</td>
                    <td style={TD}>{r.allocated.toFixed(2)} days</td>
                    <td style={{...TD,fontWeight:700,color:A}}>{r.remaining} days</td>
                    <td style={TD}>
                      {canApprove&&<>
                        <button style={{background:'#eef2ff',color:A,border:'none',borderRadius:7,padding:'4px 10px',fontSize:12,cursor:'pointer',marginRight:4}}>✏ Edit</button>
                        <button style={{background:'#fee2e2',color:RD,border:'none',borderRadius:7,padding:'4px 10px',fontSize:12,cursor:'pointer'}}>🗑 Delete</button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── REQUEST MODAL ──────────────────────────────── */
function RequestModal({onClose,isAdmin}){
  const [ltype,setLtype]=useState('')
  const [from,setFrom]=useState('')
  const [to,setTo]=useState('')
  const [note,setNote]=useState('')
  const dur=workingDays(from,to)
  const IF={width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',
    fontSize:13,outline:'none',color:'#374151',boxSizing:'border-box',background:'#fff',fontFamily:'inherit'}
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:520,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 22px',borderBottom:'1px solid #f3f4f6'}}>
          <span style={{fontWeight:800,fontSize:16}}>New Time Off Request</span>
          <button onClick={onClose} style={{background:'#f3f4f6',border:'none',borderRadius:8,padding:'5px 12px',fontWeight:700,cursor:'pointer'}}>✕</button>
        </div>
        <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>
          {isAdmin&&(
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Employee</label>
              <select style={IF}><option value="">Select employee…</option>
                {['Arjun Mehta','Priya Sharma','Rohit Kulkarni','Sneha Patil','Vikram Desai'].map(e=><option key={e}>{e}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Time Off Type</label>
            <select value={ltype} onChange={e=>setLtype(e.target.value)} style={IF}>
              <option value="">Select type…</option>
              {Object.entries(TYPE).map(([k,v])=><option key={k} value={k}>{v.icon} {k}</option>)}
            </select>
          </div>
          {/* Unpaid banner */}
          {ltype==='Unpaid Leave'&&(
            <div style={{background:'#fffbeb',borderLeft:`4px solid ${AM}`,padding:'10px 14px',borderRadius:'0 8px 8px 0',fontSize:12,color:'#92400e'}}>
              ℹ️ Unpaid leave will be deducted from your salary
            </div>
          )}
          {/* Sick warning */}
          {ltype==='Sick Leave'&&(
            <div style={{background:'#fef2f2',borderLeft:`4px solid ${RD}`,padding:'10px 14px',borderRadius:'0 8px 8px 0',fontSize:12,color:'#991b1b'}}>
              🏥 Medical certificate required for sick leave
            </div>
          )}
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Validity Period</label>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...IF,flex:1}}/>
              <span style={{color:'#9ca3af',fontSize:13}}>to</span>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...IF,flex:1}}/>
            </div>
            {dur>0&&<span style={{display:'inline-block',marginTop:8,background:'#eef2ff',color:A,borderRadius:999,padding:'4px 12px',fontSize:11,fontWeight:700}}>Duration: {dur} working day{dur!==1?'s':''}</span>}
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Note</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Add a reason for your leave request…"
              style={{...IF,resize:'vertical'}}/>
          </div>
          {ltype==='Sick Leave'&&(
            <div>
              <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>
                Attachment <span style={{color:RD}}>*</span> <span style={{color:'#9ca3af',fontWeight:400}}>(Required for Sick Leave)</span>
              </label>
              <div style={{border:'2px dashed #c7d2fe',background:'#f5f3ff',borderRadius:10,padding:'20px',textAlign:'center',cursor:'pointer'}}>
                <p style={{margin:0,fontSize:13,color:PU}}>📎 Upload sick leave certificate</p>
                <p style={{margin:'4px 0 0',fontSize:11,color:'#9ca3af'}}>PDF, JPG, PNG accepted</p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}}/>
              </div>
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',padding:'14px 22px',borderTop:'1px solid #f3f4f6'}}>
          <Btn onClick={onClose} style={{background:'#fff',color:'#374151',border:'1.5px solid #e5e7eb'}}>Discard</Btn>
          <Btn style={{background:A,color:'#fff'}}>Submit Request</Btn>
        </div>
      </div>
    </div>
  )
}

/* ── ALLOCATION MODAL ───────────────────────────── */
function AllocationModal({onClose}){
  const [ltype,setLtype]=useState('')
  const [days,setDays]=useState(24)
  const IF={width:'100%',padding:'9px 12px',borderRadius:9,border:'1.5px solid #e5e7eb',fontSize:13,outline:'none',color:'#374151',boxSizing:'border-box',background:'#fff',fontFamily:'inherit'}
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:480,boxShadow:'0 20px 60px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'18px 22px',borderBottom:'1px solid #f3f4f6'}}>
          <span style={{fontWeight:800,fontSize:16}}>New Leave Allocation</span>
          <button onClick={onClose} style={{background:'#f3f4f6',border:'none',borderRadius:8,padding:'5px 12px',fontWeight:700,cursor:'pointer'}}>✕</button>
        </div>
        <div style={{padding:'20px 22px',display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Employee</label>
            <select style={IF}><option value="">Select employee…</option>
              {['Arjun Mehta','Priya Sharma','Rohit Kulkarni','Sneha Patil','Vikram Desai'].map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Time Off Type</label>
            <select value={ltype} onChange={e=>setLtype(e.target.value)} style={IF}>
              <option value="">Select type…</option>
              {Object.entries(TYPE).map(([k,v])=><option key={k} value={k}>{v.icon} {k}</option>)}
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Validity Period</label>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <input type="date" style={{...IF,flex:1}} defaultValue="2025-10-13"/>
              <span style={{color:'#9ca3af',fontSize:13}}>to</span>
              <input type="text" style={{...IF,flex:1}} defaultValue="No Limit"/>
            </div>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Allocation (Days)</label>
            <input type="number" value={days} onChange={e=>setDays(Number(e.target.value))} min={0} step={0.5} style={IF}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#374151',marginBottom:5}}>Note <span style={{color:'#9ca3af',fontWeight:400}}>(optional)</span></label>
            <textarea rows={2} placeholder="Optional note…" style={{...IF,resize:'vertical'}}/>
          </div>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',padding:'14px 22px',borderTop:'1px solid #f3f4f6'}}>
          <Btn onClick={onClose} style={{background:'#fff',color:'#374151',border:'1.5px solid #e5e7eb'}}>Discard</Btn>
          <Btn style={{background:A,color:'#fff'}}>Save Allocation</Btn>
        </div>
      </div>
    </div>
  )
}

/* ── DETAIL MODAL ───────────────────────────────── */
function DetailModal({leave,onClose,canApprove,onApprove}){
  if(!leave) return null
  const rows=[
    ['Employee',<><strong>{leave.emp}</strong><div style={{fontSize:11,color:'#9ca3af'}}>{leave.empId}</div></>],
    ['Leave Type',<TypePill t={leave.type}/>],
    ['Period',`${leave.start} – ${leave.end}`],
    ['Duration',`${leave.days} Working Day${leave.days!==1?'s':''}`],
    ['Note',leave.note||'—'],
    ['Attachment','—'],
    ['Status',<Badge s={leave.status}/>],
    ['Approved by','HR Officer'],
    ['Approved on','29 Oct 2025'],
  ]
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:480,boxShadow:'0 20px 60px rgba(0,0,0,0.18)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 22px',borderBottom:'1px solid #f3f4f6'}}>
          <span style={{fontWeight:800,fontSize:15}}>Leave Request Details</span>
          <button onClick={onClose} style={{background:'#f3f4f6',border:'none',borderRadius:8,padding:'5px 12px',fontWeight:700,cursor:'pointer'}}>✕</button>
        </div>
        <div style={{padding:'16px 22px'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <tbody>
              {rows.map(([l,v])=>(
                <tr key={l} style={{borderBottom:'1px solid #f9f9f9'}}>
                  <td style={{padding:'9px 0',fontSize:12,color:'#9ca3af',fontWeight:600,width:120,verticalAlign:'top'}}>{l}</td>
                  <td style={{padding:'9px 0',fontSize:13,color:'#374151'}}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {canApprove&&leave.status==='Pending'&&(
          <div style={{display:'flex',gap:8,padding:'12px 22px',borderTop:'1px solid #f3f4f6'}}>
            <Btn onClick={()=>{onApprove(leave.id);onClose()}} style={{background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0'}}>✅ Approve</Btn>
            <Btn style={{background:'#fef2f2',color:RD,border:'1px solid #fecaca'}}>❌ Reject</Btn>
          </div>
        )}
        <div style={{display:'flex',justifyContent:'flex-end',padding:'12px 22px',borderTop:'1px solid #f3f4f6'}}>
          <Btn onClick={onClose} style={{background:'#f3f4f6',color:'#374151',border:'none'}}>Close</Btn>
        </div>
      </div>
    </div>
  )
}

/* ── ROLE CONFIG ────────────────────────────────── */
const ROLES=['Employee','HR Officer','Admin','Payroll Officer']
const canApproveRole=r=>r==='Admin'||r==='HR Officer'
const isAdminRole=r=>r!=='Employee'

/* ── MAIN TIME OFF PAGE ─────────────────────────── */
export default function TimeOff(){
  const t = useT()
  const [role,setRole]=useState('Employee')
  const [leaves,setLeaves]=useState(MOCK_LEAVES)
  const [reqOpen,setReqOpen]=useState(false)
  const [allocOpen,setAllocOpen]=useState(false)
  const [detailOpen,setDetailOpen]=useState(false)
  const [selLeave,setSelLeave]=useState(null)

  const openDetail=l=>{setSelLeave(l);setDetailOpen(true)}
  const approve=id=>setLeaves(p=>p.map(r=>r.id===id?{...r,status:'Approved'}:r))

  return(
    <div style={{display:'flex',minHeight:'100vh',background:t.bg,fontFamily:'inherit'}}>
      <Sidebar/>
      <div style={{flex:1,marginLeft:64,padding:'28px 28px 48px',minWidth:0}}>
        {/* Role switcher */}
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'#fff',borderRadius:10,padding:'6px 14px',boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
            <span style={{fontSize:12,color:'#6b7280',fontWeight:600}}>Viewing as:</span>
            <select value={role} onChange={e=>setRole(e.target.value)} style={{border:'none',outline:'none',fontWeight:700,fontSize:13,color:A,background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Main content */}
        {!isAdminRole(role)
          ? <EmployeeView onNew={()=>setReqOpen(true)} onView={openDetail} leaves={leaves} setLeaves={setLeaves}/>
          : <AdminView
              onNew={()=>setReqOpen(true)}
              onNewAlloc={()=>setAllocOpen(true)}
              onView={openDetail}
              leaves={leaves}
              setLeaves={setLeaves}
              canApprove={canApproveRole(role)}
            />
        }
      </div>

      {/* Modals */}
      {reqOpen&&<RequestModal onClose={()=>setReqOpen(false)} isAdmin={isAdminRole(role)}/>}
      {allocOpen&&<AllocationModal onClose={()=>setAllocOpen(false)}/>}
      {detailOpen&&<DetailModal leave={selLeave} onClose={()=>setDetailOpen(false)} canApprove={canApproveRole(role)} onApprove={approve}/>}
    </div>
  )
}

