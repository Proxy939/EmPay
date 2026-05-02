import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, CreditCard, AlertCircle, Loader2,
  Upload, Check, Building2, User, Mail, Phone, Lock
} from 'lucide-react'
import { Button }    from '@/components/ui/button'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import api from '../lib/api'

// ── Ambient background ────────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="orb-b absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, oklch(0.55 0.25 292) 0%, transparent 70%)' }}
      />
      <div
        className="orb-a absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full opacity-[0.13]"
        style={{ background: 'radial-gradient(circle, oklch(0.48 0.22 265) 0%, transparent 70%)' }}
      />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  )
}

// ── Password strength ─────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null

  const checks  = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const levels = [
    { label: 'Weak',   color: 'bg-destructive' },
    { label: 'Fair',   color: 'bg-orange-500' },
    { label: 'Good',   color: 'bg-yellow-400' },
    { label: 'Strong', color: 'bg-emerald-500' },
  ]
  const { label, color } = levels[score - 1] ?? levels[0]

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(n => (
          <div
            key={n}
            className={`pw-bar flex-1 ${n <= score ? color : 'bg-border'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        score === 1 ? 'text-destructive' :
        score === 2 ? 'text-orange-500'  :
        score === 3 ? 'text-yellow-400'  : 'text-emerald-500'
      }`}>{label}</p>
    </div>
  )
}

