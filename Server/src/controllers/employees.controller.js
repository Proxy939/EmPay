// src/controllers/employees.controller.js
// Handles employee listing with dynamic workStatus, profile CRUD, skills, certifications

const { prisma } = require('../config/prisma');

// ─── GET ALL EMPLOYEES (with dynamic workStatus) ─────────────────────────────
// Route: GET /api/employees?search=
const getAllEmployees = async (req, res, next) => {
  try {
    const { search } = req.query;
    const callerRole = req.userRole;

    // Build search filter
    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch all employees
    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: {
          select: { id: true, loginId: true, email: true, role: true, isActive: true },
        },
        skills: true,
        certifications: true,
      },
      orderBy: { firstName: 'asc' },
    });

    // Batch-fetch today's attendance and approved leaves for all employees
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const employeeIds = employees.map((e) => e.id);

    const [todayAttendances, todayLeaves] = await Promise.all([
      prisma.attendance.findMany({
        where: { employeeId: { in: employeeIds }, date: today },
      }),
      prisma.leaveRequest.findMany({
        where: {
          employeeId: { in: employeeIds },
          status: 'APPROVED',
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
    ]);

    // Build lookup maps
    const attendanceMap = new Map(todayAttendances.map((a) => [a.employeeId, a]));
    const leaveSet = new Set(todayLeaves.map((l) => l.employeeId));

    // Compute workStatus and strip fields by role
    const result = employees.map((emp) => {
      // 1. Compute workStatus
      let workStatus = 'ABSENT';
      if (leaveSet.has(emp.id)) {
        workStatus = 'ON_LEAVE';
      } else if (attendanceMap.has(emp.id)) {
        const att = attendanceMap.get(emp.id);
        if (att.checkIn && !att.checkOut) {
          workStatus = 'CHECKED_IN';
        } else if (att.checkIn && att.checkOut) {
          workStatus = 'CHECKED_OUT';
        }
      }

      // 2. Build response object
      const employee = { ...emp, workStatus };

      // 3. Strip salary/bank fields based on caller role
      if (callerRole === 'EMPLOYEE') {
        delete employee.bankAccountNumber;
        delete employee.bankName;
        delete employee.ifscCode;
        delete employee.panNumber;
        delete employee.uanNumber;
        delete employee.wageAmount;
      } else if (callerRole === 'HR_OFFICER') {
        delete employee.wageAmount;
      }

      return employee;
    });

    res.json({ employees: result });
  } catch (error) {
    next(error);
  }
};

// ─── GET EMPLOYEE BY ID ──────────────────────────────────────────────────────
// Route: GET /api/employees/:id
const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const callerRole = req.userRole;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, loginId: true, email: true, role: true, isActive: true },
        },
        skills: true,
        certifications: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, designation: true },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Strip fields based on role
    const result = { ...employee };
    if (callerRole === 'EMPLOYEE') {
      delete result.bankAccountNumber;
      delete result.bankName;
      delete result.ifscCode;
      delete result.panNumber;
      delete result.uanNumber;
      delete result.wageAmount;
    } else if (callerRole === 'HR_OFFICER') {
      delete result.wageAmount;
    }

    res.json({ employee: result });
  } catch (error) {
    next(error);
  }
};

// ─── GET MY PROFILE ──────────────────────────────────────────────────────────
// Route: GET /api/employees/me
const getMyProfile = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: { id: true, loginId: true, email: true, role: true, companyName: true },
        },
        skills: true,
        certifications: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, designation: true },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    // Employees can see their own full profile except salary
    const result = { ...employee };
    if (req.userRole === 'EMPLOYEE') {
      delete result.wageAmount;
    }

    res.json({ employee: result });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE MY PROFILE ──────────────────────────────────────────────────────
// Route: PATCH /api/employees/me
const updateMyProfile = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.userId },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    // Allowed self-update fields (no salary, no role-specific fields)
    const {
      phone, personalEmail, gender, maritalStatus, nationality,
      dateOfBirth, address, about, whatILove, interests, profilePhoto,
    } = req.body;

    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        ...(phone !== undefined && { phone }),
        ...(personalEmail !== undefined && { personalEmail }),
        ...(gender !== undefined && { gender }),
        ...(maritalStatus !== undefined && { maritalStatus }),
        ...(nationality !== undefined && { nationality }),
        ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
        ...(address !== undefined && { address }),
        ...(about !== undefined && { about }),
        ...(whatILove !== undefined && { whatILove }),
        ...(interests !== undefined && { interests }),
        ...(profilePhoto !== undefined && { profilePhoto }),
      },
      include: {
        user: {
          select: { id: true, loginId: true, email: true, role: true },
        },
        skills: true,
        certifications: true,
      },
    });

    res.json({ message: 'Profile updated', employee: updated });
  } catch (error) {
    next(error);
  }
};

