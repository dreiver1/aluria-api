const crypto = require('crypto')

const BOOTSTRAP_CODE_TTL_MS = 15 * 60 * 1000
const MAX_BOOTSTRAP_ATTEMPTS = 5
const BOOTSTRAP_LOCK_MS = 15 * 60 * 1000

const generateBootstrapCode = () => crypto.randomBytes(24).toString('base64url')

const hashBootstrapCode = (code) => crypto
  .createHash('sha256')
  .update(String(code))
  .digest('hex')

const matchesBootstrapCode = (code, expectedHash) => {
  if (!expectedHash || !code) return false
  const received = Buffer.from(hashBootstrapCode(code), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return received.length === expected.length && crypto.timingSafeEqual(received, expected)
}

const isBootstrapCodeExpired = (expiresAt, now = new Date()) => !expiresAt || new Date(expiresAt) <= now

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const validateBootstrapInput = ({ code, nome, email, senha }) => {
  if (!code || !nome || !email || !senha) return 'Código, nome, e-mail e senha são obrigatórios.'
  if (nome.trim().length < 2) return 'Informe um nome válido.'
  if (!isValidEmail(email.trim())) return 'Informe um e-mail válido.'
  if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
  return null
}

module.exports = {
  BOOTSTRAP_CODE_TTL_MS,
  BOOTSTRAP_LOCK_MS,
  MAX_BOOTSTRAP_ATTEMPTS,
  generateBootstrapCode,
  hashBootstrapCode,
  isBootstrapCodeExpired,
  matchesBootstrapCode,
  validateBootstrapInput
}
