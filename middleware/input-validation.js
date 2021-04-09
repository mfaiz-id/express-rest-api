const { check } = require('express-validator');

exports.registerValidation = [
    check('nik', 'NIK tidak boleh kosong').not().isEmpty(),
    check('nama', 'Nama tidak boleh kosong').not().isEmpty(),
    check('no_hp', 'HP tidak boleh kosong').not().isEmpty(),
    check('email', 'Email tidak valid').isEmail(),
    check('password', 'Password minimal 6 karakter').isLength({ min: 6 })
]