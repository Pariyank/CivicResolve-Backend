const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ user: { id } }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/users/register
exports.registerUser = async (req, res) => {
    console.log("--- Register Request Received ---");
    console.log("Data:", req.body);

    try {
        // Extract all fields including role and department
        const { name, email, password, role, department } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user (Include role and department!)
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'citizen',         // Default to citizen if missing
            department: department || 'None' // Default to None
        });

        if (user) {
            console.log("User Created:", user._id, "Role:", user.role);
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,            // <--- IMPORTANT
                department: user.department, // <--- IMPORTANT
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
exports.loginUser = async (req, res) => {
    console.log("--- Login Request Received ---");
    console.log("Email:", req.body.email);

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please add email and password' });
        }

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            console.log("Login Success:", user.email, "Role:", user.role);
            
            // Return User Data WITH Role
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,            // <--- CRITICAL FIX: Used by frontend to verify account type
                department: user.department, // <--- CRITICAL FIX: Used by worker dashboard
                token: generateToken(user._id)
            });
        } else {
            console.log("Login Failed: Invalid Credentials");
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};