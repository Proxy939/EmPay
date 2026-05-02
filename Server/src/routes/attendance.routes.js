// src/routes/attendance.routes.js
const { Router } = require('express');
const { protect, allowRoles } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getMyStatus,
  getDayAttendance,
} = require('../controllers/attendance.controller');

const router = Router();

// ── Any authenticated user ───────────────────────────────────────────────────
router.post('/check-in',   protect, checkIn);
router.post('/check-out',  protect, checkOut);
router.get('/my-status',   protect, getMyStatus);

// GET /api/attendance/me?month=5&year=2026
// Returns monthly records + summary stats for the logged-in employee
router.get('/me', protect, getMyAttendance);

// ── Admin / HR / Payroll only ────────────────────────────────────────────────
// GET /api/attendance/day?date=2026-05-02
// Returns all employees' attendance for a given date (defaults to today)
router.get('/day', protect, allowRoles('ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'), getDayAttendance);

// Keep /today as alias for backward compatibility
router.get('/today', protect, allowRoles('ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'), getDayAttendance);

module.exports = router;
