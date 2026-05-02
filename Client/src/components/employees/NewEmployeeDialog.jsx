import { useState } from 'react'
import {
  UserPlus, Copy, Check, AlertCircle, Loader2,
  User, Mail, Phone, Briefcase, Building2, Calendar, ShieldCheck
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import api from '@/lib/api'

// ── Role options ──────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'EMPLOYEE',         label: 'Employee' },
  { value: 'HR_OFFICER',       label: 'HR Officer' },
  { value: 'PAYROLL_OFFICER',  label: 'Payroll Officer' },
]

// ── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ── Credentials Card (success state) ─────────────────────────────────────────
function CredentialsCard({ credentials, onClose }) {
  const [copiedId,  setCopiedId]  = useState(false)
  const [copiedPw,  setCopiedPw]  = useState(false)

  const copy = (text, setter) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const CopyBtn = ({ text, copied, setter }) => (
    <button
      onClick={() => copy(text, setter)}
      className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
    >
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Success banner */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="size-5 text-emerald-500" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-500">Employee account created!</p>
          <p className="text-xs text-muted-foreground">Share these credentials securely — the password is shown only once.</p>
        </div>
      </div>

      {/* Credentials */}
      <div className="rounded-xl border border-border/60 bg-background/60 divide-y divide-border/40 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Login ID</p>
            <p className="font-mono text-base font-bold text-foreground tracking-wider">{credentials.loginId}</p>
          </div>
          <CopyBtn text={credentials.loginId} copied={copiedId} setter={setCopiedId} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Temporary Password</p>
            <p className="font-mono text-base font-bold text-foreground">{credentials.password}</p>
          </div>
          <CopyBtn text={credentials.password} copied={copiedPw} setter={setCopiedPw} />
        </div>
      </div>

      {/* Warning note */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2.5">
        <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
        <p className="text-xs text-amber-500">
          The employee will be required to change their password on first login. Keep these credentials safe.
        </p>
      </div>

      <Button className="w-full" onClick={onClose}>Done</Button>
    </div>
  )
}

// ── New Employee Dialog ───────────────────────────────────────────────────────
export default function NewEmployeeDialog({ open, onOpenChange, onCreated }) {
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}')
  const callerRole   = loggedInUser?.role || 'ADMIN'

  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: 'EMPLOYEE',
    department: '', designation: '', joinDate: '',
  })
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [credentials, setCredentials] = useState(null) // success state

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Name, email and phone are required.')
      return
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError('Phone must be exactly 10 digits.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await api.post('/users', {
        name:        form.name.trim(),
        email:       form.email.trim().toLowerCase(),
        phone:       form.phone.trim(),
        role:        form.role,
        department:  form.department.trim() || undefined,
        designation: form.designation.trim() || undefined,
        joinDate:    form.joinDate || undefined,
      })
      setCredentials(res.data.credentials)
      onCreated?.() // refresh employee list
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (open) => {
    if (!open) {
      setForm({ name: '', email: '', phone: '', role: 'EMPLOYEE', department: '', designation: '', joinDate: '' })
      setError('')
      setCredentials(null)
    }
    onOpenChange(open)
  }

  // HR Officers can only assign EMPLOYEE role
  const availableRoles = callerRole === 'ADMIN' ? ROLES : ROLES.filter(r => r.value === 'EMPLOYEE')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15">
              <UserPlus className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription className="mt-0.5">
                System will auto-generate a Login ID and temporary password.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {credentials ? (
            <CredentialsCard credentials={credentials} onClose={() => handleClose(false)} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Row 1: Name */}
              <Field label="Full Name" icon={User} required>
                <Input
                  value={form.name} onChange={set('name')}
                  placeholder="e.g. Priya Sharma"
                  className="h-9 bg-input/50 text-sm"
                />
              </Field>

              {/* Row 2: Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Work Email" icon={Mail} required>
                  <Input
                    type="email" value={form.email} onChange={set('email')}
                    placeholder="priya@company.com"
                    className="h-9 bg-input/50 text-sm"
                  />
                </Field>
                <Field label="Phone" icon={Phone} required>
                  <Input
                    type="tel" value={form.phone} onChange={set('phone')}
                    placeholder="10-digit number" maxLength={10}
                    className="h-9 bg-input/50 text-sm"
                  />
                </Field>
              </div>

              {/* Row 3: Role */}
              <Field label="Role" icon={ShieldCheck} required>
                <div className="flex gap-2">
                  {availableRoles.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        form.role === r.value
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border/60 bg-input/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Row 4: Department + Designation */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Department" icon={Building2}>
                  <Input
                    value={form.department} onChange={set('department')}
                    placeholder="e.g. Engineering"
                    className="h-9 bg-input/50 text-sm"
                  />
                </Field>
                <Field label="Designation" icon={Briefcase}>
                  <Input
                    value={form.designation} onChange={set('designation')}
                    placeholder="e.g. Software Engineer"
                    className="h-9 bg-input/50 text-sm"
                  />
                </Field>
              </div>

              {/* Row 5: Join Date */}
              <Field label="Joining Date" icon={Calendar}>
                <Input
                  type="date" value={form.joinDate} onChange={set('joinDate')}
                  className="h-9 bg-input/50 text-sm"
                />
              </Field>

              <DialogFooter className="px-0 pt-2">
                <Button type="button" variant="outline" onClick={() => handleClose(false)} className="h-9">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="h-9 gap-2">
                  {loading ? <><Loader2 className="size-4 animate-spin" />Creating…</> : <><UserPlus className="size-4" />Create Employee</>}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
