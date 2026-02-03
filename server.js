require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// IMPORT THE NEW BOT
const initializeWhatsAppBot = require('./services/whatsappBot');

connectDB();
const app = express();

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://civicresolve-ff157.web.app',
        'https://civicresolve-ff157.firebaseapp.com',
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

app.get('/', (req, res) => {
    res.send('CivicResolve API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    
    // --- CRITICAL FIX ---
    // Only run WhatsApp Bot if we are NOT on Render
    // Render sets an environment variable 'RENDER'. If it exists, we skip the bot.
    if (!process.env.RENDER) {
        console.log("Running Locally: Starting WhatsApp Bot...");
        initializeWhatsAppBot();
    } else {
        console.log("Running on Cloud: WhatsApp Bot disabled to prevent crash (Free Tier Limit).");
    }
});