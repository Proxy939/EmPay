import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  UserPlus, Copy, Check, AlertCircle, Loader2, X,
  User, Mail, Phone, Briefcase, Building2, Calendar, ShieldCheck
} from 'lucide-react'
import { useTheme } from '@/lib/theme'
import api from '@/lib/api'

const ROLES = [
  { value: 'EMPLOYEE',        label: 'Employee'        },
  { value: 'HR_OFFICER',      label: 'HR Officer'      },
  { value: 'PAYROLL_OFFICER', label: 'Payroll Officer' },
]

// ── Themed input ──────────────────────────────────────────────────────────────
function TInput({ C, ...props }) {
  return (
    <input
      style={{
        width: '100%', boxSizing: 'border-box',
        height: 36, padding: '0 10px', borderRadius: 8,
        border: `1px solid ${C.border}`, background: C.inputBg,
        color: C.text, fontSize: 13, outline: 'none',
        fontFamily: 'inherit',
      }}
      {...props}
    />
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ C, label, icon: Icon, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.muted }}>
        {Icon && <Icon size={12} color={C.muted} />}
        {label} {required && <span style={{ color: C.accent }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Credentials success card ──────────────────────────────────────────────────
function CredentialsCard({ C, credentials, onClose }) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedPw, setCopiedPw] = useState(false)

  const copy = (text, setter) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const CopyBtn = ({ text, copied, setter }) => (
    <button
      onClick={() => copy(text, setter)}
      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent',
        border: 'none', cursor: 'pointer', color: C.accent, fontSize: 11, fontWeight: 600 }}
    >
      {copied ? <Check size={12} color={C.green} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Success banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12,
        border: `1px solid ${C.green}40`, background: `${C.green}15`, padding: '12px 16px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${C.green}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={18} color={C.green} strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.green }}>Employee account created!</p>
          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Share credentials securely — password shown only once.</p>
        </div>
      </div>

      {/* Credentials box */}
      <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {[
          { label: 'Login ID', value: credentials.loginId, copied: copiedId, setter: setCopiedId },
          { label: 'Temporary Password', value: credentials.password, copied: copiedPw, setter: setCopiedPw },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: i === 0 ? `1px solid ${C.border}` : 'none',
            background: C.inputBg }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{row.label}</p>
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '0.05em' }}>{row.value}</p>
            </div>
            <CopyBtn text={row.value} copied={row.copied} setter={row.setter} />
          </div>
        ))}
      </div>

      {/* Warning */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, borderRadius: 10,
        border: `1px solid ${C.amber}60`, background: `${C.amber}15`, padding: '10px 12px' }}>
        <AlertCircle size={14} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12, color: C.amber }}>
          Employee must change password on first login. Keep these credentials safe.
        </p>
      </div>

      <button
        onClick={onClose}
        style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none',
          background: C.accent, color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
      >
        Done
      </button>
    </div>
  )
}

