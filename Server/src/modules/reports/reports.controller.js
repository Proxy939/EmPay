// src/modules/reports/reports.controller.js
const svc = require('./reports.service')

// GET /api/reports/salary-statement?employeeId=&year=
const getSalaryStatement = async (req, res, next) => {
  try {
    const { employeeId, year } = req.query
    const data = await svc.getSalaryStatement(employeeId, year)
    res.json({ data })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/reports/payroll-summary?month=&year=
const getPayrollSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query
    const data = await svc.getPayrollSummary(month, year)
    res.json({ data })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/reports/leaves?month=&year=&employeeId=
const getLeavesReport = async (req, res, next) => {
  try {
    const { month, year, employeeId } = req.query
    const data = await svc.getLeavesReport({
      month:      month      ? parseInt(month)  : undefined,
      year:       year       ? parseInt(year)   : undefined,
      employeeId: employeeId || undefined,
    })
    res.json({ data })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/reports/attendance?month=&year=&employeeId=
const getAttendanceReport = async (req, res, next) => {
  try {
    const { month, year, employeeId } = req.query
    const data = await svc.getAttendanceReport({
      month:      month      ? parseInt(month)  : undefined,
      year:       year       ? parseInt(year)   : undefined,
      employeeId: employeeId || undefined,
    })
    res.json({ data })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

module.exports = { getSalaryStatement, getPayrollSummary, getLeavesReport, getAttendanceReport }
