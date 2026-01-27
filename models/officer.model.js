const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ward: { type: String, required: true }, // Required for Admins
    
    // UPDATED: Enum must include 'department'
    role: { 
        type: String, 
        enum: ['admin', 'department'], 
        default: 'admin' 
    },
    
    // NEW FIELD: To store "Garbage", "Water Leak", etc.
    department: { type: String } 
}, { timestamps: true });

const Officer = mongoose.model('Officer', officerSchema);
module.exports = Officer;