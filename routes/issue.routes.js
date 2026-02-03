const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Issue = require('../models/issue.model');
const User = require('../models/user.model');
const upload = require('../config/cloudinary');
const adminAuth = require('../middleware/auth.middleware'); 
const userAuth = require('../middleware/userAuth.middleware'); 

// --- DUPLICATE CHECK HANDLER ---
const checkDuplicateHandler = async (req, res) => {
    try {
        const { lat, lng, category } = req.body;
        
        if (!lat || !lng || !category) {
            return res.status(400).json({ message: "Missing location or category" });
        }

        // MongoDB Geospatial Query ($near)
        // Checks for issues within 50 meters
        const duplicates = await Issue.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] }, 
                    $maxDistance: 50 
                }
            },
            category: category,
            // Only find 'Active' issues. 
            status: { $nin: ['Resolved', 'Closed', 'Work Rejected'] } 
        });

        res.json(duplicates);
    } catch (error) {
        console.error("Duplicate Check Error:", error);
        res.status(500).json({ message: "Server Error checking duplicates" });
    }
};

// --- EXISTING HANDLERS (Briefly listed to maintain file structure) ---

const reportIssueHandler = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ message: 'Auth failed' });
        const { location, ward, category, description, isHazard } = req.body;
        let parsedLocation;
        try { parsedLocation = JSON.parse(location); } catch(e) { parsedLocation = { latitude: 0, longitude: 0 } }

        // Auto-Assign Logic
        const deptMapping = {
            "Garbage": "Garbage", "Road Defect": "Road Defect", "Streetlight Outage": "Streetlight Outage",
            "Water Leak": "Water Leak", "Sewage Block": "Sewage Block", "Public Vandalism": "Public Vandalism", "Other": null
        };
        const targetDept = deptMapping[category];
        let initialStatus = targetDept ? 'Assigned to Dept' : 'Received';
        let assignedDept = targetDept || null;
        let historyEntry = targetDept ? [{ status: 'Assigned to Dept', changedBy: 'System (Auto-Routing)', timestamp: new Date() }] : [];

        let priority = 'Medium';
        if (isHazard === 'true' || isHazard === true) priority = 'High';
        if (['Sewage Block', 'Water Leak'].includes(category)) priority = 'High';

        const newIssue = new Issue({
            ticketId: `CIV-${uuidv4().split('-')[0].toUpperCase()}`,
            reportedBy: req.user.id,
            location: { type: 'Point', coordinates: [parsedLocation.longitude, parsedLocation.latitude] },
            ward, category, description, 
            imageUrl: req.file ? req.file.path : '',
            status: initialStatus,
            assignedDepartment: assignedDept, 
            isHazard: isHazard === 'true' || isHazard === true,
            priority: priority,
            history: historyEntry 
        });

        await newIssue.save();
        res.status(201).json({ message: 'Reported', ticketId: newIssue.ticketId });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAllIssuesHandler = async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 }).populate('assignedWorker', 'name');
        res.json(issues);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const assignToDeptHandler = async (req, res) => {
    try {
        const { department } = req.body; 
        const issue = await Issue.findById(req.params.id);
        if(!issue) return res.status(404).json({ message: "Issue not found" });
        issue.assignedDepartment = department;
        issue.status = 'Assigned to Dept'; 
        issue.history.push({ status: 'Assigned to Dept', changedBy: 'Admin', timestamp: new Date() });
        await issue.save();
        res.json(issue);
    } catch (error) { res.status(500).json({ message: 'Database Error: ' + error.message }); }
};

const updateStatusHandler = async (req, res) => {
    try {
        const { status, resolutionNote, resolutionCost } = req.body; 
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        issue.status = status;
        if (status === 'Resolved') issue.citizenFeedback = 'Pending';
        if (resolutionNote) issue.resolutionNote = resolutionNote;
        if (resolutionCost) issue.resolutionCost = resolutionCost;
        if (req.file) issue.resolutionImageUrl = req.file.path;

        const officerEmail = req.officer ? req.officer.email : 'Admin';
        issue.history.push({ status: status, changedBy: officerEmail, timestamp: new Date() });

        await issue.save();
        res.json(issue);
    } catch (error) { res.status(500).json({ message: 'Database Error: ' + error.message }); }
};

