const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const {
  BOOTSTRAP_CODE_TTL_MS,
  BOOTSTRAP_LOCK_MS,
  MAX_BOOTSTRAP_ATTEMPTS,
  generateBootstrapCode,
  hashBootstrapCode,
  isBootstrapCodeExpired,
  matchesBootstrapCode,
  validateBootstrapInput
} = require('../setupSecurity')

let prisma

const getPrisma = () => {
  prisma ||= new PrismaClient()
  return prisma
}

const ensureInstallationState = async (client = getPrisma()) => client.installationState.upsert({
  where: { id: 1 },
  update: {},
  create: { id: 1, status: 'UNCONFIGURED' }
})

const createBootstrapCode = async (client = getPrisma(), now = new Date()) => {
  const state = await ensureInstallationState(client)
  if (state.status === 'CONFIGURED') {
    throw new Error('A instalação já está configurada.')
  }

  const code = generateBootstrapCode()
  const expiresAt = new Date(now.getTime() + BOOTSTRAP_CODE_TTL_MS)
  await client.installationState.update({
    where: { id: 1 },
    data: {
      bootstrapCodeHash: hashBootstrapCode(code),
      bootstrapCodeExpiresAt: expiresAt,
      attemptCount: 0,
      lockedUntil: null
    }
  })
  return { code, expiresAt }
}

const getSetupStatus = async (request, response) => {
  const state = await ensureInstallationState()
  return response.json({
    configured: state.status === 'CONFIGURED',
    setupAvailable: state.status === 'UNCONFIGURED'
  })
}

const createBootstrapHandler = ({
  prismaClient = getPrisma(),
  bcryptClient = bcrypt,
  nowProvider = () => new Date()
} = {}) => async (request, response) => {
  const input = request.body || {}
  const code = typeof input.code === 'string' ? input.code.trim() : ''
  const nome = typeof input.nome === 'string' ? input.nome.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const senha = typeof input.senha === 'string' ? input.senha : ''
  const validationError = validateBootstrapInput({ code, nome, email, senha })

  if (validationError) return response.status(400).json({ message: validationError })

  try {
    const result = await prismaClient.$transaction(async (transaction) => {
      const now = nowProvider()
      const state = await transaction.installationState.findUnique({ where: { id: 1 } })

      if (!state || state.status === 'CONFIGURED') {
        return { status: 409, body: { message: 'A instalação já está configurada.' } }
      }
      if (state.lockedUntil && state.lockedUntil > now) {
        return { status: 429, body: { message: 'Muitas tentativas. Tente novamente mais tarde.' } }
      }
      if (isBootstrapCodeExpired(state.bootstrapCodeExpiresAt, now) || !matchesBootstrapCode(code, state.bootstrapCodeHash)) {
        const attemptCount = state.attemptCount + 1
        const lockedUntil = attemptCount >= MAX_BOOTSTRAP_ATTEMPTS
          ? new Date(now.getTime() + BOOTSTRAP_LOCK_MS)
          : null
        await transaction.installationState.update({
          where: { id: 1 },
          data: { attemptCount, lockedUntil }
        })
        return { status: 401, body: { message: 'Código de instalação inválido ou expirado.' } }
      }

      const existingAdmins = await transaction.administradores.count()
      if (existingAdmins > 0) {
        await transaction.installationState.update({
          where: { id: 1 },
          data: { status: 'CONFIGURED', consumedAt: now, configuredAt: now, bootstrapCodeHash: null, bootstrapCodeExpiresAt: null }
        })
        return { status: 409, body: { message: 'A instalação já está configurada.' } }
      }

      const passwordHash = await bcryptClient.hash(senha, 10)
      await transaction.administradores.create({
        data: {
          nome,
          email,
          senha: passwordHash,
          celular: '',
          cpf: '',
          dataNascimento: ''
        }
      })
      await transaction.installationState.update({
        where: { id: 1 },
        data: {
          status: 'CONFIGURED',
          bootstrapCodeHash: null,
          bootstrapCodeExpiresAt: null,
          attemptCount: 0,
          lockedUntil: null,
          consumedAt: now,
          configuredAt: now
        }
      })
      return { status: 201, body: { message: 'Instalação configurada com sucesso.' } }
    })

    return response.status(result.status).json(result.body)
  } catch (error) {
    console.error('Erro ao concluir bootstrap:', error.message)
    return response.status(500).json({ message: 'Não foi possível concluir a configuração.' })
  }
}

module.exports = {
  createBootstrapCode,
  createBootstrapHandler,
  ensureInstallationState,
  getSetupStatus
}