// ─── CREATE EMPLOYEE ─────────────────────────────────────────────────────────
// Route: POST /api/employees  (Admin, HR only)
const createEmployee = async (req, res, next) => {
  try {
    const {
      userId, firstName, lastName, phone, personalEmail, gender, maritalStatus,
      nationality, dateOfBirth, address, department, designation,
      companyLocation, joinDate, managerId, about, whatILove, interests,
      bankAccountNumber, bankName, ifscCode, panNumber, uanNumber,
    } = req.body;

    if (!userId || !firstName || !lastName) {
      return res.status(400).json({ message: 'userId, firstName, and lastName are required' });
    }

    // Verify the user exists and doesn't already have an employee profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.employee) {
      return res.status(409).json({ message: 'Employee profile already exists for this user' });
    }

    const employee = await prisma.employee.create({
      data: {
        userId,
        firstName,
        lastName,
        phone,
        personalEmail,
        gender,
        maritalStatus,
        nationality,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address,
        department,
        designation,
        companyLocation,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        managerId,
        about,
        whatILove,
        interests,
        bankAccountNumber,
        bankName,
        ifscCode,
        panNumber,
        uanNumber,
      },
      include: {
        user: {
          select: { id: true, loginId: true, email: true, role: true },
        },
      },
    });

    res.status(201).json({ message: 'Employee profile created', employee });
  } catch (error) {
    next(error);
  }
};

// ─── UPDATE EMPLOYEE ─────────────────────────────────────────────────────────
// Route: PATCH /api/employees/:id  (Admin, HR only)
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const {
      firstName, lastName, phone, personalEmail, gender, maritalStatus,
      nationality, dateOfBirth, address, profilePhoto, department, designation,
      companyLocation, managerId, about, whatILove, interests,
      bankAccountNumber, bankName, ifscCode, panNumber, uanNumber,
      wageAmount, workingDaysPerWeek, breakTimeHours, empCode,
    } = req.body;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(personalEmail !== undefined && { personalEmail }),
        ...(gender !== undefined && { gender }),
        ...(maritalStatus !== undefined && { maritalStatus }),
        ...(nationality !== undefined && { nationality }),
        ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
        ...(address !== undefined && { address }),
        ...(profilePhoto !== undefined && { profilePhoto }),
        ...(department !== undefined && { department }),
        ...(designation !== undefined && { designation }),
        ...(companyLocation !== undefined && { companyLocation }),
        ...(managerId !== undefined && { managerId }),
        ...(about !== undefined && { about }),
        ...(whatILove !== undefined && { whatILove }),
        ...(interests !== undefined && { interests }),
        ...(bankAccountNumber !== undefined && { bankAccountNumber }),
        ...(bankName !== undefined && { bankName }),
        ...(ifscCode !== undefined && { ifscCode }),
        ...(panNumber !== undefined && { panNumber }),
        ...(uanNumber !== undefined && { uanNumber }),
        ...(wageAmount !== undefined && { wageAmount: parseFloat(wageAmount) }),
        ...(workingDaysPerWeek !== undefined && { workingDaysPerWeek: parseInt(workingDaysPerWeek) }),
        ...(breakTimeHours !== undefined && { breakTimeHours: parseFloat(breakTimeHours) }),
        ...(empCode !== undefined && { empCode }),
      },
      include: {
        user: {
          select: { id: true, loginId: true, email: true, role: true },
        },
        skills: true,
        certifications: true,
      },
    });

    res.json({ message: 'Employee updated', employee: updated });
  } catch (error) {
    next(error);
  }
};

// ─── SKILLS ──────────────────────────────────────────────────────────────────

const addSkill = async (req, res, next) => {
  try {
    const { id } = req.params; // employeeId
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Ownership check — employees can only edit their own skills
    if (!['ADMIN', 'HR_OFFICER'].includes(req.userRole)) {
      const self = await prisma.employee.findUnique({ where: { userId: req.userId } });
      if (!self || self.id !== id) {
        return res.status(403).json({ message: 'You can only add skills to your own profile' });
      }
    }

    const skill = await prisma.skill.create({
      data: { employeeId: id, name },
    });

    res.status(201).json({ message: 'Skill added', skill });
  } catch (error) {
    next(error);
  }
};

const removeSkill = async (req, res, next) => {
  try {
    const { skillId } = req.params;

    const skill = await prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Ownership check
    if (!['ADMIN', 'HR_OFFICER'].includes(req.userRole)) {
      const self = await prisma.employee.findUnique({ where: { userId: req.userId } });
      if (!self || self.id !== skill.employeeId) {
        return res.status(403).json({ message: 'You can only remove your own skills' });
      }
    }

    await prisma.skill.delete({ where: { id: skillId } });
    res.json({ message: 'Skill removed' });
  } catch (error) {
    next(error);
  }
};

