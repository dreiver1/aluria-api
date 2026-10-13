let envLoaded = false

const loadEnv = () => {
    if (!envLoaded) {
        require('dotenv').config()
        envLoaded = true
    }
}

const createPrismaClient = () => {
    const { PrismaClient } = require('@prisma/client')
    return new PrismaClient()
}

let prisma
let bcrypt
let jwt

const getPrisma = () => {
    prisma ||= createPrismaClient()
    return prisma
}

const getBcrypt = () => {
    bcrypt ||= require('bcrypt')
    return bcrypt
}

const getJwt = () => {
    jwt ||= require('jsonwebtoken')
    return jwt
}


exports.CreateAdmin = async (req, res) => {
    try {
        loadEnv()
        const { nome, celular, email, cpf, dataNascimento, senha } = req.body;
        const getAdminByEmail = await getPrisma().administradores.findUnique({
            where: { email }
        });
        if (getAdminByEmail) {
            return res.json({ message: "Usuario já cadastrado" })
        }
        getBcrypt().hash(senha, 10, async (error, hash) => {
            if (error) {
                return res.status(500).json({ message: error })
            }
            const queryadicionaNovoUsuario = await getPrisma().administradores.create({
                data: {
                    nome,
                    celular,
                    cpf,
                    email,
                    dataNascimento,
                    senha: hash
                }
            })
            return res.status(200).json({ message: 'usuario cadastrado com sucesso!' })
        })
    }
    catch (error) {
        console.log(error)
        return res.json({ message: 'ocorreu um erro' })
    }
}

const createAdminLoginHandler = ({
    prismaClient,
    bcryptClient,
    jwtClient
} = {}) => async (req, res) => {
    try {
        if (!prismaClient || !bcryptClient || !jwtClient) {
            loadEnv()
        }
        const prismaService = prismaClient || getPrisma()
        const bcryptService = bcryptClient || getBcrypt()
        const jwtService = jwtClient || getJwt()
        const { email, senha } = req.body || {}

        if (!email || !senha) {
            return res.status(400).json({ message: "Email e senha são obrigatórios" })
        }

        const admin = await prismaService.administradores.findUnique({
            where: { email }
        })

        if (!admin || !(await bcryptService.compare(senha, admin.senha))) {
            return res.status(401).json({ message: "Credenciais inválidas" })
        }

        const token = jwtService.sign({
            id_usuario: admin.idAdm,
            email: admin.email
        }, process.env.JWT_KEY, {
            expiresIn: '2h'
        })

        return res.status(200).json({
            message: "autenticado com sucesso",
            token
        })
    } catch (error) {
        console.error('Erro ao autenticar administrador:', error.message)
        return res.status(500).json({ message: "internal server error" })
    }
}

exports.createAdminLoginHandler = createAdminLoginHandler
exports.conectAdmin = createAdminLoginHandler()

exports.GetAllAdmin = async (req, res) => {
    try {
        const result = await getPrisma().administradores.findMany();
        return res.json(result);
    } catch (error) {
        return res.json("ocorreu um erro: " + error);
    }
}

exports.GetAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getPrisma().administradores.findUnique({ where: { idAdm: Number(id) } })
        if (!result) {
            return res.json({ error: "Não possivel encotrar esse usuario" });
        }
        return res.json(result);
    } catch (error) {
        return res.json("ocorreu um erro: " + error);
    }
}

exports.GetAdminByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const admin = await getPrisma().administradores.findFirst({ where: email });
        return res.json(admin)
    } catch (error) {
        return res.json("ocorreu um erro: " + error)
    }
}

exports.AlteraAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, cpf, dataNascimento, celular } = req.body;
        let admin = await getPrisma().administradores.findUnique({ where: { idAdm: Number(id) } })
        if (!admin) {
            return res.json({ error: "Não possivel encotrar esse usuario" });
        }
        admin = await getPrisma().administradores.update({
            where: { idAdm: Number(id) },
            data: { nome, email, celular, cpf, dataNascimento },
        });

        return (res.json(admin));

    } catch (error) {
        return res.json("ocorreu um erro: " + error);
    }
}

exports.DelteAdm = async (req, res) => {
    try {
        const { id } = req.params;
        let admin = await getPrisma().administradores.findUnique({
            where: { idAdm: Number(id) }
        })
        if (!admin) {
            return res.json("Não foi possivel encontrar este usuario");
        }
        admin = await getPrisma().administradores.delete({
            where: { idAdm: Number(id), }
        })
        return res.json(admin);
    } catch (error) {
        return res.json("ocorreu um erro: " + error);
    }
}
