const express = require('express');
const router = express.Router();
const { signup, verifyOtp, login } = require('../controller/authController');

router.post('/signup', signup);
router.post('/verify', verifyOtp);
router.post('/login', login);

module.exports = router;