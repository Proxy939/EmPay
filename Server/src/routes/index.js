// src/routes/index.js - Root API router
const { Router } = require('express');
const authRoutes = require('./auth.routes');

const router = Router();

router.use('/auth', authRoutes);

// Add more routes here as you build features:
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);

module.exports = router;
