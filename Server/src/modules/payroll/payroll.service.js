// src/modules/payroll/payroll.service.js
const { prisma }  = require('../../config/prisma')
const { calculateSalaryComponents } = require('../../utils/payrollHelpers')
const { workingDaysInMonth, monthName, toUTCDay } = require('../../utils/dateHelpers')

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Sum a field across an array */
const sum = (arr, key) => arr.reduce((a, b) => a + (b[key] || 0), 0)

/** Period date range for prisma queries */
function periodRange(periodStart, periodEnd) {
  return { gte: toUTCDay(periodStart), lte: toUTCDay(periodEnd) }
}

/** Count attendance days matching given statuses in a period for an employee */
async function countAttendanceDays(employeeId, periodStart, periodEnd, statuses) {
  return prisma.attendance.count({
    where: {
      employeeId,
      date:   periodRange(periodStart, periodEnd),
      status: { in: statuses },
    },
  })
}

/** Count approved leave days of a given type in the period */
async function countApprovedLeaveDays(employeeId, periodStart, periodEnd, leaveType) {
  const requests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: 'APPROVED',
      leaveType,
      AND: [
        { startDate: { lte: toUTCDay(periodEnd) } },
        { endDate:   { gte: toUTCDay(periodStart) } },
      ],
    },
  })
  // Sum totalDays (already pre-calculated as working days)
  return requests.reduce((a, r) => a + r.totalDays, 0)
}

// ─── Payrun CRUD ──────────────────────────────────────────────────────────────

async function createPayrun({ name, periodStart, periodEnd, createdById }) {
  if (new Date(periodStart) >= new Date(periodEnd)) {
    throw { status: 400, message: 'periodStart must be before periodEnd' }
  }
  // Check overlapping payrun
  const overlap = await prisma.payrun.findFirst({
    where: {
      AND: [
        { periodStart: { lte: toUTCDay(periodEnd) } },
        { periodEnd:   { gte: toUTCDay(periodStart) } },
      ],
    },
  })
  if (overlap) throw { status: 409, message: `Overlapping payrun exists: ${overlap.name}` }

  return prisma.payrun.create({
    data: {
      name,
      periodStart: toUTCDay(periodStart),
      periodEnd:   toUTCDay(periodEnd),
      status:      'PENDING',
      createdById,
    },
  })
}

