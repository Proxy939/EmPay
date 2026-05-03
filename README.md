# EmPay HRMS 🚀

EmPay is a full-stack, enterprise-grade Human Resource Management System (HRMS). It offers a robust dashboard for managing employees, payroll, and organizational metrics, alongside a dedicated, high-performance marketing landing page.

---

## ✨ Key Features

- **Centralized Dashboard**: Real-time insights into employee counts, employer costs, and departmental analytics.
- **Employee Management**: Add, update, and manage employee profiles, departments, and roles efficiently.
- **Payroll & Payslips**: Automated payroll processing with dynamic payslip generation and PDF preview/download capabilities.
- **Authentication**: Secure JWT-based authentication with role-based access control (Admin & Employee portals).
- **Marketing Landing Page**: High-converting, SEO-optimized landing page featuring smooth animations.
- **Data-Driven UI**: Dashboard components dynamically reflect the backend database state without hardcoded fallbacks.

---

## 🏗️ Project Architecture

The project is built using a modern, decoupled three-tier architecture:

```text
EmPay/
├── Client/
│   ├── src/        ← Main HRMS Application (Vite + React, port 5173)
│   └── landing/    ← Marketing Landing Page (Next.js, port 4028)
└── Server/         ← RESTful API Backend (Express + Prisma, port 5000)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Landing Page** | Next.js 15, TypeScript, Tailwind CSS, Framer Motion, GSAP, Recharts |
| **HRMS Client** | Vite, React 18, React Router, Tailwind CSS, Shadcn UI, Recharts, Lucide Icons |
| **API Server** | Node.js, Express.js, Prisma ORM, PostgreSQL (Neon DB), JWT, PDFKit |

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **PostgreSQL** database (or a Neon DB connection string)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd EmPay
```

### 2. Backend Setup (Server)

Navigate to the server directory and install dependencies:

```bash
cd Server
npm install
```

**Environment Variables:**
Create a `.env` file in the `Server` directory with the following variables:
```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/empay?schema=public"
JWT_SECRET="your_super_secret_jwt_key"
```

**Database Migration & Seeding:**
Run Prisma commands to generate the client, push the schema to the database, and run any seed scripts:
```bash
npm run db:generate
npm run db:push
# If you have a seeding script configured (e.g., node prisma/seed.js)
```

### 3. HRMS Client Setup (Vite)

Open a new terminal, navigate to the `Client` directory, and install dependencies:

```bash
cd Client
npm install
```

### 4. Landing Page Setup (Next.js)

Open another terminal, navigate to the `landing` directory, and install dependencies:

```bash
cd Client/landing
npm install
```

---

## 🏃‍♂️ Running Locally

Start all three services simultaneously (each in its own terminal):

**1. API Server (Express)**
```bash
cd Server
npm run dev
# Server runs on http://localhost:5000
```

**2. HRMS Client (React)**
```bash
cd Client
npm run dev
# App runs on http://localhost:5173
```

**3. Landing Page (Next.js)**
```bash
cd Client/landing
npm run dev
# Landing runs on http://localhost:4028
```

---

## 🧭 User Flow & Default Credentials

1. **Visit Landing Page**: Go to `http://localhost:4028`.
2. **Access App**: Click on **"Get Started"** or **"Start Free Trial"** to be redirected to the HRMS login screen (`http://localhost:5173/login`).
3. **Login**: Use the default administrator credentials.
4. **Dashboard**: Upon successful authentication, you will be directed to the HRMS dashboard.

### Default Admin Credentials:
- **Login ID:** `OIJODO20260001`
- **Password:** `Admin@123`

---

## 📄 License

This project is licensed under the ISC License. See the `package.json` for details.
