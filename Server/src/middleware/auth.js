// auth.js — middleware to protect routes that require a logged-in user

const jwt = require('jsonwebtoken');

// ─── protect ──────────────────────────────────────────────────────────────────
// Verifies the Bearer token in the Authorization header.
// If valid, attaches userId and role to req so controllers can use them.
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Token must be sent as: Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// ─── allowRoles ───────────────────────────────────────────────────────────────
// Usage: router.get('/something', protect, allowRoles('ADMIN', 'HR_OFFICER'), controller)
// Restricts a route to only specific roles.
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

module.exports = { protect, allowRoles };
