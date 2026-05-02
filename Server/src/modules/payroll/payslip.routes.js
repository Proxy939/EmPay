// src/modules/payroll/payslip.routes.js
// Mounted at /api/payroll/payslips
const { Router } = require('express')
const { protect, allowRoles } = require('../../middleware/auth')
const ctrl = require('./payroll.controller')

const router  = Router()
const payroll = allowRoles('ADMIN', 'PAYROLL_OFFICER')

router.get('/:id',          protect, payroll, ctrl.getPayslipById)
router.patch('/:id',        protect, payroll, ctrl.updatePayslip)
router.patch('/:id/validate', protect, payroll, ctrl.validatePayslip)
router.get('/:id/pdf',      protect, payroll, ctrl.getPayslipPdf)

module.exports = router
