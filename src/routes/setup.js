const express = require('express')
const { createBootstrapHandler, getSetupStatus } = require('../controllers/setupController')

const router = express.Router()

router.get('/status', getSetupStatus)
router.post('/bootstrap', createBootstrapHandler())

module.exports = router
