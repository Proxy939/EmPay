// src/controllers/attendance.controller.js
const { prisma } = require('../config/prisma');

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Get midnight UTC for a date (or today)
function toUTCDay(date) {
  const d = date ? new Date(date) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Format a Date to HH:MM string
function fmtTime(dt) {
  if (!dt) return null;
  return new Date(dt).toTimeString().slice(0, 5);
}

// Count working days (Mon-Fri) in a month
function countWorkingDays(year, month) {
  const days = new Date(year, month, 0).getDate(); // total days in month
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++; // skip Sun(0) & Sat(6)
  }
  return count;
}

// ─── CHECK IN ────────────────────────────────────────────────────────────────
// Route: POST /api/attendance/check-in
const checkIn = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.userId },
    });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const today = toUTCDay();

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    });
    if (existing) return res.status(409).json({ message: 'Already checked in today' });

    const attendance = await prisma.attendance.create({
      data: { employeeId: employee.id, date: today, checkIn: new Date(), status: 'PRESENT' },
    });

    res.status(201).json({ message: 'Checked in successfully', attendance, workStatus: 'CHECKED_IN' });
  } catch (error) { next(error); }
};

// ─── CHECK OUT ───────────────────────────────────────────────────────────────
// Route: POST /api/attendance/check-out
const checkOut = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { userId: req.userId } });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const today = toUTCDay();
    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    });

    if (!attendance) return res.status(400).json({ message: 'You have not checked in today' });
    if (attendance.checkOut) return res.status(409).json({ message: 'Already checked out today' });

    const checkOutTime = new Date();
    let workingMs = checkOutTime - new Date(attendance.checkIn);

    // Deduct break time if recorded
    if (attendance.breakStart && attendance.breakEnd) {
      workingMs -= new Date(attendance.breakEnd) - new Date(attendance.breakStart);
    }

    const workingHours = +(workingMs / (1000 * 60 * 60)).toFixed(2);

    // Standard hours from config (default 8)
    const stdConfig = await prisma.systemConfig.findUnique({ where: { key: 'standard_daily_hours' } });
    const standardHours = stdConfig ? parseFloat(stdConfig.value) : 8;
    const extraHours = +(workingHours - standardHours).toFixed(2);

    let status = 'PRESENT';
    if (workingHours < 2) status = 'ABSENT';
    else if (workingHours < 4) status = 'HALF_DAY';

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: checkOutTime, workingHours, extraHours, status },
    });

    res.json({ message: 'Checked out successfully', attendance: updated, workStatus: 'CHECKED_OUT' });
  } catch (error) { next(error); }
};

// ─── GET MY STATUS ───────────────────────────────────────────────────────────
// Route: GET /api/attendance/my-status
const getMyStatus = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { userId: req.userId } });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const today = toUTCDay();

    // Check approved leave first
    const onLeave = await prisma.leaveRequest.findFirst({
      where: { employeeId: employee.id, status: 'APPROVED', startDate: { lte: today }, endDate: { gte: today } },
    });
    if (onLeave) return res.json({ workStatus: 'ON_LEAVE' });

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    });

    if (!attendance) return res.json({ workStatus: 'ABSENT' });
    if (attendance.checkIn && !attendance.checkOut) return res.json({ workStatus: 'CHECKED_IN', since: attendance.checkIn });
    if (attendance.checkIn && attendance.checkOut) return res.json({ workStatus: 'CHECKED_OUT', attendance });

    res.json({ workStatus: 'ABSENT' });
  } catch (error) { next(error); }
};

// ─── GET MY ATTENDANCE (monthly) ─────────────────────────────────────────────
// Route: GET /api/attendance/me?month=5&year=2026
// Returns records + summary stats for the employee view
const getMyAttendance = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { userId: req.userId } });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate   = new Date(Date.UTC(year, month, 0));

    // Get attendance records for the month
    const records = await prisma.attendance.findMany({
      where: { employeeId: employee.id, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });

    // Count approved leaves in this month
    const leaves = await prisma.leaveRequest.count({
      where: {
        employeeId: employee.id,
        status: 'APPROVED',
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    const daysPresent    = records.filter(r => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
    const totalWorkingDays = countWorkingDays(year, month);

    // Format records for the table
    const formatted = records.map(r => ({
      id:           r.id,
      date:         r.date,
      checkIn:      fmtTime(r.checkIn),
      checkOut:     fmtTime(r.checkOut),
      workingHours: r.workingHours,
      extraHours:   r.extraHours,
      status:       r.status,
    }));

    res.json({
      records: formatted,
      summary: { daysPresent, leavesCount: leaves, totalWorkingDays },
      month,
      year,
    });
  } catch (error) { next(error); }
};

// ─── GET DAY ATTENDANCE (Admin/HR/Payroll) ────────────────────────────────────
// Route: GET /api/attendance/day?date=2026-05-02
// Returns all employees' attendance for any given date
const getDayAttendance = async (req, res, next) => {
  try {
    // Use provided date or today
    const date = req.query.date ? toUTCDay(req.query.date) : toUTCDay();

    const records = await prisma.attendance.findMany({
      where: { date },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
            profilePhoto: true,
            user: { select: { loginId: true, email: true } },
          },
        },
      },
      orderBy: { checkIn: 'asc' },
    });

    // Count stats for the day
    const present  = records.filter(r => r.status === 'PRESENT').length;
    const halfDay  = records.filter(r => r.status === 'HALF_DAY').length;
    const absent   = records.filter(r => r.status === 'ABSENT').length;

    // Format records
    const formatted = records.map(r => ({
      id:           r.id,
      employee: {
        id:         r.employee.id,
        name:       `${r.employee.firstName} ${r.employee.lastName}`,
        loginId:    r.employee.user?.loginId,
        department: r.employee.department,
        designation:r.employee.designation,
        photo:      r.employee.profilePhoto,
      },
      checkIn:      fmtTime(r.checkIn),
      checkOut:     fmtTime(r.checkOut),
      workingHours: r.workingHours,
      extraHours:   r.extraHours,
      status:       r.status,
    }));

    res.json({
      date,
      attendees: formatted,
      summary: { present, halfDay, absent, total: records.length },
    });
  } catch (error) { next(error); }
};

module.exports = {
  checkIn,
  checkOut,
  getMyStatus,
  getMyAttendance,
  getDayAttendance,
  // Keep old name as alias so existing routes still work
  getTodayPresent: getDayAttendance,
};