// ─── CERTIFICATIONS ──────────────────────────────────────────────────────────

const addCertification = async (req, res, next) => {
  try {
    const { id } = req.params; // employeeId
    const { name, issuer, year } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Certification name is required' });
    }

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Ownership check
    if (!['ADMIN', 'HR_OFFICER'].includes(req.userRole)) {
      const self = await prisma.employee.findUnique({ where: { userId: req.userId } });
      if (!self || self.id !== id) {
        return res.status(403).json({ message: 'You can only add certifications to your own profile' });
      }
    }

    const cert = await prisma.certification.create({
      data: { employeeId: id, name, issuer, year },
    });

    res.status(201).json({ message: 'Certification added', certification: cert });
  } catch (error) {
    next(error);
  }
};

const removeCertification = async (req, res, next) => {
  try {
    const { certId } = req.params;

    const cert = await prisma.certification.findUnique({ where: { id: certId } });
    if (!cert) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    // Ownership check
    if (!['ADMIN', 'HR_OFFICER'].includes(req.userRole)) {
      const self = await prisma.employee.findUnique({ where: { userId: req.userId } });
      if (!self || self.id !== cert.employeeId) {
        return res.status(403).json({ message: 'You can only remove your own certifications' });
      }
    }

    await prisma.certification.delete({ where: { id: certId } });
    res.json({ message: 'Certification removed' });
  } catch (error) {
    next(error);
  }
};

// ─── SALARY BREAKDOWN (computed from wageAmount) ─────────────────────────────
// Route: GET /api/employees/:id/salary  (Admin, Payroll only)
// Computes Indian salary structure from monthly wage
const getSalaryBreakdown = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, wageAmount: true,
                workingDaysPerWeek: true, breakTimeHours: true },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const wage = employee.wageAmount; // monthly wage

    // Salary Components (standard Indian percentages)
    const basic             = +(wage * 0.50).toFixed(2);         // 50% of wage
    const hra               = +(basic * 0.50).toFixed(2);        // 50% of basic
    const standardAllowance = 4167;                               // fixed ₹4167
    const performanceBonus  = +(wage * 0.0833).toFixed(2);       // 8.33%
    const lta               = +(wage * 0.0833).toFixed(2);       // 8.33%
    const totalDefined      = basic + hra + standardAllowance + performanceBonus + lta;
    const fixedAllowance    = +(wage - totalDefined).toFixed(2); // remainder

    // PF Contribution (12% of basic each side)
    const pfEmployee  = +(basic * 0.12).toFixed(2);
    const pfEmployer  = +(basic * 0.12).toFixed(2);

    // Tax Deductions
    const professionalTax = 200; // fixed ₹200/month

    // Gross & Net
    const grossSalary = wage;
    const totalDeductions = pfEmployee + professionalTax;
    const netSalary   = +(grossSalary - totalDeductions).toFixed(2);

    res.json({
      employee: { id: employee.id, name: `${employee.firstName} ${employee.lastName}` },
      monthlyWage: wage,
      yearlyWage: +(wage * 12).toFixed(2),
      workingDaysPerWeek: employee.workingDaysPerWeek,
      breakTimeHours: employee.breakTimeHours,
      components: {
        basic:             { amount: basic,             percent: 50,    desc: 'Basic salary from company cost compute, based on monthly wages' },
        hra:               { amount: hra,               percent: 50,    desc: 'HRA provided to employees, 50% of the basic salary' },
        standardAllowance: { amount: standardAllowance, percent: +(standardAllowance / wage * 100).toFixed(2), desc: 'A fixed amount provided to employee as part of their salary' },
        performanceBonus:  { amount: performanceBonus,  percent: 8.33,  desc: 'Variable amount paid during payroll, defined by company' },
        lta:               { amount: lta,               percent: 8.33,  desc: 'LTA is paid by the company to employees to cover travel expenses' },
        fixedAllowance:    { amount: fixedAllowance,    percent: +(fixedAllowance / wage * 100).toFixed(2), desc: 'Remaining portion of wages after calculating all components' },
      },
      pf: {
        employee: { amount: pfEmployee, percent: 12, desc: 'PF is calculated based on the basic salary' },
        employer: { amount: pfEmployer, percent: 12, desc: 'PF is calculated based on the basic salary' },
      },
      tax: {
        professionalTax: { amount: professionalTax, desc: 'Professional Tax deducted from the gross salary' },
      },
      grossSalary,
      totalDeductions,
      netSalary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