const submitFeedbackHandler = async (req, res) => {
    try {
        const { feedback } = req.body;
        const issue = await Issue.findOne({ ticketId: req.params.ticketId });
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        issue.citizenFeedback = feedback;
        if (feedback === 'Unsatisfied') {
            issue.status = 'Escalated';
            if (issue.resolutionImageUrl) issue.previousResolutionUrl = issue.resolutionImageUrl;
            issue.resolutionImageUrl = ""; 
            issue.history.push({ status: 'Escalated', changedBy: 'Citizen (Feedback)', timestamp: new Date() });
        }
        await issue.save();
        res.json({ message: 'Feedback submitted', issue });
    } catch (error) { res.status(500).json({ message: 'Server error.' }); }
};

const getDeptIssuesHandler = async (req, res) => {
    try {
        const myDept = req.officer.department; 
        const issues = await Issue.find({ assignedDepartment: myDept }).sort({ createdAt: -1 }).populate('assignedWorker', 'name');
        res.json(issues);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const assignToWorkerHandler = async (req, res) => {
    try {
        const { workerId } = req.body;
        const issue = await Issue.findById(req.params.id);
        issue.assignedWorker = workerId;
        issue.status = 'Assigned to Worker';
        issue.history.push({ status: 'Assigned to Worker', changedBy: req.officer.email });
        await issue.save();
        res.json(issue);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const workerCompleteHandler = async (req, res) => {
    try {
        const { note, resolutionCost } = req.body;
        const issue = await Issue.findById(req.params.id);
        issue.status = 'Resolved';
        issue.citizenFeedback = 'Pending';
        issue.resolutionNote = note;
        if (resolutionCost) issue.resolutionCost = resolutionCost;
        if (req.file) issue.resolutionImageUrl = req.file.path;
        issue.history.push({ status: 'Resolved', changedBy: 'Worker' });
        await issue.save();
        res.json(issue);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getWorkerIssuesHandler = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(403).json({ message: "Access Denied" });
        const issues = await Issue.find({ assignedWorker: req.user.id }).sort({ createdAt: -1 });
        res.json(issues);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyIssuesHandler = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(403).json({ message: "Access Denied" });
        const issues = await Issue.find({ reportedBy: req.user.id }).sort({ createdAt: -1 });
        res.json(issues);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getWorkersByDeptHandler = async (req, res) => {
    try {
        const { dept } = req.params;
        const workers = await User.find({ role: 'worker', department: dept }).select('name email _id');
        res.json(workers);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getPublicMapHandler = async (req, res) => {
    try {
        const issues = await Issue.find({}, 'location category status imageUrl resolutionCost');
        res.json(issues);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getStatsHandler = async (req, res) => {
    try {
        const total = await Issue.countDocuments();
        const resolved = await Issue.countDocuments({ status: { $in: ['Resolved', 'Closed'] } });
        const pending = total - resolved;
        const categoryStats = await Issue.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
        const totalCitizens = await User.countDocuments({ role: 'citizen' });
        res.json({ total, resolved, pending, categoryStats, totalCitizens });
    } catch (error) { res.status(500).json({ message: "Error" }); }
};

// --- ROUTES ---
router.post('/report', userAuth, upload.single('issueImage'), reportIssueHandler);
router.post('/check-duplicate', userAuth, checkDuplicateHandler); // <--- NEW ROUTE
router.get('/my-issues', userAuth, getMyIssuesHandler);
router.get('/track/:ticketId', async (req, res) => res.json(await Issue.findOne({ ticketId: req.params.ticketId })));
router.get('/stats', getStatsHandler);
router.get('/public-map', getPublicMapHandler);
router.put('/feedback/:ticketId', submitFeedbackHandler);

// Admin
router.get('/admin/all', adminAuth, getAllIssuesHandler);
router.put('/assign-dept/:id', adminAuth, assignToDeptHandler);
router.put('/:id/status', adminAuth, upload.single('resolutionImage'), updateStatusHandler);

// Dept/Worker
router.get('/dept/all', adminAuth, getDeptIssuesHandler);
router.get('/worker/tasks', userAuth, getWorkerIssuesHandler);
router.get('/workers/:dept', adminAuth, getWorkersByDeptHandler);
router.put('/assign-worker/:id', adminAuth, assignToWorkerHandler);
router.put('/worker-complete/:id', userAuth, upload.single('resolutionImage'), workerCompleteHandler);

router.delete('/nuke-all-issues', async (req, res) => {
    try { await Issue.deleteMany({}); res.json({ message: "Cleaned" }); } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;