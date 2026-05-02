// auth.routes.js — all authentication-related routes

const { Router } = require('express');
const { signup, login, getMe, changePassword, logout, getCompanyInfo } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = Router();

// POST /api/auth/signup — Admin self-registration
router.post('/signup', signup);

// POST /api/auth/login — Login with loginId/email + password
router.post('/login', login);

// GET /api/auth/me — Get logged-in user's profile (requires valid token)
router.get('/me', protect, getMe);

// GET /api/auth/company-info — Get company name + logo for sidebar
router.get('/company-info', protect, getCompanyInfo);

// POST /api/auth/change-password — Change own password (requires valid token)
router.post('/change-password', protect, changePassword);

// POST /api/auth/logout — Logout (requires valid token)
router.post('/logout', protect, logout);

module.exports = router;

