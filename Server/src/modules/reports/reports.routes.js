// src/modules/reports/reports.routes.js
const { Router } = require('express')
const { protect, allowRoles } = require('../../middleware/auth')
const ctrl = require('./reports.controller')

const router  = Router()
const reports = allowRoles('ADMIN', 'PAYROLL_OFFICER')

router.get('/salary-statement',  protect, reports, ctrl.getSalaryStatement)
router.get('/payroll-summary',   protect, reports, ctrl.getPayrollSummary)
router.get('/leaves',            protect, reports, ctrl.getLeavesReport)
router.get('/attendance',        protect, reports, ctrl.getAttendanceReport)

module.exports = router
