// prisma/seed-attendance-2026.js
// Seeds attendance data for the current month (May 2026) for all employees
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const rand = (min, max) => Math.random() * (max - min) + min
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

async function main() {
  console.log('🌱 Seeding attendance for May 2026…\n')

  const employees = await prisma.employee.findMany({
    where: { user: { isActive: true } },
    select: { id: true },
  })
  
  if (!employees.length) {
    console.log('No active employees found.')
    return
  }

  // We will seed attendance for May 1st to May 3rd (current date)
  // Let's actually seed for the whole month up to today + some past months to be safe.
  // We'll seed April 2026 and May 2026 up to today.
  
  const dates = []
  
  // April 1 to April 30
  for(let i=1; i<=30; i++) {
    dates.push(new Date(Date.UTC(2026, 3, i))) // Month 3 is April
  }
  
  // May 1 to May 3
  for(let i=1; i<=3; i++) {
    dates.push(new Date(Date.UTC(2026, 4, i))) // Month 4 is May
  }

  let totalRecords = 0

  for (const date of dates) {
    const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
    
    for (const emp of employees) {
      // Skip weekends 80% of the time, or if weekend they might be absent
      if (isWeekend && Math.random() < 0.95) continue
      
      const statusOptions = ['PRESENT', 'PRESENT', 'PRESENT', 'HALF_DAY', 'ABSENT', 'ON_LEAVE']
      const status = pick(statusOptions)
      
      let checkIn = null
      let checkOut = null
      let workingHours = null
      let extraHours = null
      
      if (status === 'PRESENT' || status === 'HALF_DAY') {
        // Check in between 8:30 and 10:30
        const checkInHour = Math.floor(rand(8, 10))
        const checkInMin = Math.floor(rand(0, 59))
        checkIn = new Date(date)
        checkIn.setUTCHours(checkInHour, checkInMin, 0, 0)
        
        // Check out between 17:00 and 19:30
        const checkOutHour = status === 'HALF_DAY' ? Math.floor(rand(13, 15)) : Math.floor(rand(17, 19))
        const checkOutMin = Math.floor(rand(0, 59))
        checkOut = new Date(date)
        checkOut.setUTCHours(checkOutHour, checkOutMin, 0, 0)
        
        workingHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) - 1 // 1 hour break
        if (workingHours > 8) {
          extraHours = workingHours - 8
          workingHours = 8
        }
      }

      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date: date
          }
        },
        update: {},
        create: {
          employeeId: emp.id,
          date,
          checkIn,
          checkOut,
          workingHours,
          extraHours,
          status
        }
      })
      totalRecords++
    }
  }

  console.log(`\n🎉 Created ${totalRecords} attendance records for April and May 2026.`)
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
