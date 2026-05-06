import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import api from '../lib/api'

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
        // Log the resolved request URL & payload for easier debugging
        console.debug('Login request ->', api.defaults.baseURL + '/auth/login', payload)
        const { data } = await api.post('/auth/login', payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate(data.mustChangePassword ? '/change-password' : '/dashboard')
    } catch (err) {
        console.error('Login error', err)
        const msg = err.response?.data?.message ?? err.message ?? 'Invalid credentials. Please try again.'
        setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4">
      <div className="w-full max-w-[420px] space-y-6 anim-fade-up">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="grid grid-cols-2 gap-[3px] p-[9px] h-11 w-11 rounded-xl"
            style={{ background: 'oklch(0.58 0.22 292)' }}
          >
            {[0,1,2,3].map(i => <div key={i} className="rounded-[2px] bg-white" />)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Em<span style={{ color: 'oklch(0.58 0.22 292)' }}>Pay</span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">HR &amp; Payroll Management</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-5">

          {/* Heading */}
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold text-gray-900">Sign in to your account</h2>
            <p className="text-sm text-gray-500">Enter your credentials to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Identifier */}
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                Login ID or Email
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); if (error) setError('') }}
                placeholder="OIJODO20260001 or you@company.com"
                autoComplete="username"
                spellCheck={false}
                className="h-10 rounded-lg border-gray-300 bg-white text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-violet-500 focus-visible:shadow-[0_0_0_3px_oklch(0.62_0.22_292_/_12%)] transition-shadow"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
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
                  className="h-10 rounded-lg border-gray-300 bg-white pr-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-violet-500 focus-visible:shadow-[0_0_0_3px_oklch(0.62_0.22_292_/_12%)] transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="group mt-1 flex w-full h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
              style={{
                background: 'oklch(0.58 0.22 292)',
                boxShadow: '0 1px 2px oklch(0.40 0.20 292 / 30%)',
              }}
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin" />Signing in…</>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <Separator className="flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <Separator className="flex-1 bg-gray-200" />
          </div>

          {/* Sign up */}
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              id="goto-signup-link"
              className="font-semibold text-violet-600 underline-offset-4 hover:underline"
            >
              Create your workspace
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400">
          Employees receive their Login ID from their HR admin.
        </p>
      </div>
    </div>
  )
}
