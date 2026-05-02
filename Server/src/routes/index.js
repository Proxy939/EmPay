// src/routes/index.js - Root API router
const { Router } = require('express')
const authRoutes       = require('./auth.routes')
const employeeRoutes   = require('./employees.routes')
const attendanceRoutes = require('./attendance.routes')
const userRoutes       = require('./users.routes')
const leaveRoutes      = require('../modules/leave/leave.routes')
const payrunRoutes     = require('../modules/payroll/payroll.routes')
const payslipRoutes    = require('../modules/payroll/payslip.routes')
const reportsRoutes    = require('../modules/reports/reports.routes')
const dashboardRoutes  = require('../modules/dashboard/dashboard.routes')

const router = Router()

router.use('/auth',                   authRoutes)
router.use('/employees',              employeeRoutes)
router.use('/attendance',             attendanceRoutes)
router.use('/users',                  userRoutes)
router.use('/leaves',                 leaveRoutes)
router.use('/payroll/payslips',       payslipRoutes)
router.use('/payroll',                payrunRoutes)
router.use('/reports',                reportsRoutes)
router.use('/dashboard',              dashboardRoutes)

module.exports = router



