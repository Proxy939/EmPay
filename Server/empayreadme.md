# EmPay – Smart HRMS Backend Roadmap
> Complete step-by-step backend build guide  
> **Stack:** Node.js (Express) · PostgreSQL · Prisma ORM · JWT Auth  
> This document is self-contained — paste it into any chat and the AI will know the full context.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack & Versions](#2-tech-stack--versions)
3. [Roles & Access Matrix](#3-roles--access-matrix)
4. [Screen Inventory](#4-screen-inventory)
5. [Folder Structure](#5-folder-structure)
6. [Phase 1 – Project Initialization](#phase-1--project-initialization)
7. [Phase 2 – Database Schema (Prisma)](#phase-2--database-schema-prisma)
8. [Phase 3 – Authentication Module](#phase-3--authentication-module)
9. [Phase 4 – User & Role Management Module](#phase-4--user--role-management-module)
10. [Phase 5 – Employee Module](#phase-5--employee-module)
11. [Phase 6 – Attendance Module](#phase-6--attendance-module)
12. [Phase 7 – Time Off / Leave Module](#phase-7--time-off--leave-module)
13. [Phase 8 – Payroll Module](#phase-8--payroll-module)
14. [Phase 9 – Reports Module](#phase-9--reports-module)
15. [Phase 10 – Dashboard & Analytics Module](#phase-10--dashboard--analytics-module)
16. [Phase 11 – Settings Module](#phase-11--settings-module)
17. [Middleware Reference](#middleware-reference)
18. [Business Logic Rules](#business-logic-rules)
19. [Environment Variables](#environment-variables)
20. [API Endpoint Master List](#api-endpoint-master-list)
21. [Error Handling Convention](#error-handling-convention)
22. [Build Order Checklist](#build-order-checklist)

---

## 1. Project Overview

**EmPay** is an all-in-one Human Resource Management System (HRMS) for startups, institutions, and SMEs. The backend is a RESTful API that powers:

- Role-based user authentication (4 roles) with system-generated login IDs
- Employee profile management with bank details, skills, certifications, and manager links
- Attendance tracking (check-in / check-out) with extra hours calculation
- Leave application and approval workflows with sick leave certificate attachments
- Salary structure configuration per employee (component-based, wage-driven)
- Payroll calculation with PF and Professional Tax deductions, bulk payrun for all employees
- Payslip PDF generation with amount in words, employer cost summaries
- Payroll health warnings (missing bank account, missing manager)
- Salary statement reports (monthly + yearly breakdown per employee)
- Module-level permission management via Settings screen
- Dashboard analytics with employer cost and employee count charts

All payroll calculations are **attendance-driven** — the payrun amount is derived from attendance records, approved leaves, and applicable deductions for a given pay period.

---

## 2. Tech Stack & Versions

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js v20+ | LTS recommended |
| Framework | Express.js v4 | REST API |
| Language | TypeScript | Strongly recommended for type safety |
| ORM | Prisma v5 | Schema-first, type-safe |
| Database | PostgreSQL v15+ | Primary data store |
| Auth | JWT (jsonwebtoken) + bcryptjs | Access + Refresh tokens |
| Validation | Zod | Request body/param validation |
| Email | Nodemailer | System-generated password delivery |
| File Export | pdfkit or puppeteer | Payslip PDF generation |
| File Upload | Multer | Sick leave certificate attachments |
| Env | dotenv | Environment config |
| Dev Tools | nodemon, ts-node | Hot reload in dev |
| Testing | Jest + Supertest | Unit + Integration tests |

---

## 3. Roles & Access Matrix

There are **4 roles**. Every protected route must check the authenticated user's role.

| Permission | Admin | HR Officer | Payroll Officer | Employee |
|---|:---:|:---:|:---:|:---:|
| Manage users & roles | ✅ | ❌ | ❌ | ❌ |
| Configure module-level permissions | ✅ | ❌ | ❌ | ❌ |
| Create/edit employee profiles | ✅ | ✅ | ❌ | ❌ |
| View all employee profiles | ✅ | ✅ | ✅ | ✅ (read-only) |
| Edit own profile (non-salary) | ✅ | ✅ | ✅ | ✅ |
| View/edit salary info tab | ✅ | ❌ | ✅ | ❌ |
| View bank details | ✅ | ✅ | ✅ | ❌ |
| View all attendance | ✅ | ✅ | ✅ | ❌ |
| Mark own attendance | ✅ | ✅ | ✅ | ✅ |
| Allocate leave balances | ✅ | ✅ | ❌ | ❌ |
| Apply for leave | ✅ | ✅ | ✅ | ✅ |
| Approve/reject leave | ✅ | ❌ | ✅ | ❌ |
| View own leave status | ✅ | ✅ | ✅ | ✅ |
| Access payroll data | ✅ | ❌ | ✅ | ❌ |
| Generate/edit payroll | ✅ | ❌ | ✅ | ❌ |
| Access reports (Salary Statement) | ✅ | ❌ | ✅ | ❌ |
| Access system settings | ✅ | ❌ | ❌ | ❌ |
| View dashboard analytics | ✅ | ❌ | ✅ | ❌ |

> **Important:** Salary info tab (wage, components, PF, etc.) is visible ONLY to Admin and Payroll Officer.  
> Employees cannot access payroll, salary, or reports at all.  
> Bank details are visible to Admin, HR Officer, and Payroll Officer — NOT to Employees.

---

## 4. Screen Inventory

Complete list of all screens and what each requires from the backend.

### 4.1 Sign In / Sign Up & Password Screens

**Sign In Page**
- Fields: `loginId` (system-generated ID, not email) and `password`
- Logic: If user has never changed their system password (`isPasswordChanged = false`), force redirect to Change Password screen after login
- After successful login → user lands on Employees (Dashboard) page

**Sign Up / Account Creation**
- ⚠️ Normal users CANNOT self-register
- Only Admin or HR Officer can create a new employee account
- When HR/Admin creates an employee, the system auto-generates a `loginId` and an initial password, then sends both to the employee via email

**System Login ID Format**
```
Format: OI + [first 2 letters of firstName] + [first 2 letters of lastName] + [4-digit year of joining] + [4-digit serial zero-padded]
Example: firstName="John", lastName="Doe", joinYear=2022, serial=1 → OIJODO20220001
```

**Change Password Screen**
- Fields: `oldPassword`, `newPassword`, `confirmNewPassword`
- On success: sets `isPasswordChanged = true` on the User record
- Admin reset: Admin can reset any employee's password back to a system-generated one (no old password needed)

---

### 4.2 Employees Screen (Directory / Dashboard)

**Employee Card Data (returned per employee):**
- Profile picture URL
- Name, designation, department
- `workStatus` field:
  - `CHECKED_IN` → Green dot (checked in today)
  - `ON_LEAVE` → Airplane icon (has approved leave today)
  - `ABSENT` → Yellow dot (no leave applied, not checked in)
  - `CHECKED_OUT` → Neutral (checked out for the day)

**Backend must return `workStatus` dynamically** by checking today's attendance + approved leaves when fetching the employee list.

---

### 4.3 My Profile Screen (Employee Form)

Three tabs: **Private Info**, **Resume**, **Salary Info**

**Private Info Tab fields:**
- Name, Mobile, Email (work), Department, Job Position
- Manager (`managerId` → linked to another Employee)
- Company Location, Date of Birth, Residing Address
- Personal Email, Gender, Nationality, Marital Status
- Text areas: `about`, `whatILove` (What I love about my job), `interests` (My interests and hobbies)

**Bank Details Section (within Private Info):**
- Account Number, Bank Name, IFSC Code, PAN No, UAN No
- ⚠️ If bank details are missing → backend must flag this employee in payroll warnings

**Resume Tab:**
- Skills: list of skill strings; endpoint to add/remove individual skills
- Certifications: list of certification objects (name, issuer, year)

**Salary Info Tab:**
- Visible ONLY to Admin and Payroll Officer (enforced server-side)
- Contains salary structure configuration (see Phase 8 for full details)

---

### 4.4 Attendance Screen

**Per-record columns:** Date, Day, Check In time, Check Out time, Work Hours, **Extra Hours**
- Extra Hours = `workingHours - standardDailyHours` (negative = short, positive = overtime)
- Standard daily hours is a system config value (default: 8 hours)
- Break tracking: store `breakStart` and `breakEnd` timestamps, deduct from `workingHours`

**Employee view:** Own attendance for the ongoing month by default
**Admin/HR/Payroll view:** All employees currently present on the current day (live status)

---

### 4.5 Time Off Screen

**Balances Dashboard:**
- Shows: `{N} Days Available Paid Time Off`, `{N} Days Available Sick Time Off`
- Balances fetched from `LeaveBalance` table per employee per year

**Leave Request Form fields:**
- Employee Name, Time Off Type (PAID / SICK / UNPAID)
- From date, To date, Total Days (auto-calculated)
- Note / reason
- `attachmentUrl` — required for SICK leave (sick certificate upload)

**Employee view:** Own leave requests only
**Admin / Payroll Officer view:** All employees' leave requests + Approve and Reject action buttons

---

### 4.6 Payroll Screen

**Access:** Admin and Payroll Officer only

**Payroll Dashboard Warnings Section:**
Returns dynamic alerts:
- `"N employee(s) without bank account"` — employees with missing bank details
- `"N employee(s) without manager"` — employees with `managerId = null`
These are blocking warnings — payroll for flagged employees cannot be finalized without resolution.

**Statistics Charts:**
- Employer Cost: monthly view (current month) and annual view (12-month)
- Employee Count: monthly and annual breakdown
Data provided as arrays for frontend charting

**Payrun Feature:**
- Generates payslips for ALL active employees at once for a selected month/year
- Displays: Employer Cost, Gross Wage, Net Wage, Status (`DRAFT` → `PROCESSING` → `COMPLETED` / `Done`)

**Individual Payslip View (Salary Computation Breakdown):**
- Shows each salary component as a row: Rule name, Computation type (% or Fixed), Rate/%, Amount
- Action buttons: `Compute New Payslip`, `Cancel`, `Print`

**Payslip PDF — Required fields:**
- Company Logo (from settings/config)
- Employee: Name, Employee Code (`loginId`), Department, Company Location, Date of Joining
- Financial: Bank Account No, PAN No, UAN No
- Period: Pay Period (month/year), Pay Date
- Attendance: Total Working Days, Worked Days
- Earnings table: Basic, HRA, Standard Allowance, Performance Bonus, LTA, Fixed Allowance
- Deductions table: PF (Employee), PF (Employer), Professional Tax, TDS (if applicable)
- **Net Payable Amount: numeric value AND spelled out in words** (e.g., "Thirty Five Thousand Eight Hundred Only")

---

### 4.7 Reports Screen

**Access:** Admin and Payroll Officer only

**Salary Statement Report:**
- Filters: Select Employee (dropdown) + Select Year
- Output table:
  - Rows: each salary component (Basic, HRA, Standard Allowance, etc.) + Deductions + Net
  - Columns: Component Name | Jan | Feb | Mar | ... | Dec | **Yearly Total**
- Essentially shows month-by-month breakdown of each payslip component for the full year

---

### 4.8 Settings Screen

**Access:** Admin only

**Module-Level Access Rights Configuration:**
- Admin can configure exactly what each role is allowed or restricted from accessing, on a per-module basis
- Modules: Employees, Attendance, Time Off, Payroll, Reports
- For each module + role combination: define allowed actions (view, create, edit, delete, approve)
- Stored in a `ModulePermission` table in the database
- Middleware reads permissions from DB (or cache) on every request

---

## 5. Folder Structure

```
empay-backend/
├── prisma/
│   ├── schema.prisma          # All DB models
│   ├── seed.ts                # Seed admin user + default permissions
│   └── migrations/            # Auto-generated by Prisma
│
├── src/
│   ├── index.ts               # App entry point
│   ├── app.ts                 # Express app setup, middleware registration
│   │
│   ├── config/
│   │   └── prisma.ts          # Prisma client singleton
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # verifyToken – checks JWT
│   │   ├── role.middleware.ts       # allowRoles(...roles) – static RBAC guard
│   │   ├── permission.middleware.ts # checkModulePermission – dynamic DB-driven guard
│   │   └── validate.middleware.ts   # Zod schema validator wrapper
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.schema.ts
│   │   │
│   │   ├── employees/
│   │   │   ├── employees.routes.ts
│   │   │   ├── employees.controller.ts
│   │   │   ├── employees.service.ts
│   │   │   └── employees.schema.ts
│   │   │
│   │   ├── attendance/
│   │   │   ├── attendance.routes.ts
│   │   │   ├── attendance.controller.ts
│   │   │   ├── attendance.service.ts
│   │   │   └── attendance.schema.ts
│   │   │
│   │   ├── leaves/
│   │   │   ├── leaves.routes.ts
│   │   │   ├── leaves.controller.ts
│   │   │   ├── leaves.service.ts
│   │   │   └── leaves.schema.ts
│   │   │
│   │   ├── payroll/
│   │   │   ├── payroll.routes.ts
│   │   │   ├── payroll.controller.ts
│   │   │   ├── payroll.service.ts
│   │   │   ├── payroll.schema.ts
│   │   │   └── payslip.generator.ts  # PDF generation + amount-in-words
│   │   │
│   │   ├── reports/
│   │   │   ├── reports.routes.ts
│   │   │   ├── reports.controller.ts
│   │   │   └── reports.service.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   └── dashboard.service.ts
│   │   │
│   │   └── settings/
│   │       ├── settings.routes.ts
│   │       ├── settings.controller.ts
│   │       └── settings.service.ts
│   │
│   └── utils/
│       ├── ApiError.ts           # Custom error class
│       ├── ApiResponse.ts        # Standard response wrapper
│       ├── asyncHandler.ts       # try/catch wrapper for async controllers
│       ├── loginId.generator.ts  # System login ID generation logic
│       ├── password.generator.ts # Random initial password generation
│       ├── amount.inwords.ts     # Number → Indian English words (for payslip)
│       ├── email.service.ts      # Nodemailer wrapper for sending credentials
│       └── payroll.helpers.ts    # PF, Prof. Tax, Extra Hours calculation functions
│
├── uploads/                   # Multer destination for sick leave attachments
├── generated/
│   └── payslips/              # Generated PDF files
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Phase 1 – Project Initialization

**Goal:** Get a running Express server connected to PostgreSQL via Prisma.

### Steps

**1.1 — Init project**
```bash
mkdir empay-backend && cd empay-backend
npm init -y
npm install express prisma @prisma/client dotenv jsonwebtoken bcryptjs zod cors multer nodemailer pdfkit
npm install -D typescript ts-node nodemon @types/express @types/node @types/jsonwebtoken @types/bcryptjs @types/multer @types/nodemailer @types/pdfkit
npx tsc --init
npx prisma init
```

**1.2 — tsconfig.json** (key settings)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**1.3 — src/app.ts**
```typescript
import express from 'express';
import cors from 'cors';
import authRoutes     from './modules/auth/auth.routes';
import userRoutes     from './modules/users/users.routes';
import employeeRoutes from './modules/employees/employees.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import leavesRoutes   from './modules/leaves/leaves.routes';
import payrollRoutes  from './modules/payroll/payroll.routes';
import reportsRoutes  from './modules/reports/reports.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import settingsRoutes from './modules/settings/settings.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/employees',  employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves',     leavesRoutes);
app.use('/api/payroll',    payrollRoutes);
app.use('/api/reports',    reportsRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/settings',   settingsRoutes);

export default app;
```

**1.4 — package.json scripts**
```json
"scripts": {
  "dev":         "nodemon --exec ts-node src/index.ts",
  "build":       "tsc",
  "start":       "node dist/index.js",
  "db:migrate":  "prisma migrate dev",
  "db:studio":   "prisma studio",
  "db:seed":     "ts-node prisma/seed.ts"
}
```

---

## Phase 2 – Database Schema (Prisma)

**Goal:** Define all models. This is the single source of truth.

**File: `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ─────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  HR_OFFICER
  PAYROLL_OFFICER
  EMPLOYEE
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum MaritalStatus {
  SINGLE
  MARRIED
  DIVORCED
  WIDOWED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  HALF_DAY
  LATE
  ON_LEAVE
}

enum LeaveType {
  PAID
  SICK
  UNPAID
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
}

enum PayrunStatus {
  DRAFT
  PROCESSING
  COMPLETED
}

enum WorkStatus {
  CHECKED_IN
  CHECKED_OUT
  ON_LEAVE
  ABSENT
}

enum ComputationType {
  FIXED_AMOUNT
  PERCENTAGE_OF_WAGE
  PERCENTAGE_OF_BASIC
}

enum ModuleName {
  EMPLOYEES
  ATTENDANCE
  TIME_OFF
  PAYROLL
  REPORTS
  SETTINGS
}

enum PermissionAction {
  VIEW
  CREATE
  EDIT
  DELETE
  APPROVE
}

// ─── User (Auth identity) ───────────────────────────────────────────────

model User {
  id                 String    @id @default(uuid())
  loginId            String    @unique   // System-generated: OI + initials + year + serial
  email              String    @unique   // Work email
  passwordHash       String
  isPasswordChanged  Boolean   @default(false)  // Force change on first login
  role               Role      @default(EMPLOYEE)
  isActive           Boolean   @default(true)
  refreshToken       String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  employee           Employee?

  @@map("users")
}

// ─── Employee Profile ───────────────────────────────────────────────────

model Employee {
  id               String         @id @default(uuid())
  userId           String         @unique
  user             User           @relation(fields: [userId], references: [id])

  // Basic Info
  firstName        String
  lastName         String
  phone            String?
  personalEmail    String?
  gender           Gender?
  maritalStatus    MaritalStatus?
  nationality      String?
  dateOfBirth      DateTime?
  address          String?        // Residing address
  profilePhoto     String?        // URL

  // Work Info
  department       String?
  designation      String?        // Job Position
  companyLocation  String?
  joinDate         DateTime       @default(now())

  // Manager (self-referential)
  managerId        String?
  manager          Employee?      @relation("ManagerSubordinates", fields: [managerId], references: [id])
  subordinates     Employee[]     @relation("ManagerSubordinates")

  // Bio text areas
  about            String?
  whatILove        String?        // "What I love about my job"
  interests        String?        // "My interests and hobbies"

  // Bank Details
  bankAccountNumber String?
  bankName          String?
  ifscCode          String?
  panNumber         String?
  uanNumber         String?

  // Salary Info — visible ONLY to Admin / Payroll Officer
  wageAmount        Decimal       @default(0) @db.Decimal(12, 2)  // The base defined wage

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  // Relations
  skills           Skill[]
  certifications   Certification[]
  salaryComponents SalaryComponent[]
  attendances      Attendance[]
  leaveBalances    LeaveBalance[]
  leaveRequests    LeaveRequest[]
  payslips         Payslip[]

  @@map("employees")
}

// ─── Skill ──────────────────────────────────────────────────────────────

model Skill {
  id          String   @id @default(uuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  name        String

  @@map("skills")
}

// ─── Certification ──────────────────────────────────────────────────────

model Certification {
  id          String   @id @default(uuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  name        String
  issuer      String?
  year        Int?

  @@map("certifications")
}

// ─── Salary Component (per employee, configurable) ──────────────────────
// Stores the salary structure rules per employee.
// Each component can be earnings or deduction, fixed or percentage-based.

model SalaryComponent {
  id              String          @id @default(uuid())
  employeeId      String
  employee        Employee        @relation(fields: [employeeId], references: [id])

  name            String          // e.g. "Basic", "HRA", "PF Employee"
  isEarning       Boolean         @default(true)   // false = deduction
  computationType ComputationType
  value           Decimal         @db.Decimal(8, 4) // Either fixed amount OR percentage value
  // If FIXED_AMOUNT: value is the rupee amount
  // If PERCENTAGE_OF_WAGE: value = 50 means 50% of wageAmount
  // If PERCENTAGE_OF_BASIC: value = 12 means 12% of computed Basic

  sortOrder       Int             @default(0)      // Display order in payslip
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@map("salary_components")
}

// ─── Attendance ─────────────────────────────────────────────────────────

model Attendance {
  id             String           @id @default(uuid())
  employeeId     String
  employee       Employee         @relation(fields: [employeeId], references: [id])

  date           DateTime         @db.Date
  checkIn        DateTime?
  breakStart     DateTime?        // Optional break tracking
  breakEnd       DateTime?
  checkOut       DateTime?
  workingHours   Decimal?         @db.Decimal(4, 2)  // Net hours (minus breaks)
  extraHours     Decimal?         @db.Decimal(4, 2)  // workingHours - standardDailyHours (can be negative)
  status         AttendanceStatus @default(PRESENT)
  notes          String?

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@unique([employeeId, date])
  @@map("attendances")
}

// ─── Leave Balance ──────────────────────────────────────────────────────

model LeaveBalance {
  id             String    @id @default(uuid())
  employeeId     String
  employee       Employee  @relation(fields: [employeeId], references: [id])

  leaveType      LeaveType
  totalDays      Int       @default(0)
  usedDays       Int       @default(0)
  year           Int

  @@unique([employeeId, leaveType, year])
  @@map("leave_balances")
}

// ─── Leave Request ──────────────────────────────────────────────────────

model LeaveRequest {
  id             String      @id @default(uuid())
  employeeId     String
  employee       Employee    @relation(fields: [employeeId], references: [id])

  leaveType      LeaveType
  startDate      DateTime    @db.Date
  endDate        DateTime    @db.Date
  totalDays      Int
  reason         String?
  attachmentUrl  String?     // Required for SICK leave — uploaded certificate
  status         LeaveStatus @default(PENDING)

  reviewedById   String?
  reviewedAt     DateTime?
  rejectionNote  String?

  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@map("leave_requests")
}

// ─── Payrun (Pay Period / Cycle) ────────────────────────────────────────

model Payrun {
  id             String       @id @default(uuid())
  month          Int          // 1–12
  year           Int
  status         PayrunStatus @default(DRAFT)
  processedAt    DateTime?
  createdById    String

  // Aggregates computed at generation time
  totalGrossWage   Decimal?   @db.Decimal(14, 2)
  totalNetWage     Decimal?   @db.Decimal(14, 2)
  totalEmployerCost Decimal?  @db.Decimal(14, 2) // grossWage + employer PF contributions

  payslips         Payslip[]

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([month, year])
  @@map("payruns")
}

// ─── Payslip ────────────────────────────────────────────────────────────

model Payslip {
  id               String   @id @default(uuid())
  payrunId         String
  payrun           Payrun   @relation(fields: [payrunId], references: [id])
  employeeId       String
  employee         Employee @relation(fields: [employeeId], references: [id])

  // Attendance snapshot
  totalWorkingDays Int
  workedDays       Int
  paidLeaveDays    Int
  unpaidLeaveDays  Int

  // Earnings snapshot (computed from SalaryComponents at generation time)
  basicSalary      Decimal  @db.Decimal(12, 2)
  hra              Decimal  @db.Decimal(12, 2)
  standardAllowance Decimal @db.Decimal(12, 2)
  performanceBonus Decimal  @db.Decimal(12, 2)
  lta              Decimal  @db.Decimal(12, 2)  // Leave Travel Allowance
  fixedAllowance   Decimal  @db.Decimal(12, 2)  // wage - sum of all other earnings
  grossSalary      Decimal  @db.Decimal(12, 2)

  // Deductions snapshot
  pfEmployee       Decimal  @db.Decimal(12, 2)  // 12% of basic
  pfEmployer       Decimal  @db.Decimal(12, 2)  // 12% of basic (employer share — for employer cost)
  professionalTax  Decimal  @db.Decimal(12, 2)
  tds              Decimal  @default(0) @db.Decimal(12, 2)
  unpaidDeduction  Decimal  @db.Decimal(12, 2)
  totalDeductions  Decimal  @db.Decimal(12, 2)

  netPay           Decimal  @db.Decimal(12, 2)
  netPayInWords    String   // e.g. "Thirty Five Thousand Eight Hundred Only"

  pdfUrl           String?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([payrunId, employeeId])
  @@map("payslips")
}

// ─── Module Permission (Settings) ───────────────────────────────────────
// Admin configures what each role can do per module.

model ModulePermission {
  id       String           @id @default(uuid())
  module   ModuleName
  role     Role
  action   PermissionAction
  allowed  Boolean          @default(true)

  @@unique([module, role, action])
  @@map("module_permissions")
}

// ─── System Config ──────────────────────────────────────────────────────
// Key-value store for org-wide settings (company name, logo URL, standard hours, etc.)

model SystemConfig {
  key       String  @id
  value     String
  updatedAt DateTime @updatedAt

  @@map("system_config")
}
```

**After writing schema:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Seed file (`prisma/seed.ts`) must:**
1. Create a default Admin user with loginId `OIADMI20240001`
2. Seed default `ModulePermission` rows for all 4 roles × all modules × all actions
3. Seed `SystemConfig` with keys: `company_name`, `company_logo_url`, `standard_daily_hours` (default: `8`), `joining_serial_counter` (default: `1`)

---

## Phase 3 – Authentication Module

**Goal:** System-ID-based login, forced first-login password change, JWT tokens, email delivery of credentials.

### Files: `src/modules/auth/`

**auth.schema.ts**
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  loginId: z.string().min(1),  // System-generated ID, not email
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

export const adminResetPasswordSchema = z.object({
  userId: z.string().uuid(),
  // No oldPassword needed — admin bypasses this
});
```

**`src/utils/loginId.generator.ts`**
```typescript
// generateLoginId(firstName, lastName, joinYear, serial) → string
// Format: OI + first2(firstName) + first2(lastName) + joinYear + zeroPad(serial, 4)
// Example: generateLoginId("John", "Doe", 2022, 1) → "OIJODO20220001"
// The serial is pulled from SystemConfig key 'joining_serial_counter', then incremented atomically
```

**`src/utils/password.generator.ts`**
```typescript
// generateInitialPassword() → string
// Returns a random 10-char alphanumeric string used as the first-time password
```

**`src/utils/email.service.ts`**
```typescript
// sendCredentialsEmail(email, loginId, initialPassword) → void
// Sends a formatted email with the employee's system login ID and initial password
// Uses Nodemailer with SMTP config from .env
```

**auth.service.ts** — Key functions
```typescript
// login(loginId, password)
//   → find User by loginId
//   → verify bcrypt password
//   → return { accessToken, refreshToken, isPasswordChanged }
//   → if isPasswordChanged = false, include forcePasswordChange: true in response

// changePassword(userId, oldPassword, newPassword)
//   → verify oldPassword matches hash
//   → update passwordHash
//   → set isPasswordChanged = true

// adminResetPassword(targetUserId)
//   → generate new initial password
//   → update passwordHash, set isPasswordChanged = false
//   → send new credentials via email

// refreshTokens(refreshToken)
//   → verify refresh JWT, issue new pair

// logout(userId)
//   → clear refreshToken in DB
```

**Token strategy:**
- Access Token: JWT, expires `15m`, payload `{ userId, role, loginId }`
- Refresh Token: JWT, expires `7d`, stored hashed in `users.refreshToken`

**auth.routes.ts**
```
POST /api/auth/login              → Public
POST /api/auth/refresh            → Public
POST /api/auth/logout             → Protected (any authenticated user)
POST /api/auth/change-password    → Protected (any authenticated user)
POST /api/auth/reset-password     → Admin only — reset any user's password
```

---

## Phase 4 – User & Role Management Module

**Goal:** Admin creates employee accounts (no self-registration), manages roles, activates/deactivates users.

### Files: `src/modules/users/`

**users.service.ts** — Key functions
```typescript
// createUserAccount(data)
//   → Called by Admin / HR Officer when creating a new employee
//   → Generates loginId using loginId.generator.ts (reads + increments SystemConfig serial)
//   → Generates initial password via password.generator.ts
//   → Creates User record with isPasswordChanged = false
//   → Sends credentials email to the employee's email address
//   → Returns created User (without passwordHash)

// getAllUsers()       → paginated list with role
// getUserById(id)    → single user
// updateUserRole(id, role)   → Admin only
// toggleUserActive(id)       → Admin only
// deleteUser(id)             → Admin only
```

**users.routes.ts**
```
POST   /api/users                  → Admin, HR Officer — create user account + send email
GET    /api/users                  → Admin — list all users
GET    /api/users/me               → Auth — own user record
PATCH  /api/users/me               → Auth — update own email
GET    /api/users/:id              → Admin — single user
PATCH  /api/users/:id/role         → Admin — change role
PATCH  /api/users/:id/status       → Admin — activate/deactivate
DELETE /api/users/:id              → Admin — delete user
```

---

## Phase 5 – Employee Module

**Goal:** Full employee profile CRUD including bank details, manager, skills, certifications, bio text areas. Salary tab restricted to Admin/Payroll. `workStatus` returned dynamically on list.

### Files: `src/modules/employees/`

**employees.schema.ts**
```typescript
export const createEmployeeSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  personalEmail: z.string().email().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  companyLocation: z.string().optional(),
  joinDate: z.string().datetime().optional(),
  managerId: z.string().uuid().optional(),
  about: z.string().optional(),
  whatILove: z.string().optional(),
  interests: z.string().optional(),
  // Bank details
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  uanNumber: z.string().optional(),
});

export const updateSalaryStructureSchema = z.object({
  wageAmount: z.number().positive(),
  components: z.array(z.object({
    name: z.string(),
    isEarning: z.boolean(),
    computationType: z.enum(['FIXED_AMOUNT', 'PERCENTAGE_OF_WAGE', 'PERCENTAGE_OF_BASIC']),
    value: z.number(),
    sortOrder: z.number().int().optional(),
  })),
});
```

**employees.service.ts** — Key functions
```typescript
// createEmployee(data)
//   → Admin / HR Officer only
//   → Creates Employee record linked to an existing User

// getAllEmployees(callerRole)
//   → Returns employee list with workStatus computed for today:
//       a. Check Attendance for today's date → CHECKED_IN / CHECKED_OUT / ABSENT
//       b. Check LeaveRequest approved for today's date → ON_LEAVE (takes priority)
//   → Strips salary/bank fields if callerRole is EMPLOYEE
//   → HR_OFFICER can see bank details but NOT salary (wageAmount, SalaryComponents)

// getEmployeeById(id, callerRole)
//   → Same salary/bank stripping logic

// updateEmployee(id, data)
//   → Admin / HR Officer — general profile fields (no salary)

// updateSalaryStructure(employeeId, { wageAmount, components })
//   → Admin / Payroll Officer ONLY
//   → Validates total of FIXED_AMOUNT earnings <= wageAmount
//   → Upserts SalaryComponent records (delete existing, insert new)

// addSkill(employeeId, skillName)
// removeSkill(skillId)
// addCertification(employeeId, data)
// removeCertification(certId)

// getPayrollWarnings()
//   → Returns { missingBankCount, missingManagerCount, affectedEmployees[] }
//   → Used by payroll dashboard warnings section
```

**employees.routes.ts**
```
POST   /api/employees                         → Admin, HR — create profile
GET    /api/employees                         → All roles (salary/bank stripped per role)
GET    /api/employees/me                      → Auth — own profile
PATCH  /api/employees/me                      → Auth — update own profile (no salary fields)
GET    /api/employees/:id                     → All roles
PATCH  /api/employees/:id                     → Admin, HR — update profile
PATCH  /api/employees/:id/salary-structure    → Admin, Payroll — update wage + components
GET    /api/employees/:id/salary-structure    → Admin, Payroll — get current structure
GET    /api/employees/warnings                → Admin, Payroll — payroll warnings
POST   /api/employees/:id/skills              → Admin, HR, or own employee — add skill
DELETE /api/employees/skills/:skillId         → Admin, HR, or own employee — remove skill
POST   /api/employees/:id/certifications      → Admin, HR, or own employee — add cert
DELETE /api/employees/certifications/:certId  → Admin, HR, or own employee — remove cert
```

---

## Phase 6 – Attendance Module

**Goal:** Check-in/out, break tracking, extra hours calculation, live presence view for Admin/HR/Payroll.

### Files: `src/modules/attendance/`

**attendance.schema.ts**
```typescript
export const breakSchema = z.object({
  action: z.enum(['start', 'end']),
});

export const manualAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().date(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE']).optional(),
  notes: z.string().optional(),
});
```

**attendance.service.ts** — Key functions
```typescript
// checkIn(employeeId)
//   → Creates Attendance record for today with checkIn = now()
//   → Throws 409 if already checked in today

// breakAction(employeeId, action: 'start'|'end')
//   → Sets breakStart or breakEnd on today's attendance record

// checkOut(employeeId)
//   → Sets checkOut = now()
//   → Calculates workingHours: (checkOut - checkIn) - breakDuration (in decimal hours)
//   → Calculates extraHours: workingHours - standardDailyHours (from SystemConfig)
//   → Sets status: PRESENT(>=4h), HALF_DAY(2-4h), LATE(on time but checked in late)

// getMyAttendance(employeeId, month, year)
//   → Returns records with date, day name, checkIn, checkOut, workingHours, extraHours

// getTodayPresent()
//   → Admin/HR/Payroll: all employees with status CHECKED_IN today (live view)

// getAllAttendance(filters: { employeeId?, month, year, status? })
//   → Admin/HR/Payroll: paginated full list

// getAttendanceSummary(employeeId, month, year)
//   → { totalWorkingDays, present, absent, halfDay, late, onLeave, totalExtraHours }
//   → Used internally by payroll module

// upsertAttendance(data)
//   → Admin only: manual create or override
```

**attendance.routes.ts**
```
POST  /api/attendance/check-in           → Auth — check in for today
POST  /api/attendance/check-out          → Auth — check out for today
POST  /api/attendance/break              → Auth — start/end break { action: 'start'|'end' }
GET   /api/attendance/me                 → Auth — own records (?month=&year=)
GET   /api/attendance/today              → Admin, HR, Payroll — live today's present list
GET   /api/attendance                    → Admin, HR, Payroll — all records (?month=&year=&employeeId=)
GET   /api/attendance/:employeeId        → Admin, HR, Payroll — one employee (?month=&year=)
GET   /api/attendance/summary/:id        → Admin, HR, Payroll — monthly summary
POST  /api/attendance/manual             → Admin — create/override record
```

---

## Phase 7 – Time Off / Leave Module

**Goal:** Full leave lifecycle including attachment upload for sick leave, balance tracking, approval syncing attendance records.

### Files: `src/modules/leaves/`

**Multer config for attachments:**
```typescript
// In leaves.routes.ts: use multer middleware on the apply route
// Accept: image/jpeg, image/png, application/pdf
// Max size: 5MB
// Store to: ./uploads/leave-certificates/
// Field name: 'attachment'
```

**leaves.schema.ts**
```typescript
export const applyLeaveSchema = z.object({
  leaveType: z.enum(['PAID', 'SICK', 'UNPAID']),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().optional(),
  // attachmentUrl is set by multer after upload — not in body schema
});

export const reviewLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionNote: z.string().optional(),
});

export const allocateLeaveSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.enum(['PAID', 'SICK', 'UNPAID']),
  totalDays: z.number().int().min(0),
  year: z.number().int(),
});
```

**leaves.service.ts** — Key functions
```typescript
// applyLeave(employeeId, data, attachmentUrl?)
//   → If leaveType = SICK and no attachmentUrl → throw 400 (attachment required)
//   → Calculates totalDays (Mon–Fri only, skip weekends)
//   → Checks leave balance for PAID/SICK; UNPAID has no balance check
//   → Checks no overlapping PENDING or APPROVED leave for this employee
//   → Creates LeaveRequest with status PENDING

// reviewLeave(leaveRequestId, reviewerId, { status, rejectionNote })
//   → Admin / Payroll Officer only
//   → If APPROVED:
//       a. Deduct totalDays from LeaveBalance (PAID/SICK only)
//       b. Upsert Attendance records with status = ON_LEAVE for each working day in range
//   → If REJECTED: no balance change
//   → Sets reviewedById, reviewedAt

// getMyLeaves(employeeId)        → own leave requests with status
// getMyLeaveBalances(employeeId) → { PAID: { total, used, remaining }, SICK: {...} }
// getAllLeaves(filters)           → Admin/HR/Payroll — all requests
// allocateLeave(data)            → HR/Admin: set or update leave balance for employee
// getLeavesByPeriod(month, year) → used by payroll to get approved leaves per employee
```

**leaves.routes.ts**
```
POST   /api/leaves/apply               → Auth + multer('attachment') — apply for leave
GET    /api/leaves/me                  → Auth — own leave history
GET    /api/leaves/balance/me          → Auth — own leave balances
GET    /api/leaves                     → Admin, HR, Payroll — all requests
GET    /api/leaves/:id                 → Admin, HR, Payroll — single request
PATCH  /api/leaves/:id/review          → Admin, Payroll — approve/reject
POST   /api/leaves/allocate            → Admin, HR — allocate days to employee
GET    /api/leaves/balance/:employeeId → Admin, HR, Payroll — any employee's balance
```

---

## Phase 8 – Payroll Module

**Goal:** Bulk payrun generation for all employees, component-based payslip calculation, PDF with amount-in-words, employer cost aggregates.

### Files: `src/modules/payroll/`

**Salary Computation Rules (component-based, from Salary Info screen):**

Each employee has `SalaryComponent` records defining their salary structure. At payslip generation time:

```
1. Fetch employee's SalaryComponents (sorted by sortOrder)
2. Compute each component in order:
   - FIXED_AMOUNT           → use value directly
   - PERCENTAGE_OF_WAGE     → (value / 100) × wageAmount
   - PERCENTAGE_OF_BASIC    → (value / 100) × computed_basic
3. Fixed Allowance is special: wage - sum(all other earnings components)
4. Gross Salary = sum of all earnings components

Deductions:
   PF Employee    = 12% of Basic
   PF Employer    = 12% of Basic  (adds to employer cost, not Net Pay)
   Professional Tax = slab-based on Gross:
     Gross ≤ 10,000  → ₹ 0
     10,001–15,000   → ₹ 110
     15,001–25,000   → ₹ 130
     25,001–40,000   → ₹ 150
     > 40,000         → ₹ 200
   Unpaid Deduction = unpaidLeaveDays × (wageAmount / totalWorkingDaysInMonth)
   Total Deductions = PF Employee + Professional Tax + Unpaid Deduction

Net Pay = Gross Salary − Total Deductions

Employer Cost per employee = Gross Salary + PF Employer
```

**`src/utils/amount.inwords.ts`**
```typescript
// amountToWords(amount: number): string
// Converts numeric rupee amount to Indian English
// Example: amountToWords(35800) → "Thirty Five Thousand Eight Hundred Only"
// Must handle lakhs and crores (Indian numbering system)
```

**`src/utils/payroll.helpers.ts`**
```typescript
export function calcProfessionalTax(gross: number): number { ... }
export function calcPF(basic: number): number { return +(basic * 0.12).toFixed(2); }
export function calcDailyRate(wage: number, workingDays: number): number { ... }
export function getWorkingDaysInMonth(month: number, year: number): number { /* Mon–Fri count */ }
export function calcExtraHours(working: number, standard: number): number { ... }
```

**payroll.service.ts** — Key functions
```typescript
// createPayrun(month, year, createdById)
//   → Checks no payrun exists for same month/year → throw 409
//   → Creates Payrun with status DRAFT

// generatePayslips(payrunId)
//   → Fetches ALL active employees
//   → ⚠️ Skips employees with missing bank account or manager (logs warnings)
//   → Updates Payrun status to PROCESSING
//   → For each employee:
//       a. getAttendanceSummary(employeeId, month, year)
//       b. getLeavesByPeriod(month, year) → sum approved leaves by type
//       c. Fetch SalaryComponents and compute each component
//       d. Compute deductions
//       e. Generate netPayInWords via amountToWords()
//       f. Upsert Payslip record
//   → After all: aggregate totals → update Payrun totals + set status COMPLETED

// getPayrollWarnings()
//   → Same as employees.service.getPayrollWarnings()

// getEmployerCostChart(year)
//   → Array of { month: number, employerCost: number } for 12 months of the year
//   → Pulled from completed Payrun.totalEmployerCost per month

// getEmployeeCountChart(year)
//   → Array of { month: number, employeeCount: number } for 12 months

// getPayrunById(id)        → payrun + all payslips
// getAllPayruns()           → list
// getPayslipById(id)        → full payslip with component breakdown
// updatePayslip(id, data)   → manual override (marks payrun as needing re-validation)
// generatePayslipPDF(id)    → builds PDF via payslip.generator.ts, returns Buffer
```

**payslip.generator.ts** — PDF layout (pdfkit)
```typescript
// PDF must include (in order):
// 1. Company Logo (from SystemConfig 'company_logo_url') + Company Name
// 2. Payslip header: "SALARY SLIP FOR [MONTH YEAR]"
// 3. Employee details row:
//    Name | Employee Code (loginId) | Department | Company Location
//    Date of Joining | Bank A/c No | PAN No | UAN No | Pay Period | Pay Date
// 4. Attendance row: Total Working Days | Worked Days
// 5. Earnings table: Component Name | Amount (each earnings component)
// 6. Deductions table: Component Name | Amount (each deduction)
// 7. Net Payable section:
//    Numeric: ₹ XX,XXX
//    In words: "[Amount in Words] Only"
// 8. Signature area placeholder
```

**payroll.routes.ts**
```
POST   /api/payroll/payruns                       → Admin, Payroll — create payrun
GET    /api/payroll/payruns                       → Admin, Payroll — list all
GET    /api/payroll/payruns/:id                   → Admin, Payroll — single payrun + payslips
POST   /api/payroll/payruns/:id/generate          → Admin, Payroll — bulk generate all payslips
GET    /api/payroll/payruns/:id/payslips          → Admin, Payroll — all payslips in run
GET    /api/payroll/payslips/:id                  → Admin, Payroll — single payslip with breakdown
PATCH  /api/payroll/payslips/:id                  → Admin, Payroll — manual edit payslip
GET    /api/payroll/payslips/:id/pdf              → Admin, Payroll — download PDF
GET    /api/payroll/charts/employer-cost          → Admin, Payroll — ?year=2025
GET    /api/payroll/charts/employee-count         → Admin, Payroll — ?year=2025
GET    /api/payroll/warnings                      → Admin, Payroll — missing bank/manager alerts
```

---

## Phase 9 – Reports Module

**Goal:** Salary Statement Report — filter by employee + year, return monthly breakdown with yearly totals.

### Files: `src/modules/reports/`

**reports.service.ts** — Key functions
```typescript
// getSalaryStatement(employeeId, year)
//   → Fetch all Payslips for that employee where payrun.year = year
//   → Build a component-by-component × month matrix:
//     {
//       components: [
//         {
//           name: "Basic",
//           isEarning: true,
//           monthly: { 1: 12500, 2: 12500, ... 12: 12500 },
//           yearlyTotal: 150000
//         },
//         { name: "PF Employee", isEarning: false, monthly: {...}, yearlyTotal: ... },
//         ...
//       ],
//       netSalary: { monthly: {...}, yearlyTotal: ... }
//     }

// getPayrollSummaryReport(month, year)
//   → Returns payrun-level totals: total gross, total net, total employer cost, employee count

// getLeaveReport(month?, year?, employeeId?)
//   → Leave request counts: total, approved, rejected, pending, by type

// getAttendanceReport(month, year, employeeId?)
//   → Attendance stats: present %, absent %, average working hours
```

**reports.routes.ts**
```
GET  /api/reports/salary-statement   → Admin, Payroll — ?employeeId=&year=  (primary report)
GET  /api/reports/payroll-summary    → Admin, Payroll — ?month=&year=
GET  /api/reports/leaves             → Admin, Payroll — ?month=&year=&employeeId=
GET  /api/reports/attendance         → Admin, Payroll — ?month=&year=&employeeId=
```

---

## Phase 10 – Dashboard & Analytics Module

**Goal:** Key metric cards + chart data for Admin/Payroll dashboard.

### Files: `src/modules/dashboard/`

**dashboard.service.ts** — Key functions
```typescript
// getOverviewStats()
//   → {
//       totalEmployees,
//       presentToday,       // Attendance.status = PRESENT today
//       onLeaveToday,       // Approved leave covering today
//       absentToday,        // Neither present nor on leave
//       pendingLeaveRequests,
//       payrollWarnings: { missingBank, missingManager }
//     }

// getAttendanceTrend(month, year)
//   → [{ date, presentCount, absentCount, onLeaveCount }] for each day in month

// getLeaveStats(year)
//   → { totalApproved, totalRejected, totalPending, byType: { PAID, SICK, UNPAID } }

// getEmployerCostTrend(year)   → delegates to payroll.service.getEmployerCostChart(year)
// getEmployeeCountTrend(year)  → delegates to payroll.service.getEmployeeCountChart(year)
```

**dashboard.routes.ts**
```
GET  /api/dashboard/overview              → Admin, Payroll
GET  /api/dashboard/attendance-trend      → Admin, Payroll — ?month=&year=
GET  /api/dashboard/leave-stats           → Admin, Payroll — ?year=
GET  /api/dashboard/employer-cost-trend   → Admin, Payroll — ?year=
GET  /api/dashboard/employee-count-trend  → Admin, Payroll — ?year=
```

---

## Phase 11 – Settings Module

**Goal:** Admin configures module-level access rights per role. Stored in `ModulePermission` table. Permission middleware reads from DB.

### Files: `src/modules/settings/`

**settings.service.ts** — Key functions
```typescript
// getModulePermissions()
//   → Returns full matrix: all ModuleName × Role × Action combinations with allowed flag

// updateModulePermission(module, role, action, allowed)
//   → Admin only — upserts ModulePermission record

// bulkUpdatePermissions(permissions[])
//   → Admin only — batch upsert for efficiency

// getSystemConfig()
//   → Returns all SystemConfig key-value pairs (excluding sensitive values)

// updateSystemConfig(key, value)
//   → Admin only — update a system config value (e.g., company_name, standard_daily_hours)
```

**`src/middlewares/permission.middleware.ts`** — Dynamic permission guard
```typescript
// checkModulePermission(module: ModuleName, action: PermissionAction)
// Usage: router.get('/route', verifyToken, checkModulePermission('EMPLOYEES', 'VIEW'), controller)
// 1. Read req.user.role
// 2. Query ModulePermission where { module, role, action }
// 3. If allowed = false → throw 403
// 4. Call next()
// Note: ADMIN role bypasses all permission checks (allowed by default for everything)
```

**settings.routes.ts**
```
GET    /api/settings/permissions                         → Admin — get full permission matrix
PATCH  /api/settings/permissions                         → Admin — bulk update permissions
PATCH  /api/settings/permissions/:module/:role/:action   → Admin — single permission toggle
GET    /api/settings/config                              → Admin — get system config values
PATCH  /api/settings/config/:key                         → Admin — update a config value
```

---

## Middleware Reference

### `auth.middleware.ts` — verifyToken
```typescript
// 1. Read Authorization header: "Bearer "
// 2. Verify JWT with ACCESS_TOKEN_SECRET
// 3. Decode payload { userId, role, loginId }
// 4. Attach to req.user = { userId, role, loginId }
// 5. Call next() or throw 401
```

### `role.middleware.ts` — allowRoles
```typescript
// Usage: router.get('/route', verifyToken, allowRoles('ADMIN', 'HR_OFFICER'), controller)
// Checks req.user.role against allowed roles list
// Throws 403 if not allowed
// ADMIN always passes (no need to list in allowRoles)
```

### `permission.middleware.ts` — checkModulePermission
```typescript
// Usage: router.get('/route', verifyToken, checkModulePermission('EMPLOYEES', 'VIEW'), controller)
// Reads ModulePermission from DB for { module, role, action }
// ADMIN bypasses this check entirely
// Returns 403 if allowed = false
```

### `validate.middleware.ts` — validateBody
```typescript
// Usage: router.post('/route', validateBody(myZodSchema), controller)
// Runs zod.parse on req.body
// Returns 400 with field-level validation errors if invalid
```

---

## Business Logic Rules

Enforced in **service layer** — not just controllers:

1. **No self-registration:** Employees cannot register on their own. User accounts are created only by Admin or HR Officer via `POST /api/users`.
2. **System Login ID:** Auto-generated as `OI + first2(firstName) + first2(lastName) + joinYear + zeroPad(serial, 4)`. Serial is incremented atomically via `SystemConfig.joining_serial_counter`.
3. **First login forced password change:** `isPasswordChanged = false` on account creation. If false, the login response includes `forcePasswordChange: true` and the frontend must redirect to the Change Password screen.
4. **Attendance:** Only one record per employee per day (DB unique constraint + service check).
5. **Check-in/out order:** Cannot check out without checking in. Cannot check in twice the same day.
6. **Extra hours:** Calculated as `workingHours - standardDailyHours` (from `SystemConfig`). Can be negative (short day) or positive (overtime).
7. **Employee work status:** Dynamically computed on every employee list fetch: check today's approved leave first (→ ON_LEAVE), then today's attendance record (→ CHECKED_IN/CHECKED_OUT), else ABSENT.
8. **Sick leave attachment:** `leaveType = SICK` requires `attachmentUrl`. Reject the request at service level if no file was uploaded.
9. **Leave overlap:** Cannot apply for leave if another PENDING or APPROVED leave overlaps the date range.
10. **Leave balance:** PAID and SICK leaves require sufficient balance. UNPAID has no balance check.
11. **Leave approval syncs attendance:** When a leave is APPROVED, upsert Attendance records with `status = ON_LEAVE` for each working day (Mon–Fri) in the leave date range.
12. **Salary visibility:** Strip `wageAmount`, `SalaryComponents` from responses when caller's role is `HR_OFFICER` or `EMPLOYEE`. Bank details are visible to Admin, HR Officer, Payroll Officer — NOT to Employee.
13. **Salary structure validation:** Total of all FIXED_AMOUNT earnings components must not exceed `wageAmount`. Service throws 400 if violated.
14. **Fixed Allowance auto-computation:** `fixedAllowance = wageAmount − sum(all other earnings components)`. Computed at payslip generation time, not stored in components table.
15. **Payrun uniqueness:** Only one payrun per month/year. Throws 409 if duplicate.
16. **Payroll warnings block payslip:** Employees with missing bank account (`bankAccountNumber = null`) or missing manager (`managerId = null`) are skipped during payrun generation with a warning logged. They must be resolved before payslip can be generated for that employee.
17. **Payslip is a snapshot:** All salary values copied at generation time. Future salary changes don't affect past payslips.
18. **Employer cost:** Includes PF Employer share — `employerCost = grossSalary + pfEmployer`. This is aggregated per payrun and per month for charts.
19. **Amount in words:** Net Pay must be converted to Indian English words on payslip generation. Uses Indian numbering (lakhs, crores).
20. **Working days:** Mon–Fri by default. Configurable via `SystemConfig`. Weekends not counted in attendance or leave deductions.
21. **Module permissions:** All permission checks for non-Admin roles read from `ModulePermission` table. ADMIN bypasses all permission checks. Default permissions are seeded at initialization.
22. **PF:** Always 12% of computed Basic salary (not gross). Both employee and employer sides.
23. **Professional Tax:** Slab-based on gross salary. Applied once per monthly payslip.

---

## Environment Variables

**`.env.example`**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/empay_db"

# JWT
ACCESS_TOKEN_SECRET="your_access_token_secret_here"
REFRESH_TOKEN_SECRET="your_refresh_token_secret_here"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

# Server
PORT=3000
NODE_ENV="development"

# Email (Nodemailer SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@email.com"
SMTP_PASS="your_app_password"
EMAIL_FROM="EmPay HR <noreply@empay.com>"

# File storage
UPLOAD_DIR="./uploads"
PDF_OUTPUT_DIR="./generated/payslips"
MAX_FILE_SIZE_MB=5
```

---

## API Endpoint Master List

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login with loginId + password |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Auth | Logout, clear refresh token |
| POST | `/api/auth/change-password` | Auth | Change own password |
| POST | `/api/auth/reset-password` | Admin | Reset any user's password |

### Users
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/users` | Admin, HR | Create user + send credentials email |
| GET | `/api/users` | Admin | All users list |
| GET | `/api/users/me` | Auth | Own user record |
| PATCH | `/api/users/me` | Auth | Update own email |
| GET | `/api/users/:id` | Admin | Single user |
| PATCH | `/api/users/:id/role` | Admin | Change role |
| PATCH | `/api/users/:id/status` | Admin | Activate/deactivate |
| DELETE | `/api/users/:id` | Admin | Delete user |

### Employees
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/employees` | Admin, HR | Create employee profile |
| GET | `/api/employees` | All | List + workStatus (salary stripped per role) |
| GET | `/api/employees/warnings` | Admin, Payroll | Missing bank/manager count |
| GET | `/api/employees/me` | Auth | Own profile |
| PATCH | `/api/employees/me` | Auth | Update own profile |
| GET | `/api/employees/:id` | All | Single profile |
| PATCH | `/api/employees/:id` | Admin, HR | Update profile |
| PATCH | `/api/employees/:id/salary-structure` | Admin, Payroll | Update wage + components |
| GET | `/api/employees/:id/salary-structure` | Admin, Payroll | Get current structure |
| POST | `/api/employees/:id/skills` | Admin, HR, own | Add skill |
| DELETE | `/api/employees/skills/:skillId` | Admin, HR, own | Remove skill |
| POST | `/api/employees/:id/certifications` | Admin, HR, own | Add certification |
| DELETE | `/api/employees/certifications/:certId` | Admin, HR, own | Remove certification |

### Attendance
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/attendance/check-in` | Auth | Check in for today |
| POST | `/api/attendance/check-out` | Auth | Check out for today |
| POST | `/api/attendance/break` | Auth | Start/end break |
| GET | `/api/attendance/me` | Auth | Own records (?month=&year=) |
| GET | `/api/attendance/today` | Admin, HR, Payroll | Live present list today |
| GET | `/api/attendance` | Admin, HR, Payroll | All records |
| GET | `/api/attendance/:employeeId` | Admin, HR, Payroll | One employee records |
| GET | `/api/attendance/summary/:id` | Admin, HR, Payroll | Monthly summary |
| POST | `/api/attendance/manual` | Admin | Manual override |

### Leaves
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/leaves/apply` | Auth + multer | Apply (sick needs attachment) |
| GET | `/api/leaves/me` | Auth | Own leave history |
| GET | `/api/leaves/balance/me` | Auth | Own leave balances |
| GET | `/api/leaves` | Admin, HR, Payroll | All leave requests |
| GET | `/api/leaves/:id` | Admin, HR, Payroll | Single request |
| PATCH | `/api/leaves/:id/review` | Admin, Payroll | Approve/reject |
| POST | `/api/leaves/allocate` | Admin, HR | Allocate leave days |
| GET | `/api/leaves/balance/:employeeId` | Admin, HR, Payroll | Employee balance |

### Payroll
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/payroll/payruns` | Admin, Payroll | Create payrun |
| GET | `/api/payroll/payruns` | Admin, Payroll | List all payruns |
| GET | `/api/payroll/payruns/:id` | Admin, Payroll | Single payrun |
| POST | `/api/payroll/payruns/:id/generate` | Admin, Payroll | Bulk generate all payslips |
| GET | `/api/payroll/payruns/:id/payslips` | Admin, Payroll | All payslips in run |
| GET | `/api/payroll/payslips/:id` | Admin, Payroll | Single payslip + breakdown |
| PATCH | `/api/payroll/payslips/:id` | Admin, Payroll | Edit payslip manually |
| GET | `/api/payroll/payslips/:id/pdf` | Admin, Payroll | Download PDF |
| GET | `/api/payroll/warnings` | Admin, Payroll | Missing bank/manager alerts |
| GET | `/api/payroll/charts/employer-cost` | Admin, Payroll | Annual cost chart data |
| GET | `/api/payroll/charts/employee-count` | Admin, Payroll | Annual headcount chart |

### Reports
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/reports/salary-statement` | Admin, Payroll | ?employeeId=&year= — monthly + yearly |
| GET | `/api/reports/payroll-summary` | Admin, Payroll | ?month=&year= |
| GET | `/api/reports/leaves` | Admin, Payroll | ?month=&year=&employeeId= |
| GET | `/api/reports/attendance` | Admin, Payroll | ?month=&year=&employeeId= |

### Dashboard
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/overview` | Admin, Payroll | Key metric cards |
| GET | `/api/dashboard/attendance-trend` | Admin, Payroll | ?month=&year= |
| GET | `/api/dashboard/leave-stats` | Admin, Payroll | ?year= |
| GET | `/api/dashboard/employer-cost-trend` | Admin, Payroll | ?year= |
| GET | `/api/dashboard/employee-count-trend` | Admin, Payroll | ?year= |

### Settings
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/settings/permissions` | Admin | Full permission matrix |
| PATCH | `/api/settings/permissions` | Admin | Bulk update permissions |
| PATCH | `/api/settings/permissions/:module/:role/:action` | Admin | Single permission toggle |
| GET | `/api/settings/config` | Admin | System config values |
| PATCH | `/api/settings/config/:key` | Admin | Update a config value |

---

## Error Handling Convention

**`src/utils/ApiError.ts`**
```typescript
export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
// Usage: throw new ApiError(404, 'Employee not found');
```

**`src/utils/ApiResponse.ts`**
```typescript
export const successResponse = (res, statusCode, data, message = 'Success') =>
  res.status(statusCode).json({ success: true, message, data });

export const errorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({ success: false, message });
```

**Global error handler in `app.ts`:**
```typescript
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});
```

**Standard HTTP codes:**
- `200` OK · `201` Created · `400` Bad Request · `401` Unauthorized
- `403` Forbidden · `404` Not Found · `409` Conflict · `500` Server Error

---

## Build Order Checklist

Build in strict dependency order:

- [ ] **Phase 1** — Project init, Express app, folder structure, all utils (`ApiError`, `ApiResponse`, `asyncHandler`, `loginId.generator`, `password.generator`, `amount.inwords`, `email.service`, `payroll.helpers`)
- [ ] **Phase 2** — Full Prisma schema, DB migration, Prisma client singleton, seed file (admin user + default module permissions + system config)
- [ ] **Phase 3** — Auth module (system ID login, first-login detection, change/reset password, JWT tokens, email delivery)
- [ ] **Phase 4** — Users module (Admin/HR creates accounts, role management, no self-registration)
- [ ] **Phase 5** — Employee module (full profile, bank details, manager link, skills, certifications, dynamic workStatus, salary structure endpoints, payroll warnings)
- [ ] **Phase 6** — Attendance module (check-in/out, break tracking, extra hours, live today view)
- [ ] **Phase 7** — Leave module (apply with multer attachment, SICK cert validation, approve → sync attendance, balance tracking)
- [ ] **Phase 8** — Payroll module (component-based payslip calculation, bulk payrun, employer cost aggregation, PDF with amount-in-words)
- [ ] **Phase 9** — Reports module (salary statement with monthly × yearly matrix, payroll + leave + attendance summaries)
- [ ] **Phase 10** — Dashboard module (overview stats, chart data, employer cost + headcount trends)
- [ ] **Phase 11** — Settings module (module permission matrix, permission middleware, system config CRUD)
- [ ] **Final** — Global error handler wired up, input validation on all routes, permission middleware applied, integration tests, seed data for demo

---

*EmPay Backend Roadmap — Node.js · Express · PostgreSQL · Prisma ORM*  
*All payroll calculations are attendance-driven. All salary data is role-gated.*  
*v2 — Updated with full screen inventory: system login IDs, employee workStatus, bank details,*  
*skills/certifications, break tracking, extra hours, sick leave attachments, salary components,*  
*amount-in-words, employer cost charts, salary statement report, and settings/permissions module.*