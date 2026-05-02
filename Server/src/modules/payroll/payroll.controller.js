// src/modules/payroll/payroll.controller.js
const svc = require('./payroll.service')
const { generatePdf } = require('./payroll.pdf')

// ─── Payruns ──────────────────────────────────────────────────────────────────

// POST /api/payroll/payruns
const createPayrun = async (req, res, next) => {
  try {
    const { name, periodStart, periodEnd } = req.body
    if (!name || !periodStart || !periodEnd) {
      return res.status(400).json({ message: 'name, periodStart and periodEnd are required' })
    }

    // Resolve createdById from current user's employee record
    const { prisma } = require('../../config/prisma')
    const emp = await prisma.employee.findUnique({ where: { userId: req.userId } })
    const createdById = emp?.id || req.userId

    const payrun = await svc.createPayrun({ name, periodStart, periodEnd, createdById })
    res.status(201).json({ message: 'Payrun created', data: payrun })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/payroll/payruns
const getPayruns = async (req, res, next) => {
  try {
    const payruns = await svc.getPayruns({ status: req.query.status })
    res.json({ data: payruns })
  } catch (err) { next(err) }
}

// GET /api/payroll/payruns/:id
const getPayrunById = async (req, res, next) => {
  try {
    const payrun = await svc.getPayrunById(req.params.id)
    res.json({ data: payrun })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// POST /api/payroll/payruns/:id/generate
const generatePayslips = async (req, res, next) => {
  try {
    const result = await svc.generatePayslips(req.params.id)
    res.json({ message: 'Payslips generated successfully', data: result })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// PATCH /api/payroll/payruns/:id/validate
const validatePayrun = async (req, res, next) => {
  try {
    const payrun = await svc.validatePayrun(req.params.id)
    res.json({ message: 'Payrun validated', data: payrun })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/payroll/payruns/:id/payslips
const getPayrunPayslips = async (req, res, next) => {
  try {
    const payslips = await svc.getPayrunPayslips(req.params.id)
    res.json({ data: payslips })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// ─── Payslips ─────────────────────────────────────────────────────────────────

// GET /api/payroll/payslips/:id
const getPayslipById = async (req, res, next) => {
  try {
    const payslip = await svc.getPayslipById(req.params.id)
    res.json({ data: payslip })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// PATCH /api/payroll/payslips/:id
const updatePayslip = async (req, res, next) => {
  try {
    const allowed = ['workedDays','paidLeaveDays','unpaidLeaveDays','grossAmount',
                     'pfEmployee','pfEmployer','professionalTax','tdsDeduction','netAmount','employerCost']
    const data = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = parseFloat(req.body[k]) })
    const payslip = await svc.updatePayslip(req.params.id, data)
    res.json({ message: 'Payslip updated', data: payslip })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// PATCH /api/payroll/payslips/:id/validate
const validatePayslip = async (req, res, next) => {
  try {
    const payslip = await svc.validatePayslip(req.params.id)
    res.json({ message: 'Payslip validated', data: payslip })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/payroll/payslips/:id/pdf
const getPayslipPdf = async (req, res, next) => {
  try {
    const payslip = await svc.getPayslipById(req.params.id)
    const pStart  = new Date(payslip.payrun.periodStart)
    const label   = `${pStart.toLocaleString('default', { month: 'long' })}_${pStart.getFullYear()}`
    const loginId = payslip.employee.user?.loginId || 'EMP'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${loginId}_${label}.pdf`)

    const doc = generatePdf(payslip)
    doc.pipe(res)
    doc.end()
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/payroll/payslips/me — Employee views their own payslips
const getMyPayslips = async (req, res, next) => {
  try {
    const { prisma } = require('../../config/prisma')
    const emp = await prisma.employee.findUnique({ where: { userId: req.userId } })
    if (!emp) return res.status(404).json({ message: 'Employee profile not found' })

    const payslips = await prisma.payslip.findMany({
      where: { employeeId: emp.id },
      include: {
        payrun: { select: { name: true, periodStart: true, periodEnd: true, status: true } },
      },
      orderBy: { periodStart: 'desc' },
    })
    res.json({ data: payslips })
  } catch (err) { next(err) }
}


// GET /api/payroll/warnings
const getWarnings = async (_req, res, next) => {
  try {
    const warnings = await svc.getPayrollWarnings()
    res.json({ data: warnings })
  } catch (err) { next(err) }
}

// GET /api/payroll/charts/employer-cost
const getEmployerCostChart = async (req, res, next) => {
  try {
    const data = await svc.getEmployerCostChart(req.query.year)
    res.json({ data })
  } catch (err) { next(err) }
}

// GET /api/payroll/charts/employee-count
const getEmployeeCountChart = async (req, res, next) => {
  try {
    const data = await svc.getEmployeeCountChart(req.query.year)
    res.json({ data })
  } catch (err) { next(err) }
}

module.exports = {
  createPayrun,
  getPayruns,
  getPayrunById,
  generatePayslips,
  validatePayrun,
  getPayrunPayslips,
  getPayslipById,
  getMyPayslips,
  updatePayslip,
  validatePayslip,
  getPayslipPdf,
  getWarnings,
  getEmployerCostChart,
  getEmployeeCountChart,
}
