// src/controllers/users.controller.js
// Admin / HR creates new users with auto-generated credentials

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');
const { generateLoginId, generatePassword } = require('../utils/generateCredentials');
const { sendWelcomeEmail } = require('../utils/mailer');

// ─── CREATE USER ──────────────────────────────────────────────────────────────
// Route: POST /api/users  (ADMIN, HR_OFFICER only)
// Body: { name, email, phone, role, department, designation, joinDate }
// Returns: generated loginId + plaintext password (shown once only)
const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, role, department, designation, joinDate } = req.body;

    // 1. Validate required fields
    if (!name || !email || !phone || !role) {
      return res.status(400).json({ message: 'name, email, phone, and role are required' });
    }

    // 2. Only valid roles can be created this way
    const allowedRoles = ['EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${allowedRoles.join(', ')}` });
    }

    // 3. HR Officers cannot create other HR Officers or above
    if (req.userRole === 'HR_OFFICER' && role !== 'EMPLOYEE') {
      return res.status(403).json({ message: 'HR Officers can only create Employee accounts' });
    }

    // 4. Phone validation
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be a valid 10-digit number' });
    }

    // 5. Check email uniqueness
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) return res.status(409).json({ message: 'An account with this email already exists' });

    // 6. Check phone uniqueness
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) return res.status(409).json({ message: 'An account with this phone already exists' });

    // 7. Get calling admin's company info
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { companyName: true, companyPrefix: true },
    });
    if (!admin) return res.status(404).json({ message: 'Admin user not found' });

    // 8. Generate credentials
    const year = new Date().getFullYear();
    const loginId = await generateLoginId(admin.companyPrefix, name, year);
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 9. Parse first/last name
    const nameParts  = name.trim().split(' ');
    const firstName  = nameParts[0];
    const lastName   = nameParts.slice(1).join(' ') || nameParts[0];

    // 10. Create User + Employee in one go
    const user = await prisma.user.create({
      data: {
        loginId,
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        companyName:   admin.companyName,
        companyPrefix: admin.companyPrefix,
        mustChangePassword: true,
        employee: {
          create: {
            firstName,
            lastName,
            department:  department  || null,
            designation: designation || null,
            joinDate:    joinDate ? new Date(joinDate) : new Date(),
          },
        },
      },
      select: {
        id: true, loginId: true, name: true, email: true,
        phone: true, role: true, companyName: true,
        mustChangePassword: true, createdAt: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, department: true, designation: true, joinDate: true },
        },
      },
    });

    // 11. Send welcome email with credentials (non-blocking — failure won't break user creation)
    const emailResult = await sendWelcomeEmail({
      to:          email,
      name:        firstName,
      loginId,
      password:    plainPassword,
      companyName: admin.companyName,
    });

    // ⚠️ plainPassword returned ONCE — share manually if email fails
    res.status(201).json({
      message:     'User created successfully',
      emailSent:   emailResult.success,
      credentials: { loginId, password: plainPassword },
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── LIST ALL USERS ───────────────────────────────────────────────────────────
// Route: GET /api/users  (ADMIN only)
const listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, loginId: true, name: true, email: true,
        phone: true, role: true, isActive: true, createdAt: true,
        employee: { select: { id: true, department: true, designation: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// ─── TOGGLE ACTIVE STATUS ─────────────────────────────────────────────────────
// Route: PATCH /api/users/:id/toggle-active  (ADMIN only)
const toggleActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });
    res.json({ message: `User ${updated.isActive ? 'activated' : 'deactivated'}`, user: updated });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE ROLE ─────────────────────────────────────────────────────────────
// Route: PATCH /api/users/:id/role  (ADMIN only)
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowed = ['EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'ADMIN'];
    if (!role || !allowed.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${allowed.join(', ')}` });
    }

    // Prevent admin from changing their own role
    if (id === req.userId) {
      return res.status(403).json({ message: 'You cannot change your own role' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, loginId: true, email: true, role: true },
    });

    res.json({ message: `Role updated to ${role}`, user: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, listUsers, toggleActive, updateRole };
