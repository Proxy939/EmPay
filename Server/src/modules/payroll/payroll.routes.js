// src/modules/payroll/payroll.routes.js
const { Router } = require('express')
const { protect, allowRoles } = require('../../middleware/auth')
const ctrl = require('./payroll.controller')

const router  = Router()
const payroll = allowRoles('ADMIN', 'PAYROLL_OFFICER')

// ── Payruns ───────────────────────────────────────────────────────────────────
router.post('/',                            protect, payroll, ctrl.createPayrun)
router.get('/',                             protect, payroll, ctrl.getPayruns)

// Charts + warnings — specific paths BEFORE :id wildcards
router.get('/warnings',                     protect, payroll, ctrl.getWarnings)
router.get('/charts/employer-cost',         protect, payroll, ctrl.getEmployerCostChart)
router.get('/charts/employee-count',        protect, payroll, ctrl.getEmployeeCountChart)

// Payrun by id
router.get('/:id',                          protect, payroll, ctrl.getPayrunById)
router.post('/:id/generate',               protect, payroll, ctrl.generatePayslips)
router.patch('/:id/validate',              protect, payroll, ctrl.validatePayrun)
router.get('/:id/payslips',               protect, payroll, ctrl.getPayrunPayslips)

// ── Payslips (mounted separately on /payslips via app router) ─────────────────
// Routes defined here are under /api/payroll/ prefix — payslip routes come via
// a separate sub-path registered in routes/index.js as /api/payroll/payslips
module.exports = router