async function getPayruns({ status } = {}) {
  return prisma.payrun.findMany({
    where:   status ? { status } : {},
    include: { _count: { select: { payslips: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

async function getPayrunById(id) {
  const payrun = await prisma.payrun.findUnique({
    where:   { id },
    include: { _count: { select: { payslips: true } } },
  })
  if (!payrun) throw { status: 404, message: 'Payrun not found' }
  return payrun
}

// ─── Payslip generation ───────────────────────────────────────────────────────

async function generatePayslips(payrunId) {
  const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } })
  if (!payrun) throw { status: 404, message: 'Payrun not found' }
  if (['VALIDATED', 'DONE'].includes(payrun.status)) {
    throw { status: 400, message: `Cannot regenerate payslips for a ${payrun.status} payrun` }
  }

  const { periodStart, periodEnd } = payrun
  const pStart = new Date(periodStart)
  const totalWorkingDays = workingDaysInMonth(pStart.getMonth() + 1, pStart.getFullYear())

  // Fetch all active employees
  const employees = await prisma.employee.findMany({
    where: { user: { isActive: true } },
    include: { user: { select: { loginId: true, role: true } } },
  })

  const payslipData = []

  for (const emp of employees) {
    const workedDays      = await countAttendanceDays(emp.id, periodStart, periodEnd, ['PRESENT', 'HALF_DAY'])
    const paidLeaveDays   = await countApprovedLeaveDays(emp.id, periodStart, periodEnd, 'PAID')
    const sickLeaveDays   = await countApprovedLeaveDays(emp.id, periodStart, periodEnd, 'SICK')
    const unpaidLeaveDays = await countApprovedLeaveDays(emp.id, periodStart, periodEnd, 'UNPAID')

    const totalPayableDays = workedDays + paidLeaveDays + sickLeaveDays
    const basicWage        = emp.wageAmount || 0

    const calc = calculateSalaryComponents(basicWage, totalPayableDays, totalWorkingDays)

    const components = {
      basicSalary:       calc.basicSalary,
      hra:               calc.hra,
      standardAllowance: calc.standardAllowance,
      performanceBonus:  calc.performanceBonus,
      lta:               calc.lta,
      fixedAllowance:    calc.fixedAllowance,
    }

    payslipData.push({
      payrunId,
      employeeId:      emp.id,
      periodStart:     toUTCDay(periodStart),
      periodEnd:       toUTCDay(periodEnd),
      workedDays,
      paidLeaveDays:   paidLeaveDays + sickLeaveDays,
      unpaidLeaveDays,
      totalPayableDays,
      basicWage,
      grossAmount:     calc.grossAmount,
      pfEmployee:      calc.pfEmployee,
      pfEmployer:      calc.pfEmployer,
      professionalTax: calc.professionalTax,
      tdsDeduction:    calc.tdsDeduction,
      netAmount:       calc.netAmount,
      employerCost:    calc.employerCost,
      components,
      status:          'COMPUTED',
      computedAt:      new Date(),
    })
  }

  // Upsert all payslips in a transaction
  await prisma.$transaction(async (tx) => {
    for (const ps of payslipData) {
      await tx.payslip.upsert({
        where:  { payrunId_employeeId: { payrunId, employeeId: ps.employeeId } },
        create: ps,
        update: {
          workedDays:      ps.workedDays,
          paidLeaveDays:   ps.paidLeaveDays,
          unpaidLeaveDays: ps.unpaidLeaveDays,
          totalPayableDays:ps.totalPayableDays,
          basicWage:       ps.basicWage,
          grossAmount:     ps.grossAmount,
          pfEmployee:      ps.pfEmployee,
          pfEmployer:      ps.pfEmployer,
          professionalTax: ps.professionalTax,
          tdsDeduction:    ps.tdsDeduction,
          netAmount:       ps.netAmount,
          employerCost:    ps.employerCost,
          components:      ps.components,
          status:          'COMPUTED',
          computedAt:      new Date(),
        },
      })
    }

    // Update payrun totals + status
    const totalGross        = payslipData.reduce((a, p) => a + p.grossAmount, 0)
    const totalNet          = payslipData.reduce((a, p) => a + p.netAmount, 0)
    const totalEmployerCost = payslipData.reduce((a, p) => a + p.employerCost, 0)

    await tx.payrun.update({
      where: { id: payrunId },
      data:  { status: 'IN_PROGRESS', totalGross, totalNet, totalEmployerCost },
    })
  })

  return {
    payrunId,
    totalEmployees:   payslipData.length,
    totalGross:       payslipData.reduce((a, p) => a + p.grossAmount, 0),
    totalNet:         payslipData.reduce((a, p) => a + p.netAmount, 0),
    totalEmployerCost:payslipData.reduce((a, p) => a + p.employerCost, 0),
  }
}

// ─── Payslip queries ──────────────────────────────────────────────────────────

async function getPayrunPayslips(payrunId) {
  const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } })
  if (!payrun) throw { status: 404, message: 'Payrun not found' }

  return prisma.payslip.findMany({
    where:   { payrunId },
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
}

async function getPayslipById(id) {
  const ps = await prisma.payslip.findUnique({
    where:   { id },
    include: {
      employee: {
        select: {
          id: true, firstName: true, lastName: true, department: true,
          designation: true, companyLocation: true, joinDate: true,
          bankAccountNumber: true, bankName: true, ifscCode: true,
          panNumber: true, uanNumber: true,
          user: { select: { loginId: true } },
        },
      },
      payrun: { select: { name: true, periodStart: true, periodEnd: true } },
    },
  })
  if (!ps) throw { status: 404, message: 'Payslip not found' }

  return {
    ...ps,
    components: typeof ps.components === 'string' ? JSON.parse(ps.components) : ps.components,
    workedDaysBreakdown: {
      attendance:  ps.workedDays,
      paidLeaves:  ps.paidLeaveDays,
      total:       ps.totalPayableDays,
    },
  }
}

async function updatePayslip(id, data) {
  const ps = await prisma.payslip.findUnique({ where: { id } })
  if (!ps) throw { status: 404, message: 'Payslip not found' }

  return prisma.payslip.update({
    where: { id },
    data: {
      ...data,
      status: 'COMPUTED',  // re-mark as computed after manual edit
    },
  })
}

async function validatePayslip(id) {
  const ps = await prisma.payslip.findUnique({ where: { id } })
  if (!ps) throw { status: 404, message: 'Payslip not found' }
  if (ps.status === 'VALIDATED') throw { status: 400, message: 'Payslip already validated' }

  return prisma.payslip.update({
    where: { id },
    data:  { status: 'VALIDATED', validatedAt: new Date() },
  })
}

async function validatePayrun(payrunId) {
  const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } })
  if (!payrun) throw { status: 404, message: 'Payrun not found' }

  // Validate all payslips first
  await prisma.payslip.updateMany({
    where: { payrunId },
    data:  { status: 'VALIDATED', validatedAt: new Date() },
  })

  // Update payrun status
  return prisma.payrun.update({
    where: { id: payrunId },
    data:  { status: 'VALIDATED' },
  })
}

