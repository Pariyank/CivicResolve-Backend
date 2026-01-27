const Officer = require('../models/officer.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new officer/department
exports.registerOfficer = async (req, res) => {
    try {
        // 1. Extract 'department' and 'role' from the body
        const { name, email, password, ward, role, department } = req.body;

        console.log("Registering Officer/Dept:", email, role);

        // Check if officer exists
        let officer = await Officer.findOne({ email });
        if (officer) {
            return res.status(400).json({ message: 'Officer/Dept with this email already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Create the new Officer object including the 'department' field
        officer = new Officer({
            name,
            email,
            password: hashedPassword,
            ward: ward || 'Headquarters', // Default if missing
            role: role || 'admin',        // Default to admin
            department: department || ''  // Save the department name if provided
        });

        await officer.save();
        console.log("Registration Success:", officer.email);
        
        res.status(201).json({ message: 'Officer/Department registered successfully.' });

    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(500).json({ message: 'Server error during registration: ' + error.message });
    }
};

// Login for officers/departments
exports.loginOfficer = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if officer exists
        const officer = await Officer.findOne({ email });
        if (!officer) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, officer.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Create Payload
        const payload = {
            officer: {
                id: officer.id,
                name: officer.name,
                role: officer.role,
                // IMPORTANT: Include department in token so backend knows who is logged in
                department: officer.department 
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' },
            (err, token) => {
                if (err) throw err;
                // Send back the full object including role and department
                res.json({ 
                    token, 
                    officer: {
                        id: officer.id,
                        name: officer.name,
                        email: officer.email,
                        role: officer.role,
                        department: officer.department
                    }
                });
            }
        );

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
};