import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase,
  Building2, User, CreditCard, Award, BookOpen, Heart
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Button }   from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge }    from '@/components/ui/badge'
import api from '@/lib/api'

const STATUS = {
  CHECKED_IN:  { color: 'bg-emerald-500', label: 'Present'     },
  CHECKED_OUT: { color: 'bg-slate-400',   label: 'Checked Out' },
  ON_LEAVE:    { color: 'bg-sky-400',     label: 'On Leave'    },
  ABSENT:      { color: 'bg-amber-400',   label: 'Absent'      },
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/40 mt-0.5">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40 bg-muted/20">
        <Icon className="size-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

function TagList({ items }) {
  if (!items?.length) return <p className="py-3 text-xs text-muted-foreground italic">None added yet</p>
  return (
    <div className="flex flex-wrap gap-2 py-3">
      {items.map((item) => (
        <Badge key={item.id} variant="secondary" className="text-xs font-normal">
          {item.name}
          {item.issuer && <span className="ml-1 text-muted-foreground">· {item.issuer}</span>}
          {item.year   && <span className="ml-1 text-muted-foreground">({item.year})</span>}
        </Badge>
      ))}
    </div>
  )
}

export default function MyProfile() {
  const navigate = useNavigate()
  const [emp, setEmp]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}')
  const role = loggedInUser?.role || 'EMPLOYEE'

  useEffect(() => {
    api.get('/employees/me')
      .then(r => setEmp(r.data.employee))
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false))
  }, [])

  const backButton = (
    <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate(-1)}>
      <ArrowLeft className="size-3.5" /> Back
    </Button>
  )

  if (loading) return (
    <AppLayout title="My Profile" actions={backButton}>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-5 rounded-xl border border-border/50 bg-card p-6">
          <Skeleton className="size-24 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    </AppLayout>
  )

  if (error || !emp) return (
    <AppLayout title="My Profile" actions={backButton}>
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm text-muted-foreground">{error || 'Profile not found.'}</p>
        <Button className="mt-4" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    </AppLayout>
  )

  const fullName   = `${emp.firstName} ${emp.lastName}`
  const initials   = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase()
  const status     = STATUS[emp.workStatus] || STATUS.ABSENT
  const joinDate   = emp.joinDate     ? new Date(emp.joinDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : null
  const dob        = emp.dateOfBirth  ? new Date(emp.dateOfBirth).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : null
  const showSalary = role === 'ADMIN' || role === 'PAYROLL_OFFICER'
  const showBank   = role === 'ADMIN' || role === 'PAYROLL_OFFICER'

  return (
    <AppLayout title="My Profile" actions={backButton}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Hero card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-xl border border-border/50 bg-card p-6">
          <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-4 ring-border/50 text-3xl font-bold text-primary">
            {emp.profilePhoto
              ? <img src={emp.profilePhoto} alt={fullName} className="size-full rounded-full object-cover" />
              : initials
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}/20 text-xs`}>
                <span className={`size-1.5 rounded-full ${status.color}`} />
                {status.label}
              </span>
              <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">
                {role.replace('_', ' ')}
              </span>
            </div>
            {emp.designation && <p className="text-sm text-muted-foreground mb-0.5">{emp.designation}</p>}
            <div className="flex flex-wrap gap-3 mt-2">
              {emp.department    && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="size-3"/>{emp.department}</span>}
              {emp.user?.loginId && <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground"><CreditCard className="size-3"/>{emp.user.loginId}</span>}
            </div>
          </div>
          {joinDate && (
            <div className="shrink-0 text-right hidden sm:block">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Joined</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{joinDate}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Work Information" icon={Briefcase}>
            <InfoRow icon={Building2} label="Department"      value={emp.department} />
            <InfoRow icon={Briefcase} label="Designation"     value={emp.designation} />
            <InfoRow icon={MapPin}    label="Office Location" value={emp.companyLocation} />
            <InfoRow icon={Calendar}  label="Joining Date"    value={joinDate} />
            {emp.manager && (
              <InfoRow icon={User} label="Manager" value={`${emp.manager.firstName} ${emp.manager.lastName}`} />
            )}
          </Section>
          <Section title="Personal Information" icon={User}>
            <InfoRow icon={Mail}     label="Work Email"     value={emp.user?.email} />
            <InfoRow icon={Mail}     label="Personal Email" value={emp.personalEmail} />
            <InfoRow icon={Phone}    label="Phone"          value={emp.phone} />
            <InfoRow icon={Calendar} label="Date of Birth"  value={dob} />
            <InfoRow icon={User}     label="Gender"         value={emp.gender} />
            <InfoRow icon={Heart}    label="Marital Status" value={emp.maritalStatus} />
            <InfoRow icon={MapPin}   label="Nationality"    value={emp.nationality} />
            <InfoRow icon={MapPin}   label="Address"        value={emp.address} />
          </Section>
        </div>

        {(emp.about || emp.whatILove || emp.interests) && (
          <Section title="About" icon={BookOpen}>
            {emp.about     && <div className="py-2.5 border-b border-border/40"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">About</p><p className="text-sm text-foreground">{emp.about}</p></div>}
            {emp.whatILove && <div className="py-2.5 border-b border-border/40"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">What I Love</p><p className="text-sm text-foreground">{emp.whatILove}</p></div>}
            {emp.interests && <div className="py-2.5"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Interests</p><p className="text-sm text-foreground">{emp.interests}</p></div>}
          </Section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Skills" icon={Award}><TagList items={emp.skills} /></Section>
          <Section title="Certifications" icon={Award}><TagList items={emp.certifications} /></Section>
        </div>

        {showBank && (
          <Section title="Bank & Payroll Details" icon={CreditCard}>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <InfoRow icon={CreditCard} label="Bank Name"       value={emp.bankName} />
              <InfoRow icon={CreditCard} label="Account Number"  value={emp.bankAccountNumber} />
              <InfoRow icon={CreditCard} label="IFSC Code"       value={emp.ifscCode} />
              <InfoRow icon={CreditCard} label="PAN Number"      value={emp.panNumber} />
              <InfoRow icon={CreditCard} label="UAN Number"      value={emp.uanNumber} />
              {showSalary && <InfoRow icon={CreditCard} label="Monthly Wage" value={emp.wageAmount ? `₹${emp.wageAmount.toLocaleString('en-IN')}` : null} />}
            </div>
          </Section>
        )}

      </div>
    </AppLayout>
  )
}
