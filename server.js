require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const bodyParser = require('body-parser'); // Import body-parser

connectDB();
const app = express();

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://civicresolve-ff157.web.app',
        'https://civicresolve-ff157.firebaseapp.com'
    ],
    credentials: true
}));

// --- MIDDLEWARE FOR TWILIO ---
app.use(bodyParser.urlencoded({ extended: false })); // For Twilio
app.use(express.json()); // For React
// -----------------------------

app.disable('etag');

app.use('/api/issues', require('./routes/issue.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/whatsapp', require('./routes/whatsapp.routes')); // NEW

app.get('/', (req, res) => {
    res.send('CivicResolve API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));