// ── New Employee Dialog ───────────────────────────────────────────────────────
export default function NewEmployeeDialog({ open, onOpenChange, onCreated }) {
  const { colors: C } = useTheme()
  const callerRole    = JSON.parse(localStorage.getItem('user') || '{}')?.role || 'ADMIN'

  const [form, setForm]           = useState({ name:'', email:'', phone:'', role:'EMPLOYEE', department:'', designation:'', joinDate:'' })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [credentials, setCreds]   = useState(null)

  const set = (key) => (e) => { setForm(f => ({ ...f, [key]: e.target.value })); if (error) setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { setError('Name, email and phone are required.'); return }
    if (!/^\d{10}$/.test(form.phone)) { setError('Phone must be exactly 10 digits.'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/users', {
        name: form.name.trim(), email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(), role: form.role,
        department: form.department.trim() || undefined,
        designation: form.designation.trim() || undefined,
        joinDate: form.joinDate || undefined,
      })
      setCreds(res.data.credentials)
      onCreated?.()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong.')
    } finally { setLoading(false) }
  }

  const handleClose = (val) => {
    if (!val) { setForm({ name:'', email:'', phone:'', role:'EMPLOYEE', department:'', designation:'', joinDate:'' }); setError(''); setCreds(null) }
    onOpenChange(val)
  }

  const availableRoles = callerRole === 'ADMIN' ? ROLES : ROLES.filter(r => r.value === 'EMPLOYEE')

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }} />

        {/* Content */}
        <DialogPrimitive.Content style={{
          position: 'fixed', left: '50%', top: '50%', zIndex: 51,
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
          borderRadius: 16, border: `1px solid ${C.border}`,
          background: C.card, boxShadow: C.shadow,
          fontFamily: "'Geist Variable','Inter',sans-serif",
        }}>
          {/* Close button */}
          <DialogPrimitive.Close style={{
            position: 'absolute', right: 14, top: 14, background: 'transparent',
            border: 'none', cursor: 'pointer', color: C.muted, padding: 4, borderRadius: 6,
          }}>
            <X size={16} color={C.muted} />
          </DialogPrimitive.Close>

          {/* Hidden a11y title/description required by Radix */}
          <DialogPrimitive.Title style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap' }}>
            Add New Employee
          </DialogPrimitive.Title>
          <DialogPrimitive.Description style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap' }}>
            Fill in employee details. A Login ID and temporary password will be auto-generated.
          </DialogPrimitive.Description>

          {/* Header */}
          <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: C.accentL,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserPlus size={19} color={C.accent} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Add New Employee</p>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, marginTop: 2 }}>System will auto-generate a Login ID and temporary password.</p>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '18px 24px 24px' }}>
            {credentials ? (
              <CredentialsCard C={C} credentials={credentials} onClose={() => handleClose(false)} />
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Error */}
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10,
                    border: `1px solid ${C.red}40`, background: `${C.red}15`, padding: '10px 12px' }}>
                    <AlertCircle size={14} color={C.red} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: C.red }}>{error}</span>
                  </div>
                )}

                {/* Name */}
                <Field C={C} label="Full Name" icon={User} required>
                  <TInput C={C} value={form.name} onChange={set('name')} placeholder="e.g. Priya Sharma" />
                </Field>

                {/* Email + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field C={C} label="Work Email" icon={Mail} required>
                    <TInput C={C} type="email" value={form.email} onChange={set('email')} placeholder="priya@company.com" />
                  </Field>
                  <Field C={C} label="Phone" icon={Phone} required>
                    <TInput C={C} type="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit number" maxLength={10} />
                  </Field>
                </div>

                {/* Role toggle */}
                <Field C={C} label="Role" icon={ShieldCheck} required>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {availableRoles.map(r => (
                      <button key={r.value} type="button"
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 10, border: `1px solid`,
                          borderColor: form.role === r.value ? C.accent : C.border,
                          background: form.role === r.value ? C.accentL : C.inputBg,
                          color: form.role === r.value ? C.accent : C.muted,
                          fontWeight: form.role === r.value ? 600 : 500,
                          fontSize: 12, cursor: 'pointer', transition: 'all .15s',
                        }}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Department + Designation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field C={C} label="Department" icon={Building2}>
                    <TInput C={C} value={form.department} onChange={set('department')} placeholder="e.g. Engineering" />
                  </Field>
                  <Field C={C} label="Designation" icon={Briefcase}>
                    <TInput C={C} value={form.designation} onChange={set('designation')} placeholder="e.g. Software Eng." />
                  </Field>
                </div>

                {/* Join Date */}
                <Field C={C} label="Joining Date" icon={Calendar}>
                  <TInput C={C} type="date" value={form.joinDate} onChange={set('joinDate')} />
                </Field>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                  <button type="button" onClick={() => handleClose(false)}
                    style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.border}`,
                      background: 'transparent', color: C.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10,
                      border: 'none', background: C.accent, color: 'white', fontWeight: 600, fontSize: 13,
                      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</>
                      : <><UserPlus size={14} /> Create Employee</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
