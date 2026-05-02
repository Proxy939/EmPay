// jwt.js — utility for generating and verifying JWT tokens

const jwt = require('jsonwebtoken');

// Generate a signed JWT token with userId and role in the payload
// Expires in 7 days
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { generateToken };
