// src/modules/dashboard/dashboard.controller.js
// Dashboard overview + trend endpoints for the new TurHR-style Dashboard

const { prisma } = require('../../config/prisma')
const { workingDaysInMonth, toUTCDay } = require('../../utils/dateHelpers')

// ─── GET /api/dashboard/overview ─────────────────────────────────────────────
const getOverview = async (req, res, next) => {
  try {
    const today = toUTCDay()

    const totalEmployees = await prisma.employee.count({
      where: { user: { isActive: true } },
    })

    // Today's attendance snapshot
    const checkedInToday = await prisma.attendance.count({
      where: { date: today, status: { in: ['PRESENT', 'HALF_DAY'] } },
    })
    const onLeaveToday = await prisma.attendance.count({
      where: { date: today, status: 'ON_LEAVE' },
    })
    const absentToday = Math.max(0, totalEmployees - checkedInToday - onLeaveToday)

    const attendanceRate = totalEmployees > 0
      ? Math.round((checkedInToday / totalEmployees) * 100)
      : 0

    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: { status: 'PENDING' },
    })

    // Payroll warnings: employees missing bank account
    const payrollWarnings = await prisma.employee.count({
      where: {
        user: { isActive: true },
        OR: [{ bankAccountNumber: null }, { bankName: null }, { ifscCode: null }],
      },
    })

    res.json({
      data: {
        totalEmployees,
        checkedInToday,
        onLeaveToday,
        absentToday,
        attendanceRate,
        pendingLeaveRequests,
        payrollWarnings,
      },
    })
  } catch (err) { next(err) }
}

// ─── GET /api/dashboard/attendance-trend ─────────────────────────────────────
// Returns top 5 employees by attendance in a given month
const getAttendanceTrend = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1
    const year  = parseInt(req.query.year)  || new Date().getFullYear()

    const start = new Date(Date.UTC(year, month - 1, 1))
    const end   = new Date(Date.UTC(year, month, 0))

    // Get all attendance records for the month
    const records = await prisma.attendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    // Aggregate per employee
    const empMap = {}
    for (const r of records) {
      const id = r.employeeId
      if (!empMap[id]) {
        empMap[id] = {
          employeeId: id,
          name: `${r.employee.firstName} ${r.employee.lastName}`,
          daysPresent: 0,
          daysOnTime: 0,
          extraHours: 0,
        }
      }
      if (['PRESENT', 'HALF_DAY'].includes(r.status)) {
        empMap[id].daysPresent++
        // "on time" = checked in before 09:30
        if (r.checkIn) {
          const h = new Date(r.checkIn).getUTCHours()
          const m = new Date(r.checkIn).getUTCMinutes()
          if (h < 9 || (h === 9 && m <= 30)) empMap[id].daysOnTime++
        }
      }
      empMap[id].extraHours += r.extraHours || 0
    }

    // Top 5 by daysPresent
    const trend = Object.values(empMap)
      .sort((a, b) => b.daysPresent - a.daysPresent)
      .slice(0, 5)
      .map(e => ({
        ...e,
        extraHours: Math.round(e.extraHours * 10) / 10,
      }))

    res.json({ data: trend })
  } catch (err) { next(err) }
}

// ─── GET /api/dashboard/employer-cost-trend ───────────────────────────────────
// Monthly gross/net payroll for the year
const getEmployerCostTrend = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear()
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    const result = []
    for (let m = 0; m < 12; m++) {
      const start = new Date(Date.UTC(year, m, 1))
      const end   = new Date(Date.UTC(year, m + 1, 0))

      const agg = await prisma.payslip.aggregate({
        where: { periodStart: { gte: start, lte: end } },
        _sum:  { grossAmount: true, netAmount: true, employerCost: true },
      })

      result.push({
        month:        MONTHS[m],
        grossPayroll: Math.round(agg._sum.grossAmount  || 0),
        netPayroll:   Math.round(agg._sum.netAmount    || 0),
        employerCost: Math.round(agg._sum.employerCost || 0),
      })
    }

    res.json({ data: result })
  } catch (err) { next(err) }
}

// ─── GET /api/dashboard/employee-count-trend ─────────────────────────────────
const getEmployeeCountTrend = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear()
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    const result = []
    for (let m = 0; m < 12; m++) {
      const end = new Date(Date.UTC(year, m + 1, 0))
      const count = await prisma.employee.count({
        where: { joinDate: { lte: end }, user: { isActive: true } },
      })
      result.push({ month: MONTHS[m], count })
    }

    res.json({ data: result })
  } catch (err) { next(err) }
}

module.exports = { getOverview, getAttendanceTrend, getEmployerCostTrend, getEmployeeCountTrend }
