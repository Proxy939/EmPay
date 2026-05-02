import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  teal:    '#00b4d8', tealBg:  '#e0f7fc',
  green:   '#22c55e', greenBg: '#dcfce7',
  orange:  '#f97316', orangeBg:'#fff7ed',
  red:     '#ef4444', redBg:   '#fee2e2',
  yellow:  '#fbbf24', yellowBg:'#fef3c7',
  gray:    '#9ca3af', grayBg:  '#f3f4f6',
  text:    '#1a1d23', muted:   '#6b7280',
  border:  '#e5e7eb', white:   '#ffffff',
  nav:     '#1a1d23',
}

// ── Mock Employees ─────────────────────────────────────────────────────────────
const MOCK_EMPLOYEES = [
  { name: 'Arjun Mehta',    id: 'OIARM E20230001', role: 'HR Officer',       phone: '+91 98765 43210' },
  { name: 'Priya Sharma',   id: 'OIPRSH20220042',  role: 'Employee',         phone: '+91 87654 32109' },
  { name: 'Rohit Kulkarni', id: 'OIROKU20210018',  role: 'Payroll Officer',  phone: '+91 76543 21098' },
  { name: 'Sneha Patil',    id: 'OISNPA20230055',  role: 'Employee',         phone: '+91 65432 10987' },
  { name: 'Vikram Desai',   id: 'OIVIDE20220031',  role: 'HR Officer',       phone: '+91 54321 09876' },
]

// ── Timeline constants ────────────────────────────────────────────────────────
// Total span: 09:00 → 23:59 = 899 minutes
const TIMELINE_START = 9 * 60        // 540 min
const TIMELINE_END   = 23 * 60 + 59 // 1439 min
const TOTAL_MINS     = TIMELINE_END - TIMELINE_START // 899

const toMin = (h, m) => h * 60 + m
const pct   = (mins) => `${(mins / TOTAL_MINS) * 100}%`

const fmtMin = (totalMin) => {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}

