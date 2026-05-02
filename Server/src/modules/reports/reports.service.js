// src/modules/reports/reports.service.js
const { prisma }  = require('../../config/prisma')
const { workingDaysInMonth, monthName } = require('../../utils/dateHelpers')

// ─── Salary Statement ─────────────────────────────────────────────────────────
// Per employee, per year — 12 monthly rows + yearly totals

async function getSalaryStatement(employeeId, year) {
  if (!employeeId || !year) throw { status: 400, message: 'employeeId and year are required' }
  const yr = parseInt(year)

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: { select: { loginId: true } } },
  })
  if (!employee) throw { status: 404, message: 'Employee not found' }

  const monthly = []

  for (let m = 1; m <= 12; m++) {
    const start = new Date(yr, m - 1, 1)
    const end   = new Date(yr, m, 0)

    // Find payslip for this month
    const payslip = await prisma.payslip.findFirst({
      where: {
        employeeId,
        periodStart: { gte: start, lte: end },
      },
    })

    const comp = payslip
      ? (typeof payslip.components === 'string' ? JSON.parse(payslip.components) : payslip.components)
      : {}

    monthly.push({
      month:          monthName(m),
      monthNum:       m,
      workedDays:     payslip?.workedDays       ?? 0,
      paidLeaveDays:  payslip?.paidLeaveDays    ?? 0,
      basicSalary:    comp.basicSalary           ?? 0,
      hra:            comp.hra                   ?? 0,
      standardAllow:  comp.standardAllowance     ?? 0,
      perfBonus:      comp.performanceBonus      ?? 0,
      lta:            comp.lta                   ?? 0,
      fixedAllow:     comp.fixedAllowance        ?? 0,
      grossAmount:    payslip?.grossAmount       ?? 0,
      pfEmployee:     payslip?.pfEmployee        ?? 0,
      professionalTax:payslip?.professionalTax   ?? 0,
      tds:            payslip?.tdsDeduction      ?? 0,
      totalDeductions:(payslip?.pfEmployee ?? 0) + (payslip?.professionalTax ?? 0) + (payslip?.tdsDeduction ?? 0),
      netAmount:      payslip?.netAmount         ?? 0,
      status:         payslip?.status            ?? null,
    })
  }

  // Yearly totals
  const yearly = {
    totalWorkedDays:  monthly.reduce((a, m) => a + m.workedDays, 0),
    totalGross:       monthly.reduce((a, m) => a + m.grossAmount, 0),
    totalDeductions:  monthly.reduce((a, m) => a + m.totalDeductions, 0),
    totalNet:         monthly.reduce((a, m) => a + m.netAmount, 0),
  }

  // Component yearly sums
  const components = [
    { name: 'Basic Salary',        monthlyAvg: yearly.totalGross / 12, yearlyAmount: monthly.reduce((a, m) => a + m.basicSalary, 0) },
    { name: 'HRA',                 monthlyAvg: 0,                      yearlyAmount: monthly.reduce((a, m) => a + m.hra, 0) },
    { name: 'Standard Allowance',  monthlyAvg: 0,                      yearlyAmount: monthly.reduce((a, m) => a + m.standardAllow, 0) },
    { name: 'Performance Bonus',   monthlyAvg: 0,                      yearlyAmount: monthly.reduce((a, m) => a + m.perfBonus, 0) },
    { name: 'LTA',                 monthlyAvg: 0,                      yearlyAmount: monthly.reduce((a, m) => a + m.lta, 0) },
    { name: 'Fixed Allowance',     monthlyAvg: 0,                      yearlyAmount: monthly.reduce((a, m) => a + m.fixedAllow, 0) },
  ]

  const deductions = [
    { name: 'PF (Employee)',     yearlyAmount: monthly.reduce((a, m) => a + m.pfEmployee, 0) },
    { name: 'Professional Tax',  yearlyAmount: monthly.reduce((a, m) => a + m.professionalTax, 0) },
    { name: 'TDS',               yearlyAmount: monthly.reduce((a, m) => a + m.tds, 0) },
  ]

  return {
    employee: {
      id:          employee.id,
      name:        `${employee.firstName} ${employee.lastName}`,
      loginId:     employee.user?.loginId,
      designation: employee.designation,
      department:  employee.department,
      joinDate:    employee.joinDate,
    },
    year: yr,
    components,
    deductions,
    monthly,
    yearly,
  }
}

// ─── Payroll Summary ──────────────────────────────────────────────────────────
// All employees for a given month/year

