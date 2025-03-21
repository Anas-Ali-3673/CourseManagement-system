const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

router.route('/login').post(login);

module.exports = router;
