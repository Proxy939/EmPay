import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'

// Placeholder pages (to be built)
const Dashboard = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080b14', color: '#a78bfa', fontFamily: 'Inter, sans-serif' }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ color: '#4b5563' }}>Coming soon…</p>
    </div>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* App routes (protected — to be gated later) */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Default redirect */}
        <Route path="/"  element={<Navigate to="/login" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
