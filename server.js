require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
// const bodyParser = require('body-parser'); // Remove if not using Twilio anymore

// IMPORT THE NEW BOT
const initializeWhatsAppBot = require('./services/whatsappBot');

connectDB();
const app = express();

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://civic-resolves.web.app',
        'https://civic-resolves.firebaseapp.com'
    ],
    credentials: true
}));

app.use(express.json());
app.disable('etag');

app.use('/api/issues', require('./routes/issue.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
// app.use('/api/whatsapp', require('./routes/whatsapp.routes')); // Remove Twilio Route

app.get('/', (req, res) => {
    res.send('CivicResolve API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    
    // START WHATSAPP BOT
    initializeWhatsAppBot();
});