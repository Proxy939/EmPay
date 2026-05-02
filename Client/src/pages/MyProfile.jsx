import { useState, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Save, X, Plus, Lock, IndianRupee, User, CreditCard, BookOpen, Award, Shield } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'

const fmt = v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
const money = v => v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—'

const STATUS_COLORS = {
  CHECKED_IN:  { dot: '#22c55e', label: 'Present',     bg: '#22c55e20' },
  CHECKED_OUT: { dot: '#94a3b8', label: 'Checked Out', bg: '#94a3b820' },
  ON_LEAVE:    { dot: '#38bdf8', label: 'On Leave',    bg: '#38bdf820' },
  ABSENT:      { dot: '#fbbf24', label: 'Absent',      bg: '#fbbf2420' },
}

/* ── Field display / edit ─────────────────────────────────────────── */
function Field({ label, value, name, type = 'text', editing, onChange, options }) {
  const cls = 'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      {editing ? (
        options
          ? <select name={name} value={value || ''} onChange={onChange} className={cls}>
              <option value="">— Select —</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          : type === 'textarea'
            ? <textarea name={name} value={value || ''} onChange={onChange} rows={3} className={cls + ' resize-none'} />
            : <input type={type} name={name} value={value || ''} onChange={onChange} className={cls} />
      ) : (
        <p className="text-sm text-foreground py-1">{value || '—'}</p>
      )}
    </div>
  )
}

/* ── Section card ─────────────────────────────────────────────────── */
function Card({ title, icon: Icon, children, action }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40 bg-muted/10">
        <Icon className="size-4 text-primary" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex-1">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

/* ── Tags with add/remove ─────────────────────────────────────────── */
function TagManager({ items, onAdd, onRemove, placeholder, withMeta }) {
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ name: '', issuer: '', year: '' })
  const submit = () => {
    if (!form.name.trim()) return
    onAdd({ name: form.name, issuer: form.issuer || undefined, year: form.year ? parseInt(form.year) : undefined })
    setForm({ name: '', issuer: '', year: '' })
    setShow(false)
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[24px]">
        {items?.length ? items.map(item => (
          <span key={item.id} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            {item.name}
            {item.issuer && <span className="text-primary/60">· {item.issuer}</span>}
            {item.year && <span className="text-primary/60">({item.year})</span>}
            <button onClick={() => onRemove(item.id)} className="hover:text-destructive ml-0.5"><X className="size-3" /></button>
          </span>
        )) : <p className="text-xs text-muted-foreground italic">None added yet</p>}
      </div>
      {show ? (
        <div className="flex flex-wrap gap-2 items-end p-3 rounded-lg bg-muted/30 border border-border/50">
          <div><p className="text-[10px] text-muted-foreground mb-1">Name *</p>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={placeholder}
              className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background text-foreground w-36 focus:outline-none focus:ring-1 focus:ring-primary/40" /></div>
          {withMeta && <>
            <div><p className="text-[10px] text-muted-foreground mb-1">Issuer</p>
              <input value={form.issuer} onChange={e => setForm({...form, issuer: e.target.value})
              } className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background text-foreground w-28 focus:outline-none focus:ring-1 focus:ring-primary/40" /></div>
            <div><p className="text-[10px] text-muted-foreground mb-1">Year</p>
              <input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})}
                className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background text-foreground w-20 focus:outline-none focus:ring-1 focus:ring-primary/40" /></div>
          </>}
          <Button size="sm" className="h-8 text-xs" onClick={submit}>Add</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShow(false)}>Cancel</Button>
        </div>
      ) : (
        <button onClick={() => setShow(true)} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
          <Plus className="size-3" /> Add
        </button>
      )}
    </div>
  )
}

