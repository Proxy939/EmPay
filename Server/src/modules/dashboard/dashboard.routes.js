// src/modules/dashboard/dashboard.routes.js
const { Router } = require('express')
const { protect } = require('../../middleware/auth')
const ctrl = require('./dashboard.controller')

const router = Router()

router.get('/overview',              protect, ctrl.getOverview)
router.get('/attendance-trend',      protect, ctrl.getAttendanceTrend)
router.get('/employer-cost-trend',   protect, ctrl.getEmployerCostTrend)
router.get('/employee-count-trend',  protect, ctrl.getEmployeeCountTrend)

module.exports = router
