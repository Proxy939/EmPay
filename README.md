# EmPay HRMS

A full-stack Human Resource Management System with a dedicated marketing landing page.

## Project Structure

```
EmPay/
├── Client/
│   ├── src/        ← Vite + React HRMS app  (port 5173)
│   └── landing/    ← Next.js landing page   (port 4028)
└── Server/         ← Express + Prisma API   (port 5000)
```

## Running Locally

Start all three services (each in its own terminal):

```bash
# 1. Landing Page (Next.js)
cd Client/landing && npm run dev    # → http://localhost:4028

# 2. HRMS Client (Vite + React)
cd Client && npm run dev            # → http://localhost:5173

# 3. API Server (Express + Prisma)
cd Server && npm run dev            # → http://localhost:5000
```

## User Flow

```
http://localhost:4028  (Landing Page)
        ↓  "Get Started" / "Start Free Trial"
http://localhost:5173/login  (Login Screen)
        ↓  after auth
http://localhost:5173/dashboard  (HRMS App)
```
## Default Admin Credentials

- **Login ID:** `OIJODO20260001`
- **Password:** `Admin@123`

## Tech Stack

| Layer   | Technology                                              |
|---------|---------------------------------------------------------|
| Landing | Next.js 15, TypeScript, Tailwind, framer-motion, GSAP  |
| Client  | Vite, React 18, React Router, Lucide                   |
| Server  | Node.js, Express, Prisma ORM, PostgreSQL (Neon), JWT   |
