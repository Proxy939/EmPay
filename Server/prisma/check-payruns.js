const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.payrun.findMany({ select: { name: true, periodStart: true, status: true } })
  .then(r => { console.log(JSON.stringify(r, null, 2)); p.$disconnect() })
