// src/routes/index.js - Root API router
const { Router } = require('express');
const authRoutes       = require('./auth.routes');
const employeeRoutes   = require('./employees.routes');
const attendanceRoutes = require('./attendance.routes');
const userRoutes       = require('./users.routes');

const router = Router();

router.use('/auth',       authRoutes);
router.use('/employees',  employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/users',      userRoutes);

module.exports = router;
