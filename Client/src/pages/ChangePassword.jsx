import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import api from '@/lib/api'

function TInput({ C, type='text', value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div style={{ position:'relative' }}>
      <input
        id={id}
        type={isPassword && !show ? 'password' : 'text'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
        style={{
          width:'100%', boxSizing:'border-box',
          height:42, padding:'0 42px 0 14px',
          borderRadius:10, border:`1.5px solid ${C.border}`,
          background:C.inputBg, color:C.text,
          fontSize:14, outline:'none', fontFamily:'inherit',
        }}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow(s => !s)}
          style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
            background:'transparent', border:'none', cursor:'pointer', padding:0 }}>
          {show ? <EyeOff size={16} color={C.muted}/> : <Eye size={16} color={C.muted}/>}
        </button>
      )}
    </div>
  )
}

export default function ChangePassword() {
  const { colors: C } = useTheme()
  const navigate      = useNavigate()

  const [oldPw,     setOldPw]     = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!oldPw || !newPw || !confirmPw) { setError('All fields are required.'); return }
    if (newPw.length < 6)               { setError('New password must be at least 6 characters.'); return }
    if (newPw !== confirmPw)            { setError('New passwords do not match.'); return }
    if (newPw === oldPw)                { setError('New password must differ from the temporary one.'); return }

    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        oldPassword:        oldPw,
        newPassword:        newPw,
        confirmNewPassword: confirmPw,
      })
      // Update local user record to clear mustChangePassword
      const updated = { ...user, mustChangePassword: false }
      localStorage.setItem('user', JSON.stringify(updated))
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 1800)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background: C.bg, fontFamily:"'Geist Variable','Inter',sans-serif", padding:24,
    }}>
      <div style={{
        width:'100%', maxWidth:420,
        background:C.card, borderRadius:20,
        border:`1px solid ${C.border}`, boxShadow:C.shadow,
        padding:36,
      }}>
        {/* Icon header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:56, height:56, borderRadius:16, background:C.accentL,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px',
          }}>
            <KeyRound size={26} color={C.accent} strokeWidth={2} />
          </div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:C.text }}>
            Set Your Password
          </h1>
          <p style={{ margin:'6px 0 0', fontSize:13, color:C.muted }}>
            Welcome, <strong style={{ color:C.text }}>{user?.name?.split(' ')[0] || 'there'}</strong>!
            Your account was given a temporary password.
            Please set a new one to continue.
          </p>
        </div>

        {done ? (
          /* Success state */
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:12,
            padding:'24px 0', textAlign:'center',
          }}>
            <div style={{
              width:52, height:52, borderRadius:'50%', background:`${C.green}20`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <ShieldCheck size={26} color={C.green} />
            </div>
            <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.green }}>Password changed!</p>
            <p style={{ margin:0, fontSize:13, color:C.muted }}>Redirecting to dashboard…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Error banner */}
            {error && (
              <div style={{
                display:'flex', alignItems:'center', gap:8, borderRadius:10,
                border:`1px solid ${C.red}40`, background:`${C.red}12`, padding:'10px 12px',
              }}>
                <AlertCircle size={14} color={C.red} style={{ flexShrink:0 }} />
                <span style={{ fontSize:13, color:C.red }}>{error}</span>
              </div>
            )}

            {/* Temporary password */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label htmlFor="oldPw" style={{ fontSize:12, fontWeight:600, color:C.muted }}>
                Temporary Password (current)
              </label>
              <TInput C={C} id="oldPw" type="password"
                value={oldPw} onChange={e => setOldPw(e.target.value)}
                placeholder="Enter the password you were given" />
            </div>

            {/* New password */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label htmlFor="newPw" style={{ fontSize:12, fontWeight:600, color:C.muted }}>
                New Password
              </label>
              <TInput C={C} id="newPw" type="password"
                value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 6 characters" />
            </div>

            {/* Confirm password */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label htmlFor="confirmPw" style={{ fontSize:12, fontWeight:600, color:C.muted }}>
                Confirm New Password
              </label>
              <TInput C={C} id="confirmPw" type="password"
                value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Re-enter your new password" />
            </div>

            {/* Strength hint */}
            {newPw && (
              <div style={{ display:'flex', gap:4 }}>
                {[1,2,3,4].map(i => {
                  const strength = newPw.length < 6 ? 0 : newPw.length < 8 ? 1 :
                    /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 3 : 2
                  return (
                    <div key={i} style={{
                      flex:1, height:3, borderRadius:4,
                      background: i <= strength
                        ? (strength >= 3 ? C.green : strength >= 2 ? C.amber : C.red)
                        : C.border,
                      transition:'all .3s',
                    }} />
                  )
                })}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop:4, width:'100%', height:44, borderRadius:12,
                border:'none', background:C.accent, color:'white',
                fontWeight:700, fontSize:15, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, display:'flex', alignItems:'center',
                justifyContent:'center', gap:8, transition:'opacity .2s',
              }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Saving…</>
                : 'Set New Password →'
              }
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
