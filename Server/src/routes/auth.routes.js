// auth.routes.js — all authentication-related routes

const { Router } = require('express');
const { signup, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = Router();

// POST /api/auth/signup — Admin self-registration
router.post('/signup', signup);

// POST /api/auth/login — Login with email + password
router.post('/login', login);

// GET /api/auth/me — Get logged-in user's profile (requires valid token)
router.get('/me', protect, getMe);

module.exports = router;
