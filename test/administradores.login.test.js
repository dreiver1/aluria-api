const assert = require('node:assert/strict')
const test = require('node:test')
const { createAdminLoginHandler } = require('../src/controllers/administradoresControlers')

const admin = {
    idAdm: 7,
    email: 'admin@example.com',
    senha: 'hash-da-senha'
}

const createResponse = () => {
    const response = {
        statusCode: 200,
        body: undefined,
        status (statusCode) {
            response.statusCode = statusCode
            return response
        },
        json (body) {
            response.body = body
            return response
        }
    }
    return response
}

const createHandler = ({ adminRecord = admin, passwordMatches = true } = {}) => {
    let compareCalls = 0
    let signCalls = 0
    const handler = createAdminLoginHandler({
        prismaClient: {
            administradores: {
                findUnique: async () => adminRecord
            }
        },
        bcryptClient: {
            compare: async () => {
                compareCalls += 1
                return passwordMatches
            }
        },
        jwtClient: {
            sign: () => {
                signCalls += 1
                return 'token-de-teste'
            }
        }
    })

    return { handler, getCompareCalls: () => compareCalls, getSignCalls: () => signCalls }
}

test('faz login com credenciais válidas', async () => {
    const { handler, getSignCalls } = createHandler()
    const response = createResponse()

    await handler({ body: { email: admin.email, senha: 'senha-correta' } }, response)

    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body, {
        message: 'autenticado com sucesso',
        token: 'token-de-teste'
    })
    assert.equal(getSignCalls(), 1)
    assert.equal(response.body.senha, undefined)
})

test('recusa senha incorreta sem emitir token', async () => {
    const { handler, getSignCalls } = createHandler({ passwordMatches: false })
    const response = createResponse()

    await handler({ body: { email: admin.email, senha: 'senha-incorreta' } }, response)

    assert.equal(response.statusCode, 401)
    assert.deepEqual(response.body, { message: 'Credenciais inválidas' })
    assert.equal(response.body.token, undefined)
    assert.equal(getSignCalls(), 0)
})

test('recusa usuário inexistente sem comparar senha ou emitir token', async () => {
    const { handler, getCompareCalls, getSignCalls } = createHandler({ adminRecord: null })
    const response = createResponse()

    await handler({ body: { email: 'inexistente@example.com', senha: 'qualquer' } }, response)

    assert.equal(response.statusCode, 401)
    assert.deepEqual(response.body, { message: 'Credenciais inválidas' })
    assert.equal(getCompareCalls(), 0)
    assert.equal(getSignCalls(), 0)
})

test('recusa campos ausentes sem consultar banco ou emitir token', async () => {
    const { handler, getCompareCalls, getSignCalls } = createHandler()
    const response = createResponse()

    await handler({ body: { email: '' } }, response)

    assert.equal(response.statusCode, 400)
    assert.deepEqual(response.body, { message: 'Email e senha são obrigatórios' })
    assert.equal(getCompareCalls(), 0)
    assert.equal(getSignCalls(), 0)
})
