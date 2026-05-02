// prisma/seed-employees.js
// Generates 30 synthetic employees with randomized realistic data
// Run: node prisma/seed-employees.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// ── Raw name pools ──────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Arjun','Priya','Rohit','Sneha','Vikram','Ananya','Karan','Divya','Amit','Pooja',
  'Suresh','Nisha','Rahul','Meera','Aakash','Kavya','Deepak','Swati','Nikhil','Riya',
  'Varun','Shreya','Ajay','Pallavi','Siddharth','Tanvi','Manish','Komal','Gaurav','Anjali',
]
const LAST_NAMES = [
  'Mehta','Sharma','Kulkarni','Patil','Desai','Joshi','Singh','Gupta','Verma','Rao',
  'Nair','Iyer','Reddy','Patel','Shah','Mishra','Chauhan','Kumar','Agarwal','Bose',
  'Chaudhary','Malhotra','Pandey','Saxena','Trivedi','Sinha','Dubey','Tiwari','Yadav','Kapoor',
]
const DEPARTMENTS = ['Engineering','HR','Finance','Operations','Marketing','Sales','Design','Product','Legal','Support']
const DESIGNATIONS = {
  Engineering: ['Software Engineer','Senior Developer','Tech Lead','Backend Engineer','Frontend Developer','DevOps Engineer','QA Engineer'],
  HR:          ['HR Executive','HR Manager','Recruiter','People Operations Specialist','HR Generalist'],
  Finance:     ['Finance Analyst','Accountant','Finance Manager','Auditor','Tax Consultant'],
  Operations:  ['Operations Lead','Operations Manager','Business Analyst','Process Analyst'],
  Marketing:   ['Brand Manager','Marketing Executive','Content Strategist','SEO Specialist','Digital Marketing Manager'],
  Sales:       ['Sales Executive','Account Manager','Business Development Manager','Sales Lead'],
  Design:      ['UI Designer','UX Researcher','Graphic Designer','Product Designer','Design Lead'],
  Product:     ['Product Manager','Associate PM','Senior PM','Product Analyst'],
  Legal:       ['Legal Counsel','Compliance Officer','Contract Manager'],
  Support:     ['Customer Support Executive','Technical Support Engineer','Support Lead'],
}
const LOCATIONS    = ['Pune','Mumbai','Bangalore','Hyderabad','Chennai','Delhi','Ahmedabad','Kolkata']
const BANKS        = ['HDFC Bank','ICICI Bank','SBI','Axis Bank','Kotak Mahindra Bank','Yes Bank','PNB']
const GENDERS      = ['MALE','FEMALE','OTHER']
const MARITAL      = ['SINGLE','MARRIED','DIVORCED']
const NATIONALITIES = ['Indian']
const SKILLS_POOL  = [
  'JavaScript','TypeScript','React','Node.js','Python','Java','SQL','AWS','Docker',
  'Git','Figma','Excel','Tableau','Communication','Leadership','Project Management',
  'Data Analysis','Machine Learning','Kubernetes','PostgreSQL','MongoDB','GraphQL',
]

// ── Helpers ─────────────────────────────────────────────────────────────────
const pick   = arr => arr[Math.floor(Math.random() * arr.length)]
const rInt   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const rFloat = (min, max, dp=2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp))
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1)
  const end   = new Date(endYear, 11, 31)
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomPhone() {
  // 10 digit, starts with 6-9
  return `${rInt(6,9)}${Array.from({length:9}, ()=>rInt(0,9)).join('')}`
}

function randomPAN() {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return `${pick(alpha)}${pick(alpha)}${pick(alpha)}${pick(alpha)}${pick(alpha)}${rInt(1000,9999)}${pick(alpha)}`
}

function randomIFSC(bank) {
  const codes = {
    'HDFC Bank': 'HDFC', 'ICICI Bank': 'ICIC', 'SBI': 'SBIN',
    'Axis Bank': 'UTIB', 'Kotak Mahindra Bank': 'KKBK', 'Yes Bank': 'YESB', 'PNB': 'PUNB',
  }
  return `${codes[bank]||'HDFC'}0${rInt(100000,999999)}`
}

function randomAccount() {
  return `${rInt(10000000, 99999999)}${rInt(1000, 9999)}`
}