// ── Helpers to build real segments from HH:MM strings ──────────────────────────
function timeStrToMin(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function to12(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`
}
function fmtDuration(h) {
  if (!h || h <= 0) return '—'
  const hrs = Math.floor(h), mins = Math.round((h - hrs) * 60)
  return `${hrs}h${mins > 0 ? ' ' + mins + 'm' : ''}`
}
function buildSegments(checkIn, checkOut, stdHours = 8) {
  const inMin  = timeStrToMin(checkIn)
  const outMin = timeStrToMin(checkOut)
  if (!inMin) return []
  const end = outMin || inMin + stdHours * 60
  const stdEnd = inMin + stdHours * 60
  const segs = []
  if (end <= stdEnd) {
    segs.push({ type: 'working', start: inMin, end })
  } else {
    segs.push({ type: 'working', start: inMin, end: stdEnd })
    segs.push({ type: 'overtime', start: stdEnd, end })
  }
  return segs
}
function recordToDay(rec) {
  const dateObj = new Date(rec.date)
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const isToday = new Date().toDateString() === dateObj.toDateString()
  const label = isToday
    ? 'Today'
    : `${days[dateObj.getUTCDay()]}, ${dateObj.getUTCDate()} ${months[dateObj.getUTCMonth()]}`
  const dayOff = rec.status === 'ON_LEAVE'
  const absent = rec.status === 'ABSENT' && !rec.checkIn
  return {
    id:               rec.id,
    label,
    clockIn:          rec.checkIn  ? to12(rec.checkIn)  : '—',
    clockOut:         rec.checkOut ? to12(rec.checkOut) : '—',
    duration:         fmtDuration(rec.workingHours),
    segments:         dayOff || absent ? [] : buildSegments(rec.checkIn, rec.checkOut),
    dayOff,
    absent,
    overtimeApproval: (rec.extraHours > 0) && !rec.overtimeApproved,
    approved:         rec.overtimeApproved || (!rec.extraHours && !dayOff && !absent && !!rec.checkIn),
    extraHours:       rec.extraHours,
    _recordId:        rec.id,
  }
}

const SEG_STYLE = {
  working:  { bg: C.teal,   label: 'Working time' },
  break:    { bg: C.gray,   label: 'Break'        },
  overtime: { bg: C.orange, label: 'Over time'    },
  late:     { bg: C.yellow, label: 'Late'         },
}

const TIME_MARKERS = ['09:00','11:00','13:00','15:00','17:00','19:00','21:00','23:59']

// ── Avatar ─────────────────────────────────────────────────────────────────────
const AVT_COLORS = ['#6C5CE7','#0984e3','#00b894','#e17055','#fdcb6e','#fd79a8','#00b4d8','#a29bfe']
const avColor = (name) => AVT_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1)||0)) % AVT_COLORS.length]

function Avatar({ name, size = 80 }) {
  const parts = name.trim().split(' ')
  const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: avColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.3, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

// ── Timeline Segment ──────────────────────────────────────────────────────────
function TimelineSegment({ seg }) {
  const [hovered, setHovered] = useState(false)
  const style  = SEG_STYLE[seg.type]
  const mins   = seg.end - seg.start
  const width  = pct(mins)
  const startH = Math.floor(seg.start / 60).toString().padStart(2,'0')
  const startM = (seg.start % 60).toString().padStart(2,'0')
  const endH   = Math.floor(seg.end / 60).toString().padStart(2,'0')
  const endM   = (seg.end % 60).toString().padStart(2,'0')
  const label  = style.label
  const dur    = fmtMin(mins)

  return (
    <div
      style={{ width, height: '100%', position: 'relative', flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: '100%', height: '100%',
        background: style.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {mins > 60 && (
          <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', padding: '0 4px' }}>
            {label}
          </span>
        )}
      </div>
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#111827', color: '#fff',
          borderRadius: 8, padding: '6px 10px',
          fontSize: 11, whiteSpace: 'nowrap', zIndex: 50,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
          <div style={{ color: '#d1d5db' }}>{startH}:{startM} – {endH}:{endM} ({dur})</div>
          {/* Caret */}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #111827',
          }} />
        </div>
      )}
    </div>
  )
}

// ── Timeline Bar ──────────────────────────────────────────────────────────────
function TimelineBar({ segments, dayOff }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      {/* Time markers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 2 }}>
        {TIME_MARKERS.map(m => (
          <span key={m} style={{ fontSize: 9, color: C.muted, fontFamily: 'inherit' }}>{m}</span>
        ))}
      </div>

      {/* Bar track */}
      <div style={{
        height: 32, borderRadius: 6, overflow: 'visible',
        background: '#f3f4f6', display: 'flex', position: 'relative',
      }}>
        {dayOff ? (
          <div style={{
            width: '100%', height: '100%', borderRadius: 6,
            background: '#fef3c7',
            border: '2px dashed #f59e0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>Requested day off</span>
          </div>
        ) : (
          <>
            {/* Leading gap before first segment */}
            {segments.length > 0 && segments[0].start > TIMELINE_START && (
              <div style={{ width: pct(segments[0].start - TIMELINE_START), flexShrink: 0 }} />
            )}
            {segments.map((seg, i) => (
              <TimelineSegment key={i} seg={seg} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ── Day Entry ─────────────────────────────────────────────────────────────────
function DayEntry({ day, onApprove, onReject }) {
  return (
    <div style={{
      background: C.white, borderRadius: 10,
      border: `1px solid ${C.border}`,
      padding: '14px 16px', marginBottom: 10,
      fontFamily: 'inherit',
    }}>
      {/* Row 1: label + badge/actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{day.label}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {day.overtimeApproval && (
            <>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Overtime approval</span>
              <button onClick={onReject} style={{
                padding: '4px 10px', borderRadius: 6,
                border: `1px solid ${C.red}`, background: 'transparent',
                color: C.red, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>✕</button>
              <button onClick={onApprove} style={{
                padding: '4px 12px', borderRadius: 6,
                border: 'none', background: C.green,
                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>✓ Approve</button>
            </>
          )}
          {day.approved && !day.overtimeApproval && (
            <span style={{
              background: C.greenBg, color: C.green,
              borderRadius: 20, padding: '3px 12px',
              fontSize: 11, fontWeight: 700,
            }}>✅ Approved</span>
          )}
        </div>
      </div>

      {/* Row 2: clock-in | timeline | clock-out | duration */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Clock-in */}
        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 60 }}>
          <p style={{ margin: 0, fontSize: 9, color: C.muted, marginBottom: 2 }}>Clock-in</p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: day.clockIn === '—' ? C.muted : C.text }}>
            {day.clockIn}
          </p>
        </div>

        {/* Timeline */}
        <TimelineBar segments={day.segments} dayOff={day.dayOff} />

        {/* Clock-out */}
        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 60 }}>
          <p style={{ margin: 0, fontSize: 9, color: C.muted, marginBottom: 2 }}>Clock-out</p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: day.clockOut === '—' ? C.muted : C.text }}>
            {day.clockOut}
          </p>
        </div>

        {/* Duration */}
        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 56 }}>
          <p style={{ margin: 0, fontSize: 9, color: C.muted, marginBottom: 2 }}>Duration</p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: day.duration === '—' ? C.muted : C.teal }}>
            {day.duration}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Monthly Stats ─────────────────────────────────────────────────────────────
function MonthlyStats({ stats }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
      background: '#f9fafb', borderRadius: 12, overflow: 'hidden',
      border: `1px solid ${C.border}`, marginBottom: 20,
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: '14px 10px', textAlign: 'center',
          borderRight: i < 5 ? `1px solid ${C.border}` : 'none',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: C.muted, fontWeight: 500 }}>{s.label}</p>
          <p style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: C.text }}>{s.value}</p>
          <p style={{
            margin: 0, fontSize: 10, fontWeight: 600,
            color: s.up === null ? C.muted : s.up ? C.green : C.red,
          }}>{s.trend}</p>
        </div>
      ))}
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  const items = [
    { color: C.teal,   label: 'Working time' },
    { color: C.gray,   label: 'Break'        },
    { color: C.orange, label: 'Over time'    },
    { color: C.yellow, label: 'Late'         },
  ]
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
      {items.map(it => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: it.color }} />
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{it.label}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#fef3c7', border: '1px dashed #f59e0b' }} />
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Day off</span>
      </div>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AttendanceDetailModal({
  isOpen, onClose,
  employeeIndex = 0, totalEmployees = 1,
  employee: employeeProp = null,
  employeeId: employeeIdProp = null,
  onNext, onPrev,
}) {
  const navigate = useNavigate()
  const [overtimeStates, setOvertimeStates] = useState({}) // recordId -> true/false
  const [searchQuery,    setSearchQuery]    = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [currentMonth,   setCurrentMonth]   = useState({ month: new Date().getMonth(), year: new Date().getFullYear() })
  const [records,        setRecords]        = useState([])
  const [summary,        setSummary]        = useState({})
  const [loading,        setLoading]        = useState(false)

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const employee = employeeProp || MOCK_EMPLOYEES[0]
  const employeeId = employeeIdProp || employee?.id

  // Fetch real monthly data when modal opens or month changes
  useEffect(() => {
    if (!isOpen || !employeeId) return
    setLoading(true)
    api.get(`/attendance/employee/${employeeId}?month=${currentMonth.month + 1}&year=${currentMonth.year}`)
      .then(r => {
        setRecords(r.data.records || [])
        setSummary(r.data.summary || {})
        // Seed overtimeStates from fetched data
        const states = {}
        ;(r.data.records || []).forEach(rec => { states[rec.id] = rec.overtimeApproved })
        setOvertimeStates(states)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen, employeeId, currentMonth.month, currentMonth.year])

  // Approve / reject overtime via API
  const handleOvertime = async (recordId, approve) => {
    try {
      await api.patch(`/attendance/${recordId}/overtime`, { approved: approve })
      setOvertimeStates(s => ({ ...s, [recordId]: approve }))
    } catch {}
  }

  const prevMonth = () => setCurrentMonth(m => m.month === 0  ? { month: 11, year: m.year - 1 } : { month: m.month - 1, year: m.year })
  const nextMonth = () => setCurrentMonth(m => m.month === 11 ? { month: 0,  year: m.year + 1 } : { month: m.month + 1, year: m.year })

  // Build day entries from real records, apply overtime state overrides
  const days = records
    .map(rec => {
      const d = recordToDay(rec)
      const approved = overtimeStates[rec.id] ?? rec.overtimeApproved
      return {
        ...d,
        overtimeApproval: (rec.extraHours > 0) && !approved,
        approved: approved || (!rec.extraHours && !d.dayOff && !d.absent && !!rec.checkIn),
      }
    })
    .filter(d => {
      const matchSearch = !searchQuery || d.label.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = !statusFilter ||
        (statusFilter === 'Present' && !d.dayOff && !d.absent && d.clockIn !== '—') ||
        (statusFilter === 'Absent'  && d.absent) ||
        (statusFilter === 'Leave'   && d.dayOff) ||
        (statusFilter === 'Overtime' && (d.extraHours > 0))
      return matchSearch && matchStatus
    })

  // Real computed stats
  const stats = [
    { label: 'Days Present',   value: summary.daysPresent    ?? 0, trend: 'This month', up: null },
    { label: 'Overtime days',  value: summary.overtimeCount  ?? 0, trend: 'With extra hours', up: null },
    { label: 'Leaves',         value: summary.leavesCount    ?? 0, trend: 'Approved leaves', up: null },
    { label: 'No clock-out',   value: records.filter(r => r.checkIn && !r.checkOut).length, trend: 'Missing checkout', up: null },
    { label: 'Absent',         value: records.filter(r => r.status === 'ABSENT').length, trend: 'No show', up: null },
    { label: 'Working Days',   value: summary.totalWorkingDays ?? 0, trend: 'Mon–Fri', up: null },
  ]

  if (!isOpen) return null

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        fontFamily: 'inherit',
      }}
    >
      {/* Modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.white, borderRadius: 16,
          width: '100%', maxWidth: 860,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Top bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', background: '#f9fafb',
          borderBottom: `1px solid ${C.border}`, borderRadius: '16px 16px 0 0',
          flexShrink: 0,
        }}>
          {/* Prev / Next + counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onPrev} disabled={employeeIndex === 0} style={navCircleBtn}>‹</button>
            <button onClick={onNext} disabled={employeeIndex === totalEmployees - 1} style={navCircleBtn}>›</button>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>
              {employeeIndex + 1} out of {totalEmployees}
            </span>
          </div>

          {/* Close */}
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: '50%',
            border: `1px solid ${C.border}`, background: 'transparent',
            cursor: 'pointer', fontSize: 16, color: C.muted, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>

          {/* ── Employee Header ── */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: 20,
            gap: 16,
          }}>
            {/* Left: avatar + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar name={employee.name} size={80} />
              <div>
                <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: C.text }}>
                  {employee.name}
                </h2>
                <div style={{ display: 'flex', gap: 28 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: C.muted }}>Role</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{employee.role}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: C.muted }}>Employee ID</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.teal }}>{employee.id}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: C.muted }}>Phone Number</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{employee.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button onClick={() => employeeId && navigate(`/employees/${employeeId}`)} style={{
                padding: '8px 14px', borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.white,
                color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>📋 View Details</button>
              <button style={{
                padding: '8px 14px', borderRadius: 8,
                border: 'none', background: C.teal,
                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: '0 2px 8px rgba(0,180,216,0.3)',
              }}>👤 Add Attendance</button>
              <button style={{
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.white,
                cursor: 'pointer', fontSize: 18, color: C.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>···</button>
            </div>
          </div>

          {/* Monthly Stats - real data */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: C.muted, fontSize: 13 }}>Loading attendance data…</div>
          ) : (
            <MonthlyStats stats={stats} />
          )}

          {/* ── Calendar Section Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>
                {MONTHS[currentMonth.month]} {currentMonth.year}
              </h3>
              <button onClick={prevMonth} style={navCircleBtn}>‹</button>
              <button onClick={nextMonth} style={navCircleBtn}>›</button>
            </div>

            {/* Search + filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 12, color: C.muted, pointerEvents: 'none',
                }}>🔍</span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  style={{
                    height: 32, paddingLeft: 28, paddingRight: 10,
                    borderRadius: 8, border: `1px solid ${C.border}`,
                    background: '#f9fafb', fontSize: 12, color: C.text,
                    outline: 'none', fontFamily: 'inherit', width: 140,
                  }}
                />
              </div>
              <button style={{
                padding: '6px 12px', borderRadius: 20,
                border: `1px solid ${C.border}`, background: C.white,
                fontSize: 12, fontWeight: 500, color: C.text, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>All Status ▼</button>
            </div>
          </div>

          {/* ── Legend ── */}
          <Legend />

          {/* Day Entries - real data with real approve/reject */}
          {loading ? null : days.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: C.muted, fontSize: 13 }}>No records for this month.</div>
          ) : days.map(day => (
            <DayEntry
              key={day.id}
              day={day}
              onApprove={() => handleOvertime(day._recordId, true)}
              onReject={()  => handleOvertime(day._recordId, false)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Shared button style ───────────────────────────────────────────────────────
const navCircleBtn = {
  width: 28, height: 28, borderRadius: '50%',
  border: `1px solid #e5e7eb`, background: '#ffffff',
  cursor: 'pointer', fontSize: 14, color: '#6b7280',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, lineHeight: 1,
}
