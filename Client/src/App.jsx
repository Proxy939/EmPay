import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import EmployeeProfile from './pages/EmployeeProfile'
import MyProfile from './pages/MyProfile'
import ChangePassword from './pages/ChangePassword'
import Attendance from './pages/Attendance'
import Settings from './pages/Settings'
import Payroll from './pages/Payroll'
import Reports from './pages/Reports'
import TimeOff from './pages/TimeOff'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Role constants
const ADMIN_ONLY         = ['ADMIN']
const PAYROLL_ROLES      = ['ADMIN', 'PAYROLL_OFFICER']
const ALL_STAFF          = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE']

// Placeholder — will be built as backend modules are done
const ComingSoon = ({ title }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'oklch(0.10 0.015 265)', color: 'oklch(0.58 0.22 292)', fontFamily: 'Geist Variable, sans-serif' }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>{title}</h1>
      <p style={{ color: 'oklch(0.58 0 0)', fontSize: '0.875rem' }}>Coming soon…</p>
    </div>
  </div>
)

// Redirect to external landing page
const ExternalRedirect = ({ to }) => {
  useEffect(() => { window.location.replace(to) }, [to])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route path="/dashboard"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/change-password"  element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/employees/:id"    element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/time-off"   element={<ProtectedRoute><TimeOff /></ProtectedRoute>} />
        <Route path="/payroll"    element={<ProtectedRoute roles={PAYROLL_ROLES}><Payroll /></ProtectedRoute>} />
        <Route path="/reports"    element={<ProtectedRoute roles={PAYROLL_ROLES}><Reports /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute roles={ADMIN_ONLY}><Settings /></ProtectedRoute>} />
        <Route path="/profile"    element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />

        {/* Default redirects */}
        <Route path="/employees-list" element={<ProtectedRoute><ComingSoon title="Employees Grid" /></ProtectedRoute>} />
        <Route path="/help"    element={<ProtectedRoute><ComingSoon title="Help" /></ProtectedRoute>} />
        {/* Root → Landing page (env-driven) → Get Started → /login */}
        <Route path="/"  element={
          import.meta.env.VITE_LANDING_URL
            ? <ExternalRedirect to={import.meta.env.VITE_LANDING_URL} />
            : <Navigate to="/login" replace />
        } />
        <Route path="*"  element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
