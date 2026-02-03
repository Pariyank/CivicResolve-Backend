const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
    status: { type: String, required: true },
    changedBy: { type: String }, 
    timestamp: { type: Date, default: Date.now }
});

const issueSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [Longitude, Latitude]
    },
    ward: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, maxLength: 500 },
    imageUrl: { type: String, required: true },
    
    status: {
        type: String,
        required: true,
        enum: [
            'Received', 
            'Assigned to Dept', 
            'Assigned to Worker', 
            'Work In Progress', 
            'Resolved', 
            'Work Rejected', 
            'Closed',
            'Escalated' 
        ],
        default: 'Received'
    },
    
    resolutionCost: { type: Number, default: 0 }, 
    assignedDepartment: { type: String }, 
    assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNote: { type: String },
    resolutionImageUrl: { type: String }, 
    previousResolutionUrl: { type: String }, 
    rejectionReason: { type: String },
    isHazard: { type: Boolean, default: false },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
    citizenFeedback: { type: String, enum: ['Pending', 'Satisfied', 'Unsatisfied'], default: 'Pending' },

    history: [statusHistorySchema]
}, { timestamps: true });

// --- CRITICAL: GEOSPATIAL INDEX ---
issueSchema.index({ location: '2dsphere' });

const Issue = mongoose.model('Issue', issueSchema);
module.exports = Issue;