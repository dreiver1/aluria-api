const express = require('express');
const router = express.Router();
const administradoresControlers = require('../controllers/administradoresControlers')
const auth = require('../middlewares/authController');

router.get("/", auth, administradoresControlers.GetAllAdmin);
router.get("/:id", auth, administradoresControlers.GetAdminById);
router.post("/", auth, administradoresControlers.CreateAdmin);
router.put("/:id", auth, administradoresControlers.AlteraAdmin);
router.delete("/:id", auth, administradoresControlers.DelteAdm);
router.post('/login',  administradoresControlers.conectAdmin);

module.exports = router;
