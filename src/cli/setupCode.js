require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { createBootstrapCode } = require('../controllers/setupController')

const prisma = new PrismaClient()

createBootstrapCode(prisma)
  .then(({ code, expiresAt }) => {
    console.log(`Código de instalação (válido até ${expiresAt.toISOString()}):`)
    console.log(code)
  })
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
