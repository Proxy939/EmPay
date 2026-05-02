const { Router } = require('express');
const { protect, allowRoles } = require('../middleware/auth');
const {
  checkIn, checkOut, getMyAttendance, getMyStatus,
  getDayAttendance, addManualAttendance,
  getEmployeeAttendance, approveOvertime,
} = require('../controllers/attendance.controller');

const router = Router();
const admin = allowRoles('ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER');
const hr    = allowRoles('ADMIN', 'HR_OFFICER');

// Employee self routes
router.post('/check-in',   protect, checkIn);
router.post('/check-out',  protect, checkOut);
router.get('/my-status',   protect, getMyStatus);
router.get('/me',          protect, getMyAttendance);

// Admin/HR/Payroll — day view (any date)
router.get('/day',   protect, admin, getDayAttendance);
router.get('/today', protect, admin, getDayAttendance); // alias

// Admin/HR — employee monthly view (for detail modal)
router.get('/employee/:employeeId', protect, admin, getEmployeeAttendance);

// Admin/HR — manual add + overtime approval
router.post('/manual',          protect, hr, addManualAttendance);
router.patch('/:id/overtime',   protect, hr, approveOvertime);

module.exports = router;
