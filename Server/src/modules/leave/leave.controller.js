// src/modules/leave/leave.controller.js
const svc = require('./leave.service')

// Helper to find employeeId from req.user
async function resolveEmployeeId(req) {
  // auth middleware attaches req.userId (user.id)
  // The employee lookup is done inside service or here
  const { prisma } = require('../../config/prisma')
  const emp = await prisma.employee.findUnique({ where: { userId: req.userId } })
  if (!emp) throw { status: 404, message: 'Employee profile not found' }
  return emp.id
}

// POST /api/leaves/apply
const applyLeave = async (req, res, next) => {
  try {
    const employeeId    = await resolveEmployeeId(req)
    const { leaveType, startDate, endDate, reason } = req.body
    const certificateUrl = req.file ? `/uploads/certificates/${req.file.filename}` : null

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: 'leaveType, startDate and endDate are required' })
    }

    const request = await svc.applyLeave(employeeId, { leaveType, startDate, endDate, reason, certificateUrl })
    res.status(201).json({ message: 'Leave request submitted successfully', data: request })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/leaves/me
const getMyLeaves = async (req, res, next) => {
  try {
    const employeeId = await resolveEmployeeId(req)
    const { status, year } = req.query
    const leaves = await svc.getMyLeaves(employeeId, { status, year: year ? parseInt(year) : undefined })
    res.json({ data: leaves })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/leaves/balance/me
const getMyBalance = async (req, res, next) => {
  try {
    const employeeId = await resolveEmployeeId(req)
    const balance = await svc.getEmployeeBalance(employeeId)
    res.json({ data: balance })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/leaves/types
const getLeaveTypes = async (_req, res, next) => {
  try {
    const types = await svc.getLeaveTypes()
    res.json({ data: types })
  } catch (err) { next(err) }
}

// GET /api/leaves  (Admin/HR/Payroll)
const getAllLeaves = async (req, res, next) => {
  try {
    const { employeeId, status, month, year } = req.query
    const leaves = await svc.getAllLeaves({
      employeeId,
      status,
      month: month ? parseInt(month) : undefined,
      year:  year  ? parseInt(year)  : undefined,
    })
    res.json({ data: leaves })
  } catch (err) { next(err) }
}

// GET /api/leaves/:id
const getLeave = async (req, res, next) => {
  try {
    const leave = await svc.getLeaveById(req.params.id)
    res.json({ data: leave })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// PATCH /api/leaves/:id/review  (Admin only)
const reviewLeave = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, reviewNote } = req.body
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'status must be APPROVED or REJECTED' })
    }

    // Resolve reviewer employee id
    const { prisma } = require('../../config/prisma')
    const reviewer = await prisma.employee.findUnique({ where: { userId: req.userId } })
    const reviewerId = reviewer?.id || null

    const updated = await svc.reviewLeave(id, reviewerId, { status, reviewNote })
    res.json({ message: `Leave request ${status.toLowerCase()} successfully`, data: updated })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// POST /api/leaves/allocate  (Admin/HR)
const allocateLeave = async (req, res, next) => {
  try {
    const { employeeId, leaveType, allocatedDays, validFrom, validTo } = req.body
    if (!employeeId || !leaveType || !allocatedDays || !validFrom) {
      return res.status(400).json({ message: 'employeeId, leaveType, allocatedDays and validFrom are required' })
    }
    const result = await svc.allocateLeave(employeeId, { leaveType, allocatedDays, validFrom, validTo })
    res.status(201).json({ message: 'Leave allocated successfully', data: result })
  } catch (err) { next(err) }
}

// GET /api/leaves/balance/:employeeId  (Admin/HR/Payroll)
const getEmployeeBalance = async (req, res, next) => {
  try {
    const balance = await svc.getEmployeeBalance(req.params.employeeId)
    res.json({ data: balance })
  } catch (err) { next(err) }
}

module.exports = {
  applyLeave,
  getMyLeaves,
  getMyBalance,
  getLeaveTypes,
  getAllLeaves,
  getLeave,
  reviewLeave,
  allocateLeave,
  getEmployeeBalance,
}