// ─── Warnings ─────────────────────────────────────────────────────────────────

async function getPayrollWarnings() {
  const employees = await prisma.employee.findMany({
    where:   { user: { isActive: true } },
    include: { user: { select: { loginId: true } } },
  })

  const missingBankAccount = employees
    .filter(e => !e.bankAccountNumber || !e.bankName || !e.ifscCode)
    .map(e => ({
      employeeId: e.id,
      name:       `${e.firstName} ${e.lastName}`,
      loginId:    e.user?.loginId,
    }))

  const missingManager = employees
    .filter(e => !e.managerId)
    .map(e => ({
      employeeId: e.id,
      name:       `${e.firstName} ${e.lastName}`,
      loginId:    e.user?.loginId,
    }))

  return {
    missingBankAccount,
    missingManager,
    counts: {
      missingBankAccount: missingBankAccount.length,
      missingManager:     missingManager.length,
    },
  }
}

// ─── Charts ───────────────────────────────────────────────────────────────────

async function getEmployerCostChart(year) {
  const yr = parseInt(year) || new Date().getFullYear()
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const result = []
  for (let m = 0; m < 12; m++) {
    const start = new Date(yr, m, 1)
    const end   = new Date(yr, m + 1, 0)

    const payslips = await prisma.payslip.findMany({
      where: {
        status:      { in: ['VALIDATED', 'DONE'] },
        periodStart: { gte: start, lte: end },
      },
      select: { employerCost: true },
    })
    result.push({ month: MONTHS[m], cost: payslips.reduce((a, p) => a + p.employerCost, 0) })
  }
  return result
}

async function getEmployeeCountChart(year) {
  const yr = parseInt(year) || new Date().getFullYear()
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const result = []
  for (let m = 0; m < 12; m++) {
    const start = new Date(yr, m, 1)
    const end   = new Date(yr, m + 1, 0)

    const count = await prisma.payslip.count({
      where: {
        periodStart: { gte: start, lte: end },
      },
    })
    result.push({ month: MONTHS[m], count })
  }
  return result
}

module.exports = {
  createPayrun,
  getPayruns,
  getPayrunById,
  generatePayslips,
  getPayrunPayslips,
  getPayslipById,
  updatePayslip,
  validatePayslip,
  validatePayrun,
  getPayrollWarnings,
  getEmployerCostChart,
  getEmployeeCountChart,
}
