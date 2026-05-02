// prisma/seed-attendance-2026-fix.js
// Fixes attendance data so employees aren't absent today
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const rand = (min, max) => Math.random() * (max - min) + min
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

async function main() {
  console.log('🌱 Fixing attendance for May 2026…\n')

  const employees = await prisma.employee.findMany({
    where: { user: { isActive: true } },
    select: { id: true },
  })
  
  if (!employees.length) return

  const dates = []
  
  // April
  for(let i=1; i<=30; i++) dates.push(new Date(Date.UTC(2026, 3, i)))
  
  // May 1 to May 3
  for(let i=1; i<=3; i++) dates.push(new Date(Date.UTC(2026, 4, i)))

  let updated = 0

  for (const date of dates) {
    const isTodayOrYesterday = date.getTime() === new Date(Date.UTC(2026, 4, 2)).getTime() || 
                               date.getTime() === new Date(Date.UTC(2026, 4, 3)).getTime()
                               
    for (const emp of employees) {
      // If it's today/yesterday, we force them to be present mostly, regardless of weekend.
      // Otherwise regular weekend logic
      const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
      if (isWeekend && !isTodayOrYesterday && Math.random() < 0.95) continue
      
      // Let's make ~80% present, ~10% absent, ~10% on leave
      const r = Math.random()
      let status = 'PRESENT'
      if (r > 0.9) status = 'ABSENT'
      else if (r > 0.8) status = 'ON_LEAVE'
      
      let checkIn = null
      let checkOut = null
      let workingHours = null
      let extraHours = null
      
      if (status === 'PRESENT') {
        // Checked in, but maybe not checked out if it's "today"
        const checkInHour = Math.floor(rand(8, 10))
        const checkInMin = Math.floor(rand(0, 59))
        checkIn = new Date(date)
        checkIn.setUTCHours(checkInHour, checkInMin, 0, 0)
        
        // If it's today, leave some without checkout (still working)
        if (isTodayOrYesterday && Math.random() < 0.3) {
          // Checked in but not checked out
        } else {
          const checkOutHour = Math.floor(rand(17, 19))
          const checkOutMin = Math.floor(rand(0, 59))
          checkOut = new Date(date)
          checkOut.setUTCHours(checkOutHour, checkOutMin, 0, 0)
          
          workingHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60) - 1
          if (workingHours > 8) {
            extraHours = workingHours - 8
            workingHours = 8
          }
        }
      }

      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date: date
          }
        },
        update: {
          checkIn,
          checkOut,
          workingHours,
          extraHours,
          status
        },
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
      updated++
    }
  }

  console.log(`\n🎉 Updated ${updated} attendance records to fix weekends/today.`)
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
