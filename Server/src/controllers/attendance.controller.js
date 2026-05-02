// src/controllers/attendance.controller.js
// Handles check-in, check-out, and attendance queries for the Employees screen

const { prisma } = require('../config/prisma');

// ─── CHECK IN ────────────────────────────────────────────────────────────────
// Route: POST /api/attendance/check-in
const checkIn = async (req, res, next) => {
  try {
    // Find employee linked to the logged-in user
    const employee = await prisma.employee.findUnique({
      where: { userId: req.userId },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    // Get today's date (midnight, UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: { employeeId: employee.id, date: today },
      },
    });

    if (existing) {
      return res.status(409).json({ message: 'Already checked in today' });
    }

    // Create attendance record with check-in time
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
      },
    });

    res.status(201).json({
      message: 'Checked in successfully',
      attendance,
      workStatus: 'CHECKED_IN',
    });
  } catch (error) {
    next(error);
  }
};

// ─── CHECK OUT ───────────────────────────────────────────────────────────────
// Route: POST /api/attendance/check-out
const checkOut = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.userId },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: { employeeId: employee.id, date: today },
      },
    });

    if (!attendance) {
      return res.status(400).json({ message: 'You have not checked in today' });
    }

    if (attendance.checkOut) {
      return res.status(409).json({ message: 'Already checked out today' });
    }

    // Calculate working hours
    const checkOutTime = new Date();
    const checkInTime = new Date(attendance.checkIn);
    let workingMs = checkOutTime - checkInTime;

    // Deduct break time if both breakStart and breakEnd exist
    if (attendance.breakStart && attendance.breakEnd) {
      const breakMs = new Date(attendance.breakEnd) - new Date(attendance.breakStart);
      workingMs -= breakMs;
    }

    const workingHours = +(workingMs / (1000 * 60 * 60)).toFixed(2);

    // Get standard daily hours from config (default 8)
    const stdConfig = await prisma.systemConfig.findUnique({
      where: { key: 'standard_daily_hours' },
    });
    const standardHours = stdConfig ? parseFloat(stdConfig.value) : 8;
    const extraHours = +(workingHours - standardHours).toFixed(2);

    // Determine status based on hours worked
    let status = 'PRESENT';
    if (workingHours < 2) {
      status = 'ABSENT';
    } else if (workingHours < 4) {
      status = 'HALF_DAY';
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        workingHours,
        extraHours,
        status,
      },
    });

    res.json({
      message: 'Checked out successfully',
      attendance: updated,
      workStatus: 'CHECKED_OUT',
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET MY ATTENDANCE ───────────────────────────────────────────────────────
// Route: GET /api/attendance/me?month=5&year=2026
const getMyAttendance = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.userId },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0)); // last day of month

    const records = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ attendance: records, month, year });
  } catch (error) {
    next(error);
  }
};

// ─── GET MY STATUS (for the avatar dot) ──────────────────────────────────────
// Route: GET /api/attendance/my-status
const getMyStatus = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.userId },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check approved leave first
    const onLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: employee.id,
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    if (onLeave) {
      return res.json({ workStatus: 'ON_LEAVE' });
    }

    // Check today's attendance
    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: { employeeId: employee.id, date: today },
      },
    });

    if (attendance) {
      if (attendance.checkIn && !attendance.checkOut) {
        return res.json({ workStatus: 'CHECKED_IN', since: attendance.checkIn });
      }
      if (attendance.checkIn && attendance.checkOut) {
        return res.json({ workStatus: 'CHECKED_OUT', attendance });
      }
    }

    res.json({ workStatus: 'ABSENT' });
  } catch (error) {
    next(error);
  }
};

// ─── GET TODAY'S PRESENT LIST ────────────────────────────────────────────────
// Route: GET /api/attendance/today  (Admin, HR, Payroll only)
const getTodayPresent = async (req, res, next) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const records = await prisma.attendance.findMany({
      where: { date: today },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { checkIn: 'asc' },
    });

    res.json({ date: today, attendees: records });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getMyStatus,
  getTodayPresent,
};
