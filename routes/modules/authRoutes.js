const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const jwtMiddleware = require('express-jwt-middleware');
var jwtCheck = jwtMiddleware(process.env.API_SECRET)
const auth_api = require("../../api/controller/AuthController");
const router = express.Router();

router.post('/register', auth_api.register);
router.post('/login', auth_api.login);
router.get('/me', auth_api.me);
router.post('/logout', auth_api.me);
router.get('/verifikasi-akun', auth_api.verifikasi_akun);
router.post('/send-email-reset-password', auth_api.send_email_reset_password);
router.put('/save-reset-password',  auth_api.resetPassword);

module.exports = router;