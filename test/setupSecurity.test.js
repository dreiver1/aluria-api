const assert = require('node:assert/strict')
const test = require('node:test')
const {
  generateBootstrapCode,
  hashBootstrapCode,
  isBootstrapCodeExpired,
  matchesBootstrapCode,
  validateBootstrapInput
} = require('../src/setupSecurity')

test('gera código de bootstrap aleatório e verifica somente o hash', () => {
  const code = generateBootstrapCode()
  const hash = hashBootstrapCode(code)

  assert.ok(code.length >= 32)
  assert.notEqual(hash, code)
  assert.equal(matchesBootstrapCode(code, hash), true)
  assert.equal(matchesBootstrapCode('codigo-incorreto', hash), false)
})

test('detecta código expirado', () => {
  const now = new Date('2026-10-13T12:00:00.000Z')

  assert.equal(isBootstrapCodeExpired(new Date('2026-10-13T11:59:59.000Z'), now), true)
  assert.equal(isBootstrapCodeExpired(new Date('2026-10-13T12:00:01.000Z'), now), false)
})

test('valida os dados mínimos do primeiro administrador', () => {
  assert.equal(validateBootstrapInput({ code: '', nome: '', email: '', senha: '' }), 'Código, nome, e-mail e senha são obrigatórios.')
  assert.equal(validateBootstrapInput({ code: 'code', nome: 'Admin', email: 'invalido', senha: 'StrongPass123!' }), 'Informe um e-mail válido.')
  assert.equal(validateBootstrapInput({ code: 'code', nome: 'Admin', email: 'admin@example.com', senha: 'short' }), 'A senha deve ter pelo menos 8 caracteres.')
  assert.equal(validateBootstrapInput({ code: 'code', nome: 'Admin', email: 'admin@example.com', senha: 'StrongPass123!' }), null)
})
