// prisma/seed-payruns-2026.js — Seeds Jan–Apr 2026 payruns for all employees
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const round2 = v => Math.round(v * 100) / 100
const rand   = (min, max) => Math.random() * (max - min) + min
const pick   = arr => arr[Math.floor(Math.random() * arr.length)]

function buildPayslip(employee, payrunId, periodStart, periodEnd) {
  const basic       = employee.wageAmount || rand(20000, 80000)
  const hra         = round2(basic * 0.40)
  const special     = round2(basic * 0.20)
  const gross       = round2(basic + hra + special)
  const pfEmp       = round2(basic * 0.12)
  const pfEr        = round2(basic * 0.12)
  const pt          = basic > 15000 ? 200 : 0
  const tds         = gross > 50000 ? round2(gross * 0.05) : 0
  const net         = round2(gross - pfEmp - pt - tds)
  const empCost     = round2(gross + pfEr)
  const worked      = Math.floor(rand(18, 23))
  const paidLeave   = Math.floor(rand(0, 3))
  return {
    payrunId, employeeId: employee.id,
    periodStart: new Date(periodStart), periodEnd: new Date(periodEnd),
    workedDays: worked, paidLeaveDays: paidLeave, unpaidLeaveDays: 0,
    totalPayableDays: worked + paidLeave,
    basicWage: round2(basic), grossAmount: gross,
    pfEmployee: pfEmp, pfEmployer: pfEr,
    professionalTax: pt, tdsDeduction: tds,
    netAmount: net, employerCost: empCost,
    components: JSON.stringify({ 'Basic Salary': basic, 'HRA': hra, 'Special Allowance': special }),
    status: pick(['COMPUTED','VALIDATED','DONE']),
    computedAt: new Date(),
  }
}

async function main() {
  console.log('🌱 Seeding 2026 payruns…\n')
  const employees = await prisma.employee.findMany({
    where: { user: { isActive: true } },
    select: { id: true, wageAmount: true, firstName: true, lastName: true },
  })
  console.log(`  Found ${employees.length} employees\n`)

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  const createdById = admin?.id || 'admin'

  const months = [
    { name:'Payrun Jan 2026', start:'2026-01-01', end:'2026-01-31' },
    { name:'Payrun Feb 2026', start:'2026-02-01', end:'2026-02-28' },
    { name:'Payrun Mar 2026', start:'2026-03-01', end:'2026-03-31' },
    { name:'Payrun Apr 2026', start:'2026-04-01', end:'2026-04-30' },
  ]

  for (const m of months) {
    const slips = employees.map(e => buildPayslip(e, null, m.start, m.end))
    const totalGross        = round2(slips.reduce((s,p) => s + p.grossAmount, 0))
    const totalNet          = round2(slips.reduce((s,p) => s + p.netAmount, 0))
    const totalEmployerCost = round2(slips.reduce((s,p) => s + p.employerCost, 0))

    // Check if payrun already exists for this period
    const exists = await prisma.payrun.findFirst({
      where: { periodStart: new Date(m.start) }
    })
    if (exists) {
      console.log(`  ⏭  ${m.name} already exists — skipping`)
      continue
    }

    const payrun = await prisma.payrun.create({
      data: {
        name: m.name, periodStart: new Date(m.start), periodEnd: new Date(m.end),
        status: 'DONE', totalGross, totalNet, totalEmployerCost, createdById,
      },
    })

    for (const slip of slips) {
      slip.payrunId = payrun.id
      await prisma.payslip.create({ data: slip })
    }

    console.log(`  ✅ ${m.name} — ${employees.length} payslips — Gross: ₹${totalGross.toLocaleString('en-IN')} | Net: ₹${totalNet.toLocaleString('en-IN')}`)
  }
  console.log('\n🎉 Done! Refresh dashboard to see the Payroll Statistics chart.')
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
