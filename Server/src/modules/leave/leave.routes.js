// src/modules/leave/leave.routes.js
const { Router } = require('express')
const { protect, allowRoles } = require('../../middleware/auth')
const multer = require('multer')
const path   = require('path')
const fs     = require('fs')
const ctrl   = require('./leave.controller')

const router = Router()

// ── Multer: sick certificate uploads ──────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../../uploads/certificates')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `cert_${Date.now()}${ext}`)
  },
})
const fileFilter = (_req, file, cb) => {
  const ok = /pdf|jpeg|jpg|png/.test(file.mimetype)
  ok ? cb(null, true) : cb(new Error('Only PDF, JPG and PNG allowed'), false)
}
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

const admin   = allowRoles('ADMIN')
const adminHr = allowRoles('ADMIN', 'HR_OFFICER')
const staff   = allowRoles('ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER')

// ── Employee self-service routes ───────────────────────────────────────────────
router.post('/apply',        protect, upload.single('certificate'), ctrl.applyLeave)
router.get('/me',            protect, ctrl.getMyLeaves)
router.get('/balance/me',    protect, ctrl.getMyBalance)
router.get('/types',         protect, ctrl.getLeaveTypes)

// ── Admin / HR / Payroll routes ────────────────────────────────────────────────
router.get('/',                            protect, staff,   ctrl.getAllLeaves)
router.post('/allocate',                   protect, adminHr, ctrl.allocateLeave)
router.get('/balance/:employeeId',         protect, staff,   ctrl.getEmployeeBalance)
router.get('/:id',                         protect, staff,   ctrl.getLeave)
router.patch('/:id/review',                protect, admin,   ctrl.reviewLeave)

module.exports = router
