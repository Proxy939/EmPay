// auth.controller.js — handles Admin signup, login, getMe, changePassword, logout

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { generateLoginId } = require('../utils/generateCredentials');

// ─── ADMIN SIGNUP ─────────────────────────────────────────────────────────────
// Only Admins self-register on the portal.
// All other roles are created by Admin via POST /api/users.
// Route: POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { companyName, name, email, phone, password, confirmPassword } = req.body;

    // 1. Validate required fields
    if (!companyName || !name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'All fields are required: companyName, name, email, phone, password, confirmPassword',
      });
    }

    // 2. Passwords must match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // 3. Password minimum length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // 4. Phone must be 10 digits
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be a valid 10-digit number' });
    }

    // 5. Check email uniqueness
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // 6. Check phone uniqueness
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      return res.status(409).json({ message: 'An account with this phone already exists' });
    }

    // 7. Generate company prefix (first letter of each word, max 2)
    const companyPrefix = companyName
      .trim()
      .toUpperCase()
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2);

    // 8. Generate Login ID
    const joiningYear = new Date().getFullYear();
    const loginId = await generateLoginId(companyPrefix, name, joiningYear);

    // 9. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 10. Parse name into first/last
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // 11. Create User + Employee in a transaction
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
        mustChangePassword: false,
        employee: {
          create: {
            firstName,
            lastName,
            department: 'Management',
            designation: 'Administrator',
            joinDate: new Date(),
          },
        },
      },
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyName: true,
        createdAt: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, department: true, designation: true },
        },
      },
    });

    // 12. Generate JWT token
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
// Accepts loginId OR email along with password.
// Route: POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { loginId, email, password } = req.body;

    // 1. Must provide either loginId or email
    if ((!loginId && !email) || !password) {
      return res.status(400).json({ message: 'Provide loginId (or email) and password' });
    }

    // 2. Find user
    const user = await prisma.user.findFirst({
      where: loginId ? { loginId } : { email },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact your administrator.' });
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 4. Generate JWT
    const token = generateToken(user.id, user.role);

    // 5. Strip password from response
    const { password: _, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      mustChangePassword: user.mustChangePassword,
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
        mustChangePassword: true,
        isActive: true,
        createdAt: true,
        employee: {
          include: {
            skills: true,
            certifications: true,
            manager: {
              select: { id: true, firstName: true, lastName: true, designation: true },
            },
          },
        },
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

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
// Route: POST /api/auth/change-password  (any authenticated user)
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All fields are required: oldPassword, newPassword, confirmNewPassword' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// Route: POST /api/auth/logout  (any authenticated user)
const logout = async (req, res, next) => {
  try {
    // With stateless JWT, logout is handled client-side by discarding the token.
    // If we add refresh tokens later, we'd invalidate them here.
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── GET COMPANY INFO ─────────────────────────────────────────────────────────
// Route: GET /api/auth/company-info  (any authenticated user)
// Returns company name + logo for the sidebar
const getCompanyInfo = async (req, res, next) => {
  try {
    // Get company name from the logged-in user's record
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { companyName: true, companyPrefix: true },
    });

    // Get company logo from SystemConfig
    const logoConfig = await prisma.systemConfig.findUnique({
      where: { key: 'company_logo_url' },
    });

    res.json({
      companyName: user?.companyName || '',
      companyPrefix: user?.companyPrefix || '',
      companyLogo: logoConfig?.value || null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe, changePassword, logout, getCompanyInfo };
