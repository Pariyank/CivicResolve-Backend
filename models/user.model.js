const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // NEW FIELDS
    role: { 
        type: String, 
        enum: ['citizen', 'worker'], 
        default: 'citizen' 
    },
    department: { 
        type: String, 
        enum: ['Garbage', 'Road Defect', 'Streetlight Outage', 'Water Leak', 'Sewage Block', 'Public Vandalism', 'Other', 'None'],
        default: 'None'
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;