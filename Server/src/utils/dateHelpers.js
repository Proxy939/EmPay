// src/utils/dateHelpers.js

/**
 * Count working days (Mon–Fri) between two dates, inclusive.
 * @param {Date|string} start
 * @param {Date|string} end
 */
function countWorkingDays(start, end) {
  const s = new Date(start), e = new Date(end)
  s.setHours(0,0,0,0); e.setHours(0,0,0,0)
  let count = 0
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/**
 * Get all working day Date objects in a range, inclusive.
 * @param {Date|string} start
 * @param {Date|string} end
 * @returns {Date[]}
 */
function getWorkingDays(start, end) {
  const s = new Date(start), e = new Date(end)
  s.setHours(0,0,0,0); e.setHours(0,0,0,0)
  const days = []
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

/**
 * Total working days (Mon–Fri) in a given month/year.
 * @param {number} month  1-based (1=Jan)
 * @param {number} year
 */
function workingDaysInMonth(month, year) {
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 0)       // last day of month
  return countWorkingDays(start, end)
}

/** Month name from 1-based month number */
function monthName(month) {
  return ['January','February','March','April','May','June',
          'July','August','September','October','November','December'][month - 1] || ''
}

/**
 * Midnight UTC for a date (or today)
 * @param {Date|string} [date]
 */
function toUTCDay(date) {
  const d = date ? new Date(date) : new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

module.exports = { countWorkingDays, getWorkingDays, workingDaysInMonth, monthName, toUTCDay }
