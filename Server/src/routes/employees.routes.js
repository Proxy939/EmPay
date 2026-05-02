// src/routes/employees.routes.js — Employee module routes

const { Router } = require('express');
const { protect, allowRoles } = require('../middleware/auth');
const {
  getAllEmployees,
  getEmployeeById,
  getMyProfile,
  updateMyProfile,
  createEmployee,
  updateEmployee,
  addSkill,
  removeSkill,
  addCertification,
  removeCertification,
  getSalaryBreakdown,
} = require('../controllers/employees.controller');

const router = Router();

// ── All authenticated users ──────────────────────────────────────────────────
router.get('/me', protect, getMyProfile);
router.patch('/me', protect, updateMyProfile);
router.get('/', protect, getAllEmployees);
router.get('/:id', protect, getEmployeeById);

// ── Admin / HR Officer only ──────────────────────────────────────────────────
router.post('/', protect, allowRoles('ADMIN', 'HR_OFFICER'), createEmployee);
router.patch('/:id', protect, allowRoles('ADMIN', 'HR_OFFICER'), updateEmployee);

// ── Salary breakdown (Admin / Payroll only) ──────────────────────────────────
router.get('/:id/salary', protect, allowRoles('ADMIN', 'PAYROLL_OFFICER'), getSalaryBreakdown);

// ── Skills & Certifications (auth — own or admin/hr) ─────────────────────────
router.post('/:id/skills', protect, addSkill);
router.delete('/skills/:skillId', protect, removeSkill);
router.post('/:id/certifications', protect, addCertification);
router.delete('/certifications/:certId', protect, removeCertification);

module.exports = router;
