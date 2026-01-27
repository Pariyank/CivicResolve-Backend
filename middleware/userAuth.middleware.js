const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Get Header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'No Authorization header found.' });
    }

    // 2. Get Token
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided.' });
    }

    try {
        // 3. Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. CRITICAL CHECK: Ensure token belongs to a User/Worker
        if (!decoded.user) {
            // If it's an Admin/Dept token (decoded.officer), we must block it here
            return res.status(403).json({ message: 'Access denied. This route is for Citizens/Workers only.' });
        }

        // 5. Success
        req.user = decoded.user;
        next();
        
    } catch (err) {
        console.error("User Auth Error:", err.message);
        res.status(401).json({ message: 'Token is not valid.' });
    }
};