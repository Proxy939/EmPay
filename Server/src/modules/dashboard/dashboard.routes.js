// src/modules/dashboard/dashboard.routes.js
const { Router } = require('express')
const { protect, allowRoles } = require('../../middleware/auth')
const ctrl = require('./dashboard.controller')

const router = Router()
const payrollRoles = allowRoles('ADMIN', 'PAYROLL_OFFICER')

router.get('/overview',              protect, ctrl.getOverview)
router.get('/attendance-trend',      protect, ctrl.getAttendanceTrend)
router.get('/employer-cost-trend',   protect, payrollRoles, ctrl.getEmployerCostTrend)
router.get('/employee-count-trend',  protect, payrollRoles, ctrl.getEmployeeCountTrend)

module.exports = router
