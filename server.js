require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to the database right away
connectDB();

const app = express();

// --- FIXED CORS CONFIGURATION ---
// Notice the square brackets [] creating an array of allowed URLs
app.use(cors({
    origin: [
        'http://localhost:3000',                        // Local Development
        'https://civicresolve-ff157.web.app',           // Live Firebase Frontend
        'https://civicresolve-ff157.firebaseapp.com'    // Alternate Firebase URL
    ],
    credentials: true // Allow cookies/headers
}));
// --------------------------------

app.use(express.json());
app.disable('etag'); // Disables caching to prevent 304 errors


// --- Define All API Routes Here ---
app.use('/api/issues', require('./routes/issue.routes')); // For handling issues
app.use('/api/auth', require('./routes/auth.routes'));     // For admin login/registration
app.use('/api/users', require('./routes/user.routes'));     // For user login/registration


// A default route for testing if the server is up
app.get('/', (req, res) => {
    res.send('CivicResolve API is running...');
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));