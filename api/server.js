// DateMe/api/server.js - FIXED WITH ALL IMPORTS
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const uploadRoute = require('./routes/upload'); // CSV upload route (kept)
const adminRoute = require('./routes/admin');  // Admin consolidated routes
const fs = require('fs');                       // ← ADDED: File system
const path = require('path');                  // ← ADDED: Path utilities
const submitRoute = require('./routes/submit'); // ← NEW: Public submission route


// Load environment variables from .env FIRST
dotenv.config(); // ← LOAD BEFORE ANYTHING ELSE

console.log('🚀 Express server starting...');
console.log(`📍 Running on port ${process.env.PORT || 3001}`);
console.log('📁 Data files: reviews.json, admin.json (consolidated)');
console.log('⚙️ Bcrypt and JWT authentication enabled');

// Initialize config ONCE at startup
const configInit = require('./config').initialize;
const configCache = configInit(); // Store sanitized config

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Add CORS middleware FIRST
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log('📂 Mounting routes...');

// 🆕 UPDATED: Public reviews endpoint (reads from consolidated file, filters hidden)
app.get('/api/reviews', (req, res) => {
    const REVIEW_FILE = path.join(__dirname, 'reviews.json');

    try {
        console.log('📡 GET /api/reviews requested');

        if (!fs.existsSync(REVIEW_FILE)) {
            return res.status(404).json({ error: "Reviews file not found" });
        }

        const data = fs.readFileSync(REVIEW_FILE, 'utf-8');
        let reviews = JSON.parse(data);

        console.log('✅ Reviews loaded:', reviews.length, 'reviews');

        // Filter out hidden reviews from public view
        const visibleReviews = reviews.filter(r => !r.hidden && !r.deletedAt);
        
        console.log(`📊 Visible (filtered): ${visibleReviews.length} reviews`);

        res.json(visibleReviews);
    } catch (err) {
        console.error("❌ Error fetching public reviews:", err.message);
        return res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// 🆕 MOUNT ADMIN ROUTES (Standard path convention: /api/admin)
app.use('/api/admin', adminRoute);
// ✅ NEW: Mount Public Review Submission Route (Anonymous Submissions)
app.use('/api/submit', submitRoute);
// Define route for CSV uploads (existing) - deprecated but kept for legacy scripts
app.use('/upload', uploadRoute);

// ✅ UPDATED: Serve static files from public folder
app.use(express.static('public'));

// Start the server with logging
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔑 Admin password default: admin123 (Bcrypt hashed)`);
});
