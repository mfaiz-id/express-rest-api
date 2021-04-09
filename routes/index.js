require('dotenv').config();
var express = require('express');
var router = express.Router();
const knex = require('../db/knex');
const cron = require('node-cron');

const jwtMiddleware = require('express-jwt-middleware');
var jwtCheck = jwtMiddleware(process.env.API_SECRET)

var user_api = require('../api/controller/UserController');
var auth_api = require('../api/controller/AuthController');

const { registerValidation } = require('../middleware/input-validation');


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Auth
router.post('/Auth/register', auth_api.register);
router.post('/Auth/register_masyarakat', registerValidation, auth_api.register_masyarakat);
router.post('/Auth/login', auth_api.login);
router.get('/Auth/me', auth_api.me);
router.post('/Auth/logout', auth_api.me);
router.post('/Auth/verifikasi-akun', auth_api.verifikasi_akun);
router.post('/Auth/reset-password', auth_api.send_email_reset_password);
router.post('/Auth/save-reset-password',  auth_api.resetPassword);

module.exports = router;
