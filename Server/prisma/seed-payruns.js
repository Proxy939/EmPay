// prisma/seed-payruns.js
// Seeds 6 months of payruns + payslips for all active employees
// Run: node prisma/seed-payruns.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const rand = (min, max) => Math.random() * (max - min) + min
const pick = arr => arr[Math.floor(Math.random() * arr.length)]
const round2 = v => Math.round(v * 100) / 100

// Simple salary structure: basic = wage, HRA = 40%, special = remaining to gross
function buildPayslip(employee, payrunId, periodStart, periodEnd) {
  const basic        = employee.wageAmount || rand(20000, 80000)
  const hra          = round2(basic * 0.40)
  const special      = round2(basic * 0.20)
  const grossAmount  = round2(basic + hra + special)

  const pfEmployee   = round2(basic * 0.12)
  const pfEmployer   = round2(basic * 0.12)
  const profTax      = basic > 15000 ? 200 : 0
  const tds          = grossAmount > 50000 ? round2(grossAmount * 0.05) : 0

  const netAmount    = round2(grossAmount - pfEmployee - profTax - tds)
  const employerCost = round2(grossAmount + pfEmployer)

  const workedDays   = Math.floor(rand(18, 23))
  const paidLeave    = Math.floor(rand(0, 3))

  return {
    payrunId,
    employeeId:      employee.id,
    periodStart:     new Date(periodStart),
    periodEnd:       new Date(periodEnd),
    workedDays,
    paidLeaveDays:   paidLeave,
    unpaidLeaveDays: 0,
    totalPayableDays: workedDays + paidLeave,
    basicWage:       round2(basic),
    grossAmount,
    pfEmployee,
    pfEmployer,
    professionalTax: profTax,
    tdsDeduction:    tds,
    netAmount,
    employerCost,
    components: JSON.stringify({
      'Basic Salary': basic,
      'HRA':          hra,
      'Special Allowance': special,
    }),
    status: pick(['COMPUTED', 'VALIDATED', 'DONE']),
    computedAt: new Date(),
  }
}

async function main() {
  console.log('🌱 Seeding payruns + payslips…\n')

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: { user: { isActive: true } },
    select: { id: true, wageAmount: true, firstName: true, lastName: true },
  })
  console.log(`  Found ${employees.length} employees\n`)

  // Get admin user for createdById
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  const createdById = admin?.id || 'admin'

  // Generate 6 months of payruns (Nov 2024 → Apr 2025)
  const months = [
    { name: 'Payrun Nov 2024', start: '2024-11-01', end: '2024-11-30' },
    { name: 'Payrun Dec 2024', start: '2024-12-01', end: '2024-12-31' },
    { name: 'Payrun Jan 2025', start: '2025-01-01', end: '2025-01-31' },
    { name: 'Payrun Feb 2025', start: '2025-02-01', end: '2025-02-28' },
    { name: 'Payrun Mar 2025', start: '2025-03-01', end: '2025-03-31' },
    { name: 'Payrun Apr 2025', start: '2025-04-01', end: '2025-04-30' },
  ]

  for (const m of months) {
    // Build all payslips for this month
    const slips = employees.map(e => buildPayslip(e, null, m.start, m.end))
    const totalGross       = round2(slips.reduce((s, p) => s + p.grossAmount, 0))
    const totalNet         = round2(slips.reduce((s, p) => s + p.netAmount, 0))
    const totalEmployerCost = round2(slips.reduce((s, p) => s + p.employerCost, 0))

    // Create payrun
    const payrun = await prisma.payrun.create({
      data: {
        name:             m.name,
        periodStart:      new Date(m.start),
        periodEnd:        new Date(m.end),
        status:           'DONE',
        totalGross,
        totalNet,
        totalEmployerCost,
        createdById,
      },
    })

    // Create payslips
    for (const slip of slips) {
      slip.payrunId = payrun.id
      await prisma.payslip.create({ data: slip })
    }

    console.log(`  ✅ ${m.name} — ${employees.length} payslips — Gross: ₹${totalGross.toLocaleString('en-IN')} | Net: ₹${totalNet.toLocaleString('en-IN')}`)
  }

  console.log('\n🎉 Done! Dashboard Payroll Statistics chart will now show real data.')
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
