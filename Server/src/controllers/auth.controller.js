// auth.controller.js — handles Admin signup, login, and get profile

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { generateLoginId } = require('../utils/generateCredentials');

// ─── ADMIN SIGNUP ─────────────────────────────────────────────────────────────
// Only Admins self-register on the portal.
// All other roles (Employee, HR Officer, Payroll Officer) are created by Admin.
// Route: POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { companyName, name, email, phone, password, confirmPassword } = req.body;

    // 1. Validate all required fields are present
    if (!companyName || !name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'All fields are required: companyName, name, email, phone, password, confirmPassword',
      });
    }

    // 2. Passwords must match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // 3. Password must be at least 6 characters
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // 4. Phone must be exactly 10 digits
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be a valid 10-digit number' });
    }

    // 5. Check if email is already registered
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // 6. Check if phone is already registered
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      return res.status(409).json({ message: 'An account with this phone already exists' });
    }

    // 7. Generate the company prefix (first 2 letters of company name, uppercase)
    //    e.g. "Odoo India" → "OI"
    const companyPrefix = companyName
      .trim()
      .toUpperCase()
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2);

    // 8. Generate the Admin's Login ID using the same format as employees
    //    Format: [CompanyPrefix][FirstName2][LastName2][Year][SerialNo]
    const joiningYear = new Date().getFullYear();
    const loginId = await generateLoginId(companyPrefix, name, joiningYear);

    // 9. Hash the password (never store plain text passwords)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 10. Create the Admin user in the database
    const user = await prisma.user.create({
      data: {
        loginId,
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'ADMIN',
        companyName: companyName.trim(),
        companyPrefix,
        mustChangePassword: false, // Admin sets their own password, no forced change
      },
      // Never return the password field in the response
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyName: true,
        createdAt: true,
      },
    });

    // 11. Generate JWT token — user is logged in immediately after signup
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'Admin account created successfully',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// Accepts either loginId OR email along with password.
// Employees use their system-generated loginId.
// Route: POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { loginId, email, password } = req.body;

    // 1. Must provide either loginId or email
    if ((!loginId && !email) || !password) {
      return res.status(400).json({ message: 'Provide loginId (or email) and password' });
    }

    // 2. Find the user — search by loginId if provided, otherwise by email
    const user = await prisma.user.findFirst({
      where: loginId ? { loginId } : { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Compare provided password with the hashed password in DB
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 4. Generate JWT token
    const token = generateToken(user.id, user.role);

    // Strip password field before sending response
    const { password: _, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      mustChangePassword: user.mustChangePassword, // frontend shows change-password prompt if true
      user: safeUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
// Route: GET /api/auth/me  (requires valid JWT)
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyName: true,
        department: true,
        designation: true,
        joiningDate: true,
        basicSalary: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
