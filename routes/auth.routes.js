const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// @route   POST /api/auth/register
// @desc    Register a new officer (for testing purposes)
router.post('/register', authController.registerOfficer);

// @route   POST /api/auth/login
// @desc    Login for officers and get a token
router.post('/login', authController.loginOfficer);

module.exports = router;