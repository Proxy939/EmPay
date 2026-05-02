import { useState } from 'react'

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
const FONT = "'DM Sans', sans-serif"

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

// ── Day entries mock data ──────────────────────────────────────────────────────
const makeDays = (overtimeApproved) => [
  {
    id: 'today', label: 'Today', date: '',
    clockIn: '09:00 AM', clockOut: '09:12 PM', duration: '10h 12m',
    overtimeApproval: !overtimeApproved, approved: overtimeApproved,
    segments: [
      { type: 'working', start: toMin(9,0),  end: toMin(12,10) },
      { type: 'break',   start: toMin(12,10),end: toMin(13,0)  },
      { type: 'working', start: toMin(13,0), end: toMin(17,0)  },
      { type: 'overtime',start: toMin(17,0), end: toMin(19,0)  },
    ],
  },
  {
    id: 'thu18', label: 'Thursday, 18', date: '18',
    clockIn: '—', clockOut: '—', duration: '—',
    dayOff: true, approved: true,
    segments: [],
  },
  {
    id: 'wed17', label: 'Wednesday, 17', date: '17',
    clockIn: '09:00 AM', clockOut: '05:00 PM', duration: '8 hour',
    segments: [
      { type: 'working', start: toMin(9,0),  end: toMin(12,10) },
      { type: 'break',   start: toMin(12,10),end: toMin(13,0)  },
      { type: 'working', start: toMin(13,0), end: toMin(17,0)  },
    ],
  },
  {
    id: 'tue16', label: 'Tuesday, 16', date: '16',
    clockIn: '09:00 AM', clockOut: '07:12 PM', duration: '8 hour',
    segments: [
      { type: 'late',    start: toMin(9,0),  end: toMin(9,30)  },
      { type: 'working', start: toMin(9,30), end: toMin(12,10) },
      { type: 'break',   start: toMin(12,10),end: toMin(13,0)  },
      { type: 'working', start: toMin(13,0), end: toMin(19,12) },
    ],
  },
  {
    id: 'mon15', label: 'Monday, 15', date: '15',
    clockIn: '09:00 AM', clockOut: '05:00 PM', duration: '8 hour',
    segments: [
      { type: 'working', start: toMin(9,0),  end: toMin(12,10) },
      { type: 'break',   start: toMin(12,10),end: toMin(13,0)  },
      { type: 'working', start: toMin(13,0), end: toMin(17,0)  },
    ],
  },
]

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
          <span key={m} style={{ fontSize: 9, color: C.muted, fontFamily: FONT }}>{m}</span>
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
function DayEntry({ day, onApprove }) {
  return (
    <div style={{
      background: C.white, borderRadius: 10,
      border: `1px solid ${C.border}`,
      padding: '14px 16px', marginBottom: 10,
      fontFamily: FONT,
    }}>
      {/* Row 1: label + badge/actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{day.label}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {day.overtimeApproval && (
            <>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Overtime approval</span>
              <button style={{
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
const STATS = [
  { label: 'Day off',        value: 12, trend: '+12 vs last month', up: true  },
  { label: 'Late clock-in',  value: 6,  trend: '−2 vs last month',  up: false },
  { label: 'Late clock-out', value: 21, trend: '−12 vs last month', up: false },
  { label: 'No clock-out',   value: 2,  trend: '+4 vs last month',  up: true  },
  { label: 'Off time quota', value: 1,  trend: '0 vs last month',   up: null  },
  { label: 'Absent',         value: 2,  trend: '0 vs last month',   up: null  },
]

function MonthlyStats() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
      background: '#f9fafb', borderRadius: 12, overflow: 'hidden',
      border: `1px solid ${C.border}`, marginBottom: 20,
    }}>
      {STATS.map((s, i) => (
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
  employeeIndex = 0, totalEmployees = 56,
  onNext, onPrev,
}) {
  const [localIndex, setLocalIndex]         = useState(employeeIndex)
  const [overtimeApproved, setOvertimeApproved] = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const [currentMonth, setCurrentMonth]    = useState({ month: 9, year: 2025 }) // Oct 2025 (0-indexed)

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const employee = MOCK_EMPLOYEES[localIndex % MOCK_EMPLOYEES.length]
  const days     = makeDays(overtimeApproved)

  const handlePrev = () => setLocalIndex(i => Math.max(0, i - 1))
  const handleNext = () => setLocalIndex(i => Math.min(MOCK_EMPLOYEES.length - 1, i + 1))
  const prevMonth  = () => setCurrentMonth(m => m.month === 0 ? { month: 11, year: m.year - 1 } : { month: m.month - 1, year: m.year })
  const nextMonth  = () => setCurrentMonth(m => m.month === 11 ? { month: 0, year: m.year + 1 } : { month: m.month + 1, year: m.year })

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
        fontFamily: FONT,
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
            <button onClick={handlePrev} disabled={localIndex === 0} style={navCircleBtn}>‹</button>
            <button onClick={handleNext} disabled={localIndex === MOCK_EMPLOYEES.length - 1} style={navCircleBtn}>›</button>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>
              {localIndex + 1} out of {totalEmployees}
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
              <button style={{
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

          {/* ── Monthly Stats ── */}
          <MonthlyStats />

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
                    outline: 'none', fontFamily: FONT, width: 140,
                  }}
                />
              </div>
              <button style={{
                padding: '6px 12px', borderRadius: 20,
                border: `1px solid ${C.border}`, background: C.white,
                fontSize: 12, fontWeight: 500, color: C.text, cursor: 'pointer',
                fontFamily: FONT,
              }}>All Status ▼</button>
            </div>
          </div>

          {/* ── Legend ── */}
          <Legend />

          {/* ── Day Entries ── */}
          {days.map(day => (
            <DayEntry
              key={day.id}
              day={day}
              onApprove={() => setOvertimeApproved(true)}
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
