const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    console.log("--- Admin Middleware Triggered ---");

    const authHeader = req.header('Authorization');
    if (!authHeader) {
        console.log("Admin Auth Failed: No Header");
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log("Admin Auth Failed: No Token String");
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.officer) {
            console.log("Admin Auth Failed: Token is for a User, not an Admin");
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        req.officer = decoded.officer;
        // Use .name or .id because .email is not in the token payload
        console.log("Admin Auth Success for Officer ID:", req.officer.id);
        next();

    } catch (err) {
        console.error("Admin Auth Error:", err.message);
        res.status(401).json({ message: 'Token is not valid.' });
    }
};