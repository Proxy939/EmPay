// src/modules/leave/leave.service.js
const { prisma } = require('../../config/prisma')
const { countWorkingDays, getWorkingDays, toUTCDay } = require('../../utils/dateHelpers')

// ── Leave Types ───────────────────────────────────────────────────────────────
// The existing schema uses a `LeaveType` enum: PAID | SICK | UNPAID
// We expose them as typed objects for the frontend.
const LEAVE_TYPE_META = {
  PAID:   { name: 'Paid Time Off', isPaid: true,  hasLimit: true,  defaultDays: 24 },
  SICK:   { name: 'Sick Leave',    isPaid: true,  hasLimit: true,  defaultDays: 7  },
  UNPAID: { name: 'Unpaid Leave',  isPaid: false, hasLimit: false, defaultDays: null },
}

/**
 * Get all leave type definitions.
 */
async function getLeaveTypes() {
  return Object.entries(LEAVE_TYPE_META).map(([key, meta]) => ({ key, ...meta }))
}

/**
 * Get leave balance for an employee (all 3 types).
 */
async function getEmployeeBalance(employeeId) {
  const year = new Date().getFullYear()

  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId, year },
  })

  return Object.entries(LEAVE_TYPE_META).map(([key, meta]) => {
    const bal = balances.find(b => b.leaveType === key)
    return {
      leaveType: key,
      name: meta.name,
      isPaid: meta.isPaid,
      hasLimit: meta.hasLimit,
      allocatedDays: bal?.totalDays ?? meta.defaultDays ?? null,
      usedDays: bal?.usedDays ?? 0,
      remainingDays: meta.hasLimit
        ? ((bal?.totalDays ?? meta.defaultDays) - (bal?.usedDays ?? 0))
        : null,
    }
  })
}

/**
 * Apply for a leave request.
 */
async function applyLeave(employeeId, { leaveType, startDate, endDate, reason, certificateUrl }) {
  // Validate dates
  const s = new Date(startDate), e = new Date(endDate)
  if (s > e) throw { status: 400, message: 'startDate must be before or equal to endDate' }

  // Sick leave requires certificate
  if (leaveType === 'SICK' && !certificateUrl) {
    throw { status: 400, message: 'Medical certificate is required for Sick Leave' }
  }

  const totalDays = countWorkingDays(s, e)
  if (totalDays === 0) throw { status: 400, message: 'No working days in selected range' }

  // Check balance for limited leave types
  const meta = LEAVE_TYPE_META[leaveType]
  if (!meta) throw { status: 400, message: 'Invalid leave type' }

  if (meta.hasLimit) {
    const year = new Date(startDate).getFullYear()
    const bal  = await prisma.leaveBalance.findUnique({
      where: { employeeId_leaveType_year: { employeeId, leaveType, year } },
    })
    const allocated = bal?.totalDays ?? meta.defaultDays
    const used      = bal?.usedDays  ?? 0
    if ((allocated - used) < totalDays) {
      throw { status: 400, message: `Insufficient leave balance. Available: ${allocated - used} days` }
    }
  }

  // Check overlapping PENDING or APPROVED requests
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      AND: [
        { startDate: { lte: toUTCDay(endDate) } },
        { endDate:   { gte: toUTCDay(startDate) } },
      ],
    },
  })
  if (overlap) throw { status: 409, message: 'You already have a leave request overlapping these dates' }

  // Create request
  const request = await prisma.leaveRequest.create({
    data: {
      employeeId,
      leaveType,
      startDate: toUTCDay(startDate),
      endDate:   toUTCDay(endDate),
      totalDays,
      reason,
      attachmentUrl: certificateUrl || null,
      status: 'PENDING',
    },
  })
  return request
}

/**
 * Review a leave request (Admin only): APPROVED or REJECTED.
 */