// ── Salary bands by seniority keyword ───────────────────────────────────────
function salaryBand(designation) {
  const d = designation.toLowerCase()
  if (d.includes('lead') || d.includes('manager') || d.includes('senior') || d.includes('counsel'))
    return rFloat(60000, 120000, 0)
  if (d.includes('associate') || d.includes('executive') || d.includes('engineer') || d.includes('analyst'))
    return rFloat(25000, 60000, 0)
  return rFloat(18000, 35000, 0)
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding 30 synthetic employees…')

  const hashedPassword = await bcrypt.hash('Emp@1234', 10)

  // Get current serial counter
  const cfg = await prisma.systemConfig.findUnique({ where: { key: 'joining_serial_counter' } })
  let serial = cfg ? parseInt(cfg.value, 10) : 2

  // Get admin employee to use as default manager
  const adminEmp = await prisma.employee.findFirst({
    where: { user: { role: 'ADMIN' } },
    select: { id: true },
  })

  const created = []

  for (let i = 0; i < 30; i++) {
    const firstName  = FIRST_NAMES[i]  // ensures unique first names
    const lastName   = pick(LAST_NAMES)
    const dept       = pick(DEPARTMENTS)
    const desig      = pick(DESIGNATIONS[dept])
    const gender     = pick(GENDERS)
    const bank       = pick(BANKS)
    const joinDate   = randomDate(2019, 2024)
    const dob        = randomDate(1985, 2000)
    const wage       = salaryBand(desig)
    const location   = pick(LOCATIONS)

    serial++
    const year       = joinDate.getFullYear()
    const prefix     = 'EP'
    const loginId    = `${prefix}${firstName.toUpperCase().slice(0,3)}${lastName.toUpperCase().slice(0,2)}${year}${String(serial).padStart(4,'0')}`
    const email      = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${serial}@empay.com`
    const phone      = randomPhone()

    // Randomly have bank details (~80% of employees)
    const hasBank = Math.random() > 0.2
    const bankAccountNumber = hasBank ? randomAccount() : null
    const bankName          = hasBank ? bank : null
    const ifscCode          = hasBank ? randomIFSC(bank) : null

    // Random skills (2-5)
    const empSkills = shuffle(SKILLS_POOL).slice(0, rInt(2, 5))

    try {
      const user = await prisma.user.create({
        data: {
          loginId,
          name: `${firstName} ${lastName}`,
          email,
          phone,
          password: hashedPassword,
          role: 'EMPLOYEE',
          companyName: 'EmPay Inc.',
          companyPrefix: prefix,
          mustChangePassword: false,
          employee: {
            create: {
              firstName,
              lastName,
              phone,
              personalEmail:  `${firstName.toLowerCase()}@gmail.com`,
              gender,
              maritalStatus:  pick(MARITAL),
              nationality:    'Indian',
              dateOfBirth:    dob,
              address:        `${rInt(1,99)}, ${pick(['MG Road','FC Road','SB Road','Baner Road','Kothrud'])} ${location}`,
              department:     dept,
              designation:    desig,
              companyLocation: location,
              joinDate,
              managerId:      adminEmp?.id ?? null,
              empCode:        loginId,
              wageAmount:     wage,
              workingDaysPerWeek: pick([5, 5, 5, 6]),
              breakTimeHours: pick([0.5, 1, 1]),
              bankAccountNumber,
              bankName,
              ifscCode,
              panNumber:      randomPAN(),
              uanNumber:      `${rInt(100000000000, 999999999999)}`,
              skills: {
                create: empSkills.map(name => ({ name })),
              },
              leaveBalances: {
                create: [
                  { leaveType: 'PAID',   totalDays: 24, usedDays: rInt(0, 10), year: 2025 },
                  { leaveType: 'SICK',   totalDays:  7, usedDays: rInt(0,  3), year: 2025 },
                  { leaveType: 'UNPAID', totalDays:  0, usedDays: rInt(0,  2), year: 2025 },
                ],
              },
            },
          },
        },
      })
      created.push(loginId)
      console.log(`  ✅ [${i+1}/30] ${firstName} ${lastName} — ${desig} @ ${dept} — ₹${wage.toLocaleString('en-IN')}/mo`)
    } catch (err) {
      console.warn(`  ⚠️  Skipped ${firstName} ${lastName}: ${err.message}`)
    }
  }

  // Update the serial counter
  await prisma.systemConfig.upsert({
    where:  { key: 'joining_serial_counter' },
    update: { value: String(serial) },
    create: { key: 'joining_serial_counter', value: String(serial) },
  })

  console.log(`\n🎉 Done! Created ${created.length} employees.`)
  console.log(`   Default password for all: Emp@1234`)
  console.log(`   Serial counter updated to: ${serial}`)
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
