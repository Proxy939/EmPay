// src/routes/attendance.routes.js — Attendance module routes

const { Router } = require('express');
const { protect, allowRoles } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getMyStatus,
  getTodayPresent,
} = require('../controllers/attendance.controller');

const router = Router();

// ── Any authenticated user ───────────────────────────────────────────────────
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/me', protect, getMyAttendance);
router.get('/my-status', protect, getMyStatus);

// ── Admin / HR / Payroll only ────────────────────────────────────────────────
router.get('/today', protect, allowRoles('ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'), getTodayPresent);

module.exports = router;