async function reviewLeave(leaveId, reviewerId, { status, reviewNote }) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { employee: true },
  })
  if (!request) throw { status: 404, message: 'Leave request not found' }
  if (request.status !== 'PENDING') throw { status: 400, message: 'This request has already been reviewed' }

  if (status === 'APPROVED') {
    // Deduct from balance
    const year = new Date(request.startDate).getFullYear()
    const meta = LEAVE_TYPE_META[request.leaveType]

    if (meta.hasLimit) {
      // Ensure balance record exists, then increment usedDays
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveType_year: { employeeId: request.employeeId, leaveType: request.leaveType, year } },
        create: {
          employeeId: request.employeeId,
          leaveType:  request.leaveType,
          totalDays:  meta.defaultDays,
          usedDays:   request.totalDays,
          year,
        },
        update: { usedDays: { increment: request.totalDays } },
      })
    }

    // Mark attendance ON_LEAVE for each working day in range
    const workDays = getWorkingDays(request.startDate, request.endDate)
    for (const day of workDays) {
      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: request.employeeId, date: toUTCDay(day) } },
        create: { employeeId: request.employeeId, date: toUTCDay(day), status: 'ON_LEAVE' },
        update: { status: 'ON_LEAVE' },
      })
    }
  }

  if (status === 'REJECTED') {
    // If there were ON_LEAVE records from a previous optimistic mark, revert to ABSENT
    const workDays = getWorkingDays(request.startDate, request.endDate)
    for (const day of workDays) {
      const existing = await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: request.employeeId, date: toUTCDay(day) } },
      })
      if (existing && existing.status === 'ON_LEAVE') {
        await prisma.attendance.update({
          where: { id: existing.id },
          data:  { status: 'ABSENT' },
        })
      }
    }
  }

  // Update leave request
  const updated = await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status,
      reviewedById: reviewerId,
      reviewedAt:   new Date(),
      rejectionNote: reviewNote || null,
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
    },
  })
  return updated
}

/**
 * Get all leave requests (admin/HR view) with optional filters.
 */
async function getAllLeaves({ employeeId, status, month, year } = {}) {
  const where = {}
  if (employeeId) where.employeeId = employeeId
  if (status)     where.status     = status
  if (month && year) {
    const s = new Date(year, month - 1, 1)
    const e = new Date(year, month, 0)
    where.AND = [{ startDate: { lte: e } }, { endDate: { gte: s } }]
  } else if (year) {
    where.AND = [{ startDate: { gte: new Date(`${year}-01-01`) } }, { endDate: { lte: new Date(`${year}-12-31`) } }]
  }

  return prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true,
          user: { select: { loginId: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get single leave request by id.
 */
async function getLeaveById(id) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, department: true, designation: true,
          user: { select: { loginId: true } } },
      },
    },
  })
  if (!request) throw { status: 404, message: 'Leave request not found' }
  return request
}

/**
 * Get all leave requests for the currently logged-in employee.
 */
async function getMyLeaves(employeeId, { status, year } = {}) {
  const where = { employeeId }
  if (status) where.status = status
  if (year) {
    where.AND = [
      { startDate: { gte: new Date(`${year}-01-01`) } },
      { endDate:   { lte: new Date(`${year}-12-31`) } },
    ]
  }
  return prisma.leaveRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Allocate leave balance for an employee (Admin/HR).
 */
async function allocateLeave(employeeId, { leaveType, allocatedDays, validFrom, validTo }) {
  const year = new Date(validFrom).getFullYear()
  const result = await prisma.leaveBalance.upsert({
    where: { employeeId_leaveType_year: { employeeId, leaveType, year } },
    create: { employeeId, leaveType, totalDays: allocatedDays, usedDays: 0, year },
    update: { totalDays: allocatedDays },
  })
  return result
}

module.exports = {
  getLeaveTypes,
  getEmployeeBalance,
  applyLeave,
  reviewLeave,
  getAllLeaves,
  getLeaveById,
  getMyLeaves,
  allocateLeave,
}
