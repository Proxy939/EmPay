import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CreditCard, AlertCircle, Loader2 } from 'lucide-react'
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

// ── Ambient background orbs ───────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* top-left violet */}
      <div
        className="orb-a absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-[0.18]"
        style={{ background: 'radial-gradient(circle, oklch(0.55 0.25 292) 0%, transparent 70%)' }}
      />
      {/* bottom-right indigo */}
      <div
        className="orb-b absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-[0.13]"
        style={{ background: 'radial-gradient(circle, oklch(0.48 0.22 265) 0%, transparent 70%)' }}
      />
      {/* noise texture */}
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

export default function Login() {
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim() || !password) {
      setError('Both fields are required.')
      return
    }

    setLoading(true)
    try {
      const payload = identifier.includes('@')
        ? { email: identifier.trim(), password }
        : { loginId: identifier.trim().toUpperCase(), password }

      const { data } = await api.post('/auth/login', payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      navigate(data.mustChangePassword ? '/change-password' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg relative flex min-h-screen items-center justify-center px-4">
      <AmbientBg />

      <div className="relative z-10 w-full max-w-sm anim-fade-up">

        {/* ── Brand mark ── */}
        <div className="mb-8 flex justify-center anim-fade-up">
          <div className="flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5 shadow-sm shadow-primary/10">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary shadow-inner shadow-white/10">
              <CreditCard className="size-4 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Em<span className="text-primary">Pay</span>
            </span>
          </div>
        </div>

        {/* ── Card ── */}
        <Card className="border-border/60 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-5">
            <CardTitle className="text-xl font-semibold tracking-tight anim-fade-up-1">
              Welcome back
            </CardTitle>
            <CardDescription className="anim-fade-up-1">
              Sign in with your Login ID or email address
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Error banner */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive anim-fade-up">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login ID / Email */}
              <div className="space-y-1.5 anim-fade-up-2">
                <Label htmlFor="identifier">
                  Login ID&nbsp;<span className="text-muted-foreground font-normal">or</span>&nbsp;Email
                </Label>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); if (error) setError('') }}
                  placeholder="OIJODO20260001  or  you@company.com"
                  autoComplete="username"
                  spellCheck={false}
                  className="h-10 bg-input/50 placeholder:text-muted-foreground/40"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5 anim-fade-up-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (error) setError('') }}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    className="h-10 bg-input/50 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-1 anim-fade-up-4">
                <Button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 font-semibold shadow-sm shadow-primary/30 hover:shadow-primary/40 transition-shadow"
                >
                  {loading
                    ? <><Loader2 className="mr-2 size-4 animate-spin" />Signing in…</>
                    : 'Sign In'}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-4 pt-0 anim-fade-up-5">
            <div className="flex w-full items-center gap-3">
              <Separator className="flex-1 bg-border/60" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1 bg-border/60" />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                id="goto-signup-link"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create your workspace
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Helper note */}
        <p className="mt-5 text-center text-xs text-muted-foreground/60 anim-fade-up-6">
          Employees receive their Login ID from their HR admin.
        </p>
      </div>
    </div>
  )
}