async function getPayrollSummary(month, year) {
  if (!month || !year) throw { status: 400, message: 'month and year are required' }
  const m = parseInt(month), yr = parseInt(year)
  const start = new Date(yr, m - 1, 1)
  const end   = new Date(yr, m, 0)

  const payslips = await prisma.payslip.findMany({
    where: { periodStart: { gte: start, lte: end } },
    include: {
      employee: {
        select: {
          id: true, firstName: true, lastName: true,
          department: true, designation: true,
          user: { select: { loginId: true } },
        },
      },
    },
    orderBy: { employee: { firstName: 'asc' } },
  })

  const rows = payslips.map(ps => ({
    employeeId:  ps.employeeId,
    name:        `${ps.employee.firstName} ${ps.employee.lastName}`,
    loginId:     ps.employee.user?.loginId,
    department:  ps.employee.department,
    designation: ps.employee.designation,
    grossAmount: ps.grossAmount,
    deductions:  ps.pfEmployee + ps.professionalTax + ps.tdsDeduction,
    netAmount:   ps.netAmount,
    employerCost:ps.employerCost,
    status:      ps.status,
  }))

  const totals = {
    grossAmount:  rows.reduce((a, r) => a + r.grossAmount, 0),
    deductions:   rows.reduce((a, r) => a + r.deductions, 0),
    netAmount:    rows.reduce((a, r) => a + r.netAmount, 0),
    employerCost: rows.reduce((a, r) => a + r.employerCost, 0),
    count:        rows.length,
  }

  return { month: monthName(m), year: yr, rows, totals }
}

// ─── Leaves Report ────────────────────────────────────────────────────────────

async function getLeavesReport({ month, year, employeeId } = {}) {
  const where = {}
  if (employeeId) where.employeeId = employeeId

  if (month && year) {
    const m = parseInt(month), yr = parseInt(year)
    const start = new Date(yr, m - 1, 1)
    const end   = new Date(yr, m, 0)
    where.AND = [{ startDate: { lte: end } }, { endDate: { gte: start } }]
  } else if (year) {
    where.AND = [
      { startDate: { gte: new Date(`${year}-01-01`) } },
      { endDate:   { lte: new Date(`${year}-12-31`) } },
    ]
  }

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true,
          user: { select: { loginId: true } } },
      },
    },
    orderBy: { startDate: 'desc' },
  })

  // Group by leaveType with subtotals
  const grouped = {}
  for (const r of requests) {
    const type = r.leaveType
    if (!grouped[type]) grouped[type] = { leaveType: type, records: [], totalDays: 0 }
    grouped[type].records.push({
      employeeId: r.employeeId,
      name:       `${r.employee.firstName} ${r.employee.lastName}`,
      loginId:    r.employee.user?.loginId,
      startDate:  r.startDate,
      endDate:    r.endDate,
      totalDays:  r.totalDays,
      status:     r.status,
      reason:     r.reason,
    })
    grouped[type].totalDays += r.totalDays
  }

  return Object.values(grouped)
}

// ─── Attendance Report ────────────────────────────────────────────────────────

async function getAttendanceReport({ month, year, employeeId } = {}) {
  if (!month || !year) throw { status: 400, message: 'month and year are required' }
  const m = parseInt(month), yr = parseInt(year)
  const start = new Date(Date.UTC(yr, m - 1, 1))
  const end   = new Date(Date.UTC(yr, m, 0))

  const whereEmp = employeeId ? { id: employeeId } : {}
  const employees = await prisma.employee.findMany({
    where:   { ...whereEmp, user: { isActive: true } },
    include: { user: { select: { loginId: true } } },
  })

  const report = []
  const LATE_CUTOFF  = 9   // 09:00
  const EARLY_CUTOFF = 18  // 18:00

  for (const emp of employees) {
    const records = await prisma.attendance.findMany({
      where:   { employeeId: emp.id, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    })

    const totalPresent    = records.filter(r => ['PRESENT', 'HALF_DAY'].includes(r.status)).length
    const totalAbsent     = records.filter(r => r.status === 'ABSENT').length
    const totalOnLeave    = records.filter(r => r.status === 'ON_LEAVE').length
    const totalExtraHours = records.reduce((a, r) => a + (r.extraHours || 0), 0)

    const totalLateCheckIns = records.filter(r => {
      if (!r.checkIn) return false
      return new Date(r.checkIn).getHours() >= LATE_CUTOFF
    }).length

    const totalEarlyCheckOuts = records.filter(r => {
      if (!r.checkOut) return false
      return new Date(r.checkOut).getHours() < EARLY_CUTOFF
    }).length

    report.push({
      employeeId:       emp.id,
      name:             `${emp.firstName} ${emp.lastName}`,
      loginId:          emp.user?.loginId,
      totalPresent,
      totalAbsent,
      totalOnLeave,
      totalLateCheckIns,
      totalEarlyCheckOuts,
      totalExtraHours:  Math.round(totalExtraHours * 100) / 100,
      totalWorkingDays: workingDaysInMonth(m, yr),
      records: records.map(r => ({
        date:         r.date,
        checkIn:      r.checkIn  ? new Date(r.checkIn).toTimeString().slice(0, 5)  : null,
        checkOut:     r.checkOut ? new Date(r.checkOut).toTimeString().slice(0, 5) : null,
        status:       r.status,
        extraHours:   r.extraHours,
        workingHours: r.workingHours,
      })),
    })
  }

  return { month: monthName(m), year: yr, report }
}

module.exports = { getSalaryStatement, getPayrollSummary, getLeavesReport, getAttendanceReport }
