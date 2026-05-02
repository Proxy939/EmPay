import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import EmployeeProfile from './pages/EmployeeProfile'
import MyProfile from './pages/MyProfile'
import ChangePassword from './pages/ChangePassword'
import Attendance from './pages/Attendance'
import Settings from './pages/Settings'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Placeholder — will be built as backend modules are done
const ComingSoon = ({ title }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'oklch(0.10 0.015 265)', color: 'oklch(0.58 0.22 292)', fontFamily: 'Geist Variable, sans-serif' }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>{title}</h1>
      <p style={{ color: 'oklch(0.58 0 0)', fontSize: '0.875rem' }}>Coming soon…</p>
    </div>
  </div>
)

// Redirects to external URL (landing page runs on a separate Next.js port)
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
        <Route path="/time-off"   element={<ProtectedRoute><ComingSoon title="Time Off" /></ProtectedRoute>} />
        <Route path="/payroll"    element={<ProtectedRoute><ComingSoon title="Payroll" /></ProtectedRoute>} />
        <Route path="/reports"    element={<ProtectedRoute><ComingSoon title="Reports" /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile"    element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />

        {/* Default redirects */}
        <Route path="/employees-list" element={<ProtectedRoute><ComingSoon title="Employees Grid" /></ProtectedRoute>} />
        <Route path="/help"    element={<ProtectedRoute><ComingSoon title="Help" /></ProtectedRoute>} />
        {/* Root → Landing page (Next.js dev server, port 4028) */}
        <Route path="/"        element={<ExternalRedirect to="http://localhost:4028" />} />
        <Route path="*"        element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