/* ── Salary row with progress bar ─────────────────────────────────── */
function SalaryRow({ label, amount, percent, desc }) {
  return (
    <div className="py-3 border-b border-border/30 last:border-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2 text-right">
          <span className="text-sm font-bold text-foreground">{money(amount)}</span>
          <span className="text-[10px] text-muted-foreground">/mo</span>
          {percent != null && <Badge variant="secondary" className="text-[10px] tabular-nums">{percent}%</Badge>}
        </div>
      </div>
      {percent != null && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
      )}
      {desc && <p className="text-[10px] text-muted-foreground mt-1 italic">{desc}</p>}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════ */
export default function MyProfile() {
  const navigate = useNavigate()
  const [emp, setEmp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('resume')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [salary, setSalary] = useState(null)
  const [salaryLoading, setSalaryLoading] = useState(false)
  const [pw, setPw] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false })
  const [pwLoading, setPwLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const role = user?.role || 'EMPLOYEE'
  const isPrivileged = role === 'ADMIN' || role === 'PAYROLL_OFFICER'

  /* fetch profile */
  useEffect(() => {
    api.get('/employees/me')
      .then(r => { setEmp(r.data.employee); setForm(r.data.employee) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /* fetch salary when tab opens */
  useEffect(() => {
    if (tab === 'salary' && isPrivileged && emp?.id && !salary) {
      setSalaryLoading(true)
      api.get(`/employees/${emp.id}/salary`)
        .then(r => setSalary(r.data))
        .finally(() => setSalaryLoading(false))
    }
  }, [tab, emp?.id])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  /* photo upload — convert to base64 and save immediately */
  const [photoUploading, setPhotoUploading] = useState(false)
  const handlePhotoChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return alert('Image must be under 2 MB')
    setPhotoUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result
      try {
        const r = await api.patch('/employees/me', { profilePhoto: base64 })
        setEmp(r.data.employee)
      } catch { alert('Failed to update photo') }
      setPhotoUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true); setSaveMsg('')
    try {
      const r = await api.patch('/employees/me', form)
      setEmp(r.data.employee)
      setEditing(false)
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (e) { setSaveMsg(e.response?.data?.message || 'Failed to save') }
    setSaving(false)
  }

  /* skills */
  const addSkill = async data => {
    await api.post(`/employees/${emp.id}/skills`, data)
    const r = await api.get('/employees/me'); setEmp(r.data.employee)
  }
  const removeSkill = async id => {
    await api.delete(`/employees/skills/${id}`)
    setEmp(e => ({ ...e, skills: e.skills.filter(s => s.id !== id) }))
  }

  /* certs */
  const addCert = async data => {
    await api.post(`/employees/${emp.id}/certifications`, data)
    const r = await api.get('/employees/me'); setEmp(r.data.employee)
  }
  const removeCert = async id => {
    await api.delete(`/employees/certifications/${id}`)
    setEmp(e => ({ ...e, certifications: e.certifications.filter(c => c.id !== id) }))
  }

  /* password */
  const handlePwSave = async () => {
    setPwMsg({ text: '', ok: false })
    if (pw.newPassword !== pw.confirmNewPassword) return setPwMsg({ text: 'Passwords do not match', ok: false })
    if (pw.newPassword.length < 6) return setPwMsg({ text: 'Minimum 6 characters', ok: false })
    setPwLoading(true)
    try {
      await api.post('/auth/change-password', pw)
      setPwMsg({ text: '✓ Password changed successfully!', ok: true })
      setPw({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch (e) { setPwMsg({ text: e.response?.data?.message || 'Failed', ok: false }) }
    setPwLoading(false)
  }

  const tabs = [
    { key: 'resume',   label: 'Resume',      Icon: BookOpen },
    { key: 'private',  label: 'Private Info', Icon: User },
    ...(isPrivileged ? [{ key: 'salary', label: 'Salary Info', Icon: IndianRupee }] : []),
    { key: 'security', label: 'Security',     Icon: Lock },
  ]

  const back = (
    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate(-1)}>
      <ArrowLeft className="size-3.5" /> Back
    </Button>
  )

  if (loading) return (
    <AppLayout title="My Profile" actions={back}>
      <div className="max-w-5xl mx-auto space-y-5">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        {[1,2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    </AppLayout>
  )

  if (!emp) return (
    <AppLayout title="My Profile" actions={back}>
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm text-muted-foreground">Profile not found. Please contact your administrator.</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    </AppLayout>
  )

  const fullName = `${emp.firstName} ${emp.lastName}`
  const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase()
  const s = STATUS_COLORS[emp.workStatus] || STATUS_COLORS.ABSENT

  const editActions = (
    <div className="flex items-center gap-2">
      {saveMsg && <span className="text-[10px] text-primary animate-pulse">{saveMsg}</span>}
      {editing ? <>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="size-3" />{saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
      </> : (
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => { setEditing(true); setForm(emp) }}>
          <Pencil className="size-3" /> Edit
        </Button>
      )}
    </div>
  )

  return (
    <AppLayout title="My Profile" actions={back}>
      <div className="max-w-5xl mx-auto space-y-5 anim-fade-up">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border/50 bg-card">
          {/* Banner + avatar row — relative so avatar can sit on banner edge */}
          <div className="relative">
            <div className="h-24 rounded-t-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            {/* Avatar sits half on banner, half below — absolute on md+, inline on mobile */}
            <div className="px-6 flex flex-col sm:flex-row sm:items-end gap-4 pb-4 pt-3 sm:pt-0">
              {/* Clickable avatar */}
              <label className="relative size-20 rounded-full border-4 border-card bg-primary/15 flex items-center justify-center text-2xl font-bold text-primary shrink-0 cursor-pointer group sm:-mt-10 z-10" title="Click to change photo">
                {emp.profilePhoto
                  ? <img src={emp.profilePhoto} alt={fullName} className="size-full rounded-full object-cover" />
                  : initials}
                <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {photoUploading
                    ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Pencil className="size-4 text-white" /><span className="text-[9px] text-white mt-0.5">Change</span></>}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
              </label>

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5"
                    style={{ background: s.bg, color: s.dot }}>
                    <span className="size-1.5 rounded-full" style={{ background: s.dot }} />{s.label}
                  </span>
                  <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">
                    {role.replace('_', ' ')}
                  </span>
                </div>
                {emp.designation && <p className="text-sm text-muted-foreground mt-0.5">{emp.designation}</p>}
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{emp.user?.loginId}</p>
              </div>
              {/* No-manager warning */}
              {!emp.manager && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{background:'#fffbeb',border:'1px solid #fde68a',color:'#92400e'}}>
                  ⚠ No manager assigned — please contact HR
                </div>
              )}

              {/* Right meta — hidden on mobile */}
              <div className="hidden md:grid grid-cols-2 gap-x-6 gap-y-1 text-xs pb-1 shrink-0">
                {[
                  ['Company',    emp.user?.companyName],
                  ['Department', emp.department],
                  ['Manager',    emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null],
                  ['Joined',     emp.joinDate ? fmt(emp.joinDate) : null],
                ].map(([l, v]) => (
                  <Fragment key={l}>
                    <span className="text-muted-foreground">{l}</span>
                    <span className="text-foreground font-medium">{v || '—'}</span>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="flex border-b border-border/50 gap-0 overflow-x-auto">
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => { setTab(key); setEditing(false) }}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap
                ${tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
              <Icon className="size-3.5" />{label}
            </button>
          ))}
        </div>

        {/* ── Resume Tab ───────────────────────────────────────────── */}
        {tab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-5">
              <Card title="About" icon={BookOpen} action={editActions}>
                <div className="space-y-4">
                  <Field label="About me" name="about" type="textarea"
                    value={editing ? form.about : emp.about} editing={editing} onChange={handleChange} />
                  <Field label="What I love about my job" name="whatILove" type="textarea"
                    value={editing ? form.whatILove : emp.whatILove} editing={editing} onChange={handleChange} />
                  <Field label="My interests and hobbies" name="interests" type="textarea"
                    value={editing ? form.interests : emp.interests} editing={editing} onChange={handleChange} />
                </div>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-5">
              <Card title="Skills" icon={Award}>
                <TagManager items={emp.skills} onAdd={addSkill} onRemove={removeSkill} placeholder="e.g. React" />
              </Card>
              <Card title="Certifications" icon={Award}>
                <TagManager items={emp.certifications} onAdd={addCert} onRemove={removeCert} placeholder="e.g. AWS SAA" withMeta />
              </Card>
            </div>
          </div>
        )}

        {/* ── Private Info Tab ─────────────────────────────────────── */}
        {tab === 'private' && (
          <div className="space-y-5">
            <div className="flex justify-end">{editActions}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card title="Personal Details" icon={User}>
                <div className="space-y-4">
                  <Field label="Date of Birth" name="dateOfBirth" type={editing ? 'date' : 'text'}
                    value={editing ? (form.dateOfBirth?.slice?.(0,10) || '') : fmt(emp.dateOfBirth)}
                    editing={editing} onChange={handleChange} />
                  <Field label="Gender" name="gender" options={['MALE','FEMALE','OTHER']}
                    value={editing ? form.gender : emp.gender} editing={editing} onChange={handleChange} />
                  <Field label="Marital Status" name="maritalStatus" options={['SINGLE','MARRIED','DIVORCED','WIDOWED']}
                    value={editing ? form.maritalStatus : emp.maritalStatus} editing={editing} onChange={handleChange} />
                  <Field label="Nationality" name="nationality"
                    value={editing ? form.nationality : emp.nationality} editing={editing} onChange={handleChange} />
                  <Field label="Personal Email" name="personalEmail" type="email"
                    value={editing ? form.personalEmail : emp.personalEmail} editing={editing} onChange={handleChange} />
                  <Field label="Residing Address" name="address" type="textarea"
                    value={editing ? form.address : emp.address} editing={editing} onChange={handleChange} />
                  <Field label="Date of Joining" name="joinDate" type={editing ? 'date' : 'text'}
                    value={editing ? (form.joinDate?.slice?.(0,10) || '') : fmt(emp.joinDate)}
                    editing={editing} onChange={handleChange} />
                </div>
              </Card>
              <Card title="Bank Details" icon={CreditCard}>
                <div className="space-y-4">
                  <Field label="Account Number" name="bankAccountNumber"
                    value={editing ? form.bankAccountNumber : emp.bankAccountNumber} editing={editing} onChange={handleChange} />
                  <Field label="Bank Name" name="bankName"
                    value={editing ? form.bankName : emp.bankName} editing={editing} onChange={handleChange} />
                  <Field label="IFSC Code" name="ifscCode"
                    value={editing ? form.ifscCode : emp.ifscCode} editing={editing} onChange={handleChange} />
                  <Field label="PAN No" name="panNumber"
                    value={editing ? form.panNumber : emp.panNumber} editing={editing} onChange={handleChange} />
                  <Field label="UAN No" name="uanNumber"
                    value={editing ? form.uanNumber : emp.uanNumber} editing={editing} onChange={handleChange} />
                  <Field label="Emp Code" name="empCode"
                    value={editing ? form.empCode : emp.empCode} editing={editing} onChange={handleChange} />
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── Salary Info Tab ──────────────────────────────────────── */}
        {tab === 'salary' && isPrivileged && (
          salaryLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : !salary ? (
            <div className="text-center py-20 text-muted-foreground text-sm">No wage data. Set wage in employee settings.</div>
          ) : (
            <div className="space-y-5">
              {/* Top stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { l: 'Monthly Wage', v: money(salary.monthlyWage) },
                  { l: 'Yearly Wage',  v: money(salary.yearlyWage)  },
                  { l: 'Working Days', v: `${salary.workingDaysPerWeek} days/week` },
                  { l: 'Break Time',   v: `${salary.breakTimeHours} hrs` },
                ].map(({ l, v }) => (
                  <div key={l} className="rounded-xl border border-border/50 bg-card p-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-base font-bold text-foreground">{v}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card title="Salary Components" icon={IndianRupee}>
                  <SalaryRow label="Basic Salary"            {...salary.components.basic} />
                  <SalaryRow label="House Rent Allowance"    {...salary.components.hra} />
                  <SalaryRow label="Standard Allowance"      {...salary.components.standardAllowance} />
                  <SalaryRow label="Performance Bonus"       {...salary.components.performanceBonus} />
                  <SalaryRow label="Leave Travel Allowance"  {...salary.components.lta} />
                  <SalaryRow label="Fixed Allowance"         {...salary.components.fixedAllowance} />
                </Card>
                <div className="space-y-5">
                  <Card title="Provident Fund (PF)" icon={Shield}>
                    <SalaryRow label="Employee PF"  {...salary.pf.employee} />
                    <SalaryRow label="Employer PF"  {...salary.pf.employer} />
                  </Card>
                  <Card title="Tax Deductions" icon={CreditCard}>
                    <SalaryRow label="Professional Tax" amount={salary.tax.professionalTax.amount} desc={salary.tax.professionalTax.desc} />
                  </Card>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Net Take Home</p>
                      <p className="text-2xl font-bold text-primary mt-0.5">{money(salary.netSalary)}<span className="text-xs font-normal text-muted-foreground ml-1">/month</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Deductions</p>
                      <p className="text-sm font-semibold text-destructive mt-0.5">- {money(salary.totalDeductions)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* ── Security Tab ─────────────────────────────────────────── */}
        {tab === 'security' && (
          <div className="max-w-md mx-auto">
            <Card title="Change Password" icon={Lock}>
              <div className="space-y-4">
                {[
                  { label: 'Current Password', key: 'oldPassword' },
                  { label: 'New Password',     key: 'newPassword' },
                  { label: 'Confirm New Password', key: 'confirmNewPassword' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                    <input type="password" value={pw[key]} onChange={e => setPw({ ...pw, [key]: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                ))}
                {pwMsg.text && (
                  <p className={`text-xs font-medium ${pwMsg.ok ? 'text-emerald-500' : 'text-destructive'}`}>{pwMsg.text}</p>
                )}
                <Button onClick={handlePwSave} disabled={pwLoading} className="w-full">
                  {pwLoading ? 'Updating…' : 'Update Password'}
                </Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