// ── Field row helper ──────────────────────────────────────────────────────────
function Field({ label, htmlFor, icon: Icon, animClass = '', required, children }) {
  return (
    <div className={`space-y-1.5 ${animClass}`}>
      <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        {label}
        {required && <span className="text-primary">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ── Success state ─────────────────────────────────────────────────────────────
function SuccessCard() {
  return (
    <div className="auth-bg relative flex min-h-screen items-center justify-center px-4">
      <AmbientBg />
      <Card className="relative z-10 w-full max-w-sm border-border/60 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-xl anim-fade-up">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Check className="size-8 text-emerald-500" strokeWidth={2.5} />
          </div>
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-semibold tracking-tight">Workspace created!</h2>
            <p className="text-sm text-muted-foreground">
              Your admin account is ready. Redirecting to sign in…
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate()
  const logoRef  = useRef(null)

  const [form, setForm] = useState({
    companyName: '', name: '', email: '', phone: '', password: '', confirmPassword: '',
  })

  const [logoFile,    setLogoFile]    = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [showPw,      setShowPw]      = useState(false)
  const [showCPw,     setShowCPw]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const [loading,     setLoading]     = useState(false)

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    if (error) setError('')
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload a valid image file.'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    const { companyName, name, email, phone, password, confirmPassword } = form
    if (!companyName.trim())     return 'Company name is required.'
    if (!name.trim())            return 'Full name is required.'
    if (!email.trim())           return 'Email address is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.'
    if (!phone.trim())           return 'Phone number is required.'
    if (!/^\d{10}$/.test(phone)) return 'Phone must be exactly 10 digits.'
    if (!password)               return 'Password is required.'
    if (password.length < 6)    return 'Password must be at least 6 characters.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      const { companyName, name, email, phone, password, confirmPassword } = form
      await api.post('/auth/signup', { companyName, name, email, phone, password, confirmPassword })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2800)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return <SuccessCard />

  const pwMatch = form.confirmPassword && form.confirmPassword === form.password

  return (
    <div className="auth-bg relative flex min-h-screen items-center justify-center px-4 py-12">
      <AmbientBg />

      <div className="relative z-10 w-full max-w-sm anim-fade-up">

        {/* ── Brand mark ── */}
        <div className="mb-8 flex items-center justify-between anim-fade-up">
          <div className="flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5 shadow-sm shadow-primary/10">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary shadow-inner shadow-white/10">
              <CreditCard className="size-4 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight">
              Em<span className="text-primary">Pay</span>
            </span>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-primary" />
            <div className="size-2 rounded-full bg-border" />
            <div className="size-2 rounded-full bg-border" />
          </div>
        </div>

        {/* ── Card ── */}
        <Card className="border-border/60 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-5">
            <CardTitle className="text-xl font-semibold tracking-tight anim-fade-up-1">
              Create your workspace
            </CardTitle>
            <CardDescription className="anim-fade-up-1">
              Register as Admin to set up your organization
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="signup-form" onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive anim-fade-up">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Company Name + Logo upload */}
              <div className="space-y-1.5 anim-fade-up-1">
                <Label htmlFor="companyName" className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-muted-foreground" />
                  Company Name <span className="text-primary">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="companyName"
                    name="companyName"
                    value={form.companyName}
                    onChange={set('companyName')}
                    placeholder="e.g. Odoo India"
                    autoComplete="organization"
                    className="h-10 flex-1 bg-input/50 placeholder:text-muted-foreground/40"
                  />
                  {/* Logo upload */}
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => logoRef.current?.click()}
                    className="size-10 shrink-0 border-dashed border-primary/30 bg-primary/8 text-primary hover:bg-primary/15 hover:border-primary/60"
                    title="Upload company logo"
                    aria-label="Upload company logo"
                  >
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" className="size-6 rounded object-cover" />
                      : <Upload className="size-4" />
                    }
                  </Button>
                </div>
                {logoFile && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="size-3 text-emerald-500" />
                    {logoFile.name}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <Field label="Full Name" htmlFor="name" icon={User} animClass="anim-fade-up-2" required>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="John Doe"
                  autoComplete="name"
                  className="h-10 bg-input/50 placeholder:text-muted-foreground/40"
                />
              </Field>

              {/* Email */}
              <Field label="Work Email" htmlFor="email" icon={Mail} animClass="anim-fade-up-3" required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="h-10 bg-input/50 placeholder:text-muted-foreground/40"
                />
              </Field>

              {/* Phone */}
              <Field label="Phone Number" htmlFor="phone" icon={Phone} animClass="anim-fade-up-3" required>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="10-digit mobile"
                  maxLength={10}
                  autoComplete="tel"
                  className="h-10 bg-input/50 placeholder:text-muted-foreground/40"
                />
              </Field>

              {/* Password */}
              <div className="space-y-1.5 anim-fade-up-4">
                <Label htmlFor="password" className="flex items-center gap-1.5">
                  <Lock className="size-3.5 text-muted-foreground" />
                  Password <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className="h-10 bg-input/50 pr-10 placeholder:text-muted-foreground/40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? 'Hide' : 'Show'}
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                <PasswordStrength password={form.password} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5 anim-fade-up-5">
                <Label htmlFor="confirmPassword" className="flex items-center gap-1.5">
                  <Lock className="size-3.5 text-muted-foreground" />
                  Confirm Password <span className="text-primary">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showCPw ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className={`h-10 bg-input/50 pr-10 placeholder:text-muted-foreground/40 transition-colors ${
                      form.confirmPassword && !pwMatch
                        ? 'border-destructive/60 focus-visible:border-destructive/80'
                        : pwMatch
                        ? 'border-emerald-500/50 focus-visible:border-emerald-500/80'
                        : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowCPw(p => !p)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showCPw ? 'Hide' : 'Show'}
                  >
                    {showCPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
                {pwMatch && (
                  <p className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                    <Check className="size-3" strokeWidth={3} /> Passwords match
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-1 anim-fade-up-6">
                <Button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 font-semibold shadow-sm shadow-primary/30 hover:shadow-primary/40 transition-shadow"
                >
                  {loading
                    ? <><Loader2 className="mr-2 size-4 animate-spin" />Creating workspace…</>
                    : 'Create Workspace'}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-4 pt-0 anim-fade-up-6">
            <div className="flex w-full items-center gap-3">
              <Separator className="flex-1 bg-border/60" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1 bg-border/60" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                id="goto-login-link"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="mt-5 text-center text-xs text-muted-foreground/60 anim-fade-up-6">
          By creating a workspace you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  )
}